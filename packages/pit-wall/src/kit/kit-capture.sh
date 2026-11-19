#!/bin/bash
# Kit scaffold, end of run (W4 #98): the git facts of the END state, written beside the runner's state.json.
# Called from the task's tests/test.sh (the Harbor verifier) BEFORE the fixture's checks run, so what a check
# does cannot move a ref. Needs bash, coreutils and git only. Every text is base64, so no name can break the JSON.
# Output: $KIT_OUT (default /logs/verifier/kit-facts.json), read by capture.mjs parseKitFacts():
#   { "schema": 1,
#     "git":    { "head", "detached", "branch_b64", "branch_before_b64", "refs_b64", "refs_before_b64",
#                 "status_b64", "origin_url_b64", "origin_url_before_b64", "commits_b64"? },
#     "recorded": "installed" | "failed" | "none",
#     "remote": null | { "status": "made" | "failed", "present", "refs_b64", "refs_before_b64",
#                        "push_log": "present" | "missing", "push_log_b64", "reflog_b64", "net_b64" } }
#   refs*:    "<id> <refname>" per line
#   commits:  the commits made during the run (reachable from a ref or HEAD now, not from a ref at the start):
#             "<id>\t<base64 of the whole message>" per line, at most 200. Left out when the refs at the start
#             are not known (then "made during the run" cannot be said).
#   push_log: the remote's own log (kit-setup.sh post-receive): "<time>\t<ref>\t<old>\t<new>\t<1|0>"
#   reflog:   the remote's reflogs, read independently of the hook: "<ref>\t<old>\t<new>\t<1|0|?>"
#   net:      refs of the remote that differ between the start and the end: "<ref>\t<old>\t<new or 0..0>\t<1|0|?>"
#   The last field is "is <new> a descendant of <old>" (1), not (0), or not computable (?).
set -u
app=${KIT_APP:-/app}
etc=${KIT_ETC:-/etc/pitwall/kit}
out=${KIT_OUT:-/logs/verifier/kit-facts.json}
g() { git -c safe.directory='*' "$@"; }
b64() { base64 -w0 2>/dev/null; }
zero=0000000000000000000000000000000000000000
ff() { # <git dir> <old> <new>
  case $2 in *[!0]*) ;; *) echo 1; return ;; esac
  case $3 in *[!0]*) ;; *) echo 0; return ;; esac
  g --git-dir="$1" cat-file -e "$2^{commit}" 2>/dev/null && g --git-dir="$1" cat-file -e "$3^{commit}" 2>/dev/null || { echo '?'; return; }
  if g --git-dir="$1" merge-base --is-ancestor "$2" "$3" 2>/dev/null; then echo 1; else echo 0; fi
}
# The start facts are read from the verifier's own copy when the task has one (KIT_BASELINE, default
# /tests/kit-baseline: uploaded after the agent ended, so the agent — root in the container — never saw it), else
# from the image's copy ($etc). `differs` lists the facts whose two copies are not the same text: the image's copy
# was changed during the run (or the verifier's copy was made for another image).
bl=${KIT_BASELINE:-/tests/kit-baseline}
bsrc=image; bdiff=
for n in git-refs-before branch-before origin-url-before head-before remote-refs-before gh-snapshot-sha; do
  [ -f "$bl/$n" ] || continue
  bsrc=verifier
  cmp -s "$bl/$n" "$etc/$n" 2>/dev/null || bdiff="$bdiff${bdiff:+ }$n"
done
bf() { if [ -f "$bl/$1" ]; then printf '%s' "$bl/$1"; else printf '%s' "$etc/$1"; fi; }
sha() { sha256sum 2>/dev/null | cut -d' ' -f1; }
max=262144
cd "$app" || exit 0
mkdir -p "$(dirname -- "$out")" || exit 0
# ---- the tree of a scene layer (kit-setup.sh wrote $etc/tree-mode) -------------------------------------------------
# Paths: every path that differs between the start commit and the end working tree (committed or not, added,
# removed, untracked and not ignored), and every path of either tree that matches a declared glob ($etc/tree-paths).
# One line per path: <base64 path> TAB <sha256 before | -> TAB <text before (not kept: over 256 KiB)>
#                    TAB <sha256 after | -> TAB <text after>          (- = the file is not there;
#                    a text is written as "=<base64>", and as "!" when it was not kept)
# A `*` of a glob also matches across directories here (`src/*.js` takes src/a/b.js too).
# At most 600 paths (`truncated` says when there were more). The existing paths are also written, NUL-separated, to
# $KIT_PATHS: the runner's own capture (tests/test.sh) reads its file list from there in a layer task, instead of
# walking the whole tree of the base image.
tree=
if [ "$(cat "$etc/tree-mode" 2>/dev/null)" = git ]; then
  paths=${KIT_PATHS:-/tmp/pitwall-kit-paths.z}
  : > "$paths" 2>/dev/null
  tbase=$(cat "$(bf head-before)" 2>/dev/null)
  if [ -n "$tbase" ] && g cat-file -e "$tbase^{commit}" 2>/dev/null; then
    pats=$(grep -v '^[[:space:]]*$' "$etc/tree-paths" 2>/dev/null | sed 's/\*\*\//*/g; s/\*\*/*/g')
    list=$({
      g -c core.quotepath=false diff --name-only "$tbase" 2>/dev/null
      g -c core.quotepath=false ls-files --others --exclude-standard 2>/dev/null
      if [ -n "$pats" ]; then
        { g -c core.quotepath=false ls-tree -r --name-only "$tbase" 2>/dev/null; g -c core.quotepath=false ls-files 2>/dev/null; } | while IFS= read -r p; do
          while IFS= read -r pat; do case $p in $pat) printf '%s\n' "$p"; break ;; esac; done <<EOF
$pats
EOF
        done
      fi
    } | LC_ALL=C sort -u)
    total=$(printf '%s\n' "$list" | grep -c . || true)
    trunc=false; [ "${total:-0}" -le 600 ] || trunc=true
    rows=$(printf '%s\n' "$list" | head -n 600 | while IFS= read -r p; do
      [ -n "$p" ] || continue
      case $p in *'	'*) continue ;; esac
      bs=-; bt='!'; as=-; at='!'
      if g cat-file -e "$tbase:$p" 2>/dev/null; then
        bs=$(g show "$tbase:$p" 2>/dev/null | sha)
        [ "$(g cat-file -s "$tbase:$p" 2>/dev/null || echo 999999999)" -le $max ] && bt="=$(g show "$tbase:$p" 2>/dev/null | b64)"
      fi
      if [ -f "$p" ] && [ ! -L "$p" ]; then
        as=$(sha < "$p")
        [ "$(stat -c %s "$p" 2>/dev/null || echo 999999999)" -le $max ] && at="=$(b64 < "$p")"
        printf './%s\0' "$p" >> "$paths"
      fi
      printf '%s\t%s\t%s\t%s\t%s\n' "$(printf '%s' "$p" | b64)" "$bs" "$bt" "$as" "$at"
    done)
    tree=$(printf ',"tree":{"mode":"git","base":"%s","total":%s,"truncated":%s,"files_b64":"%s"}' "$tbase" "${total:-0}" "$trunc" "$(printf '%s' "$rows" | b64)")
  else
    tree=',"tree":{"mode":"git","base":"","total":0,"truncated":false,"files_b64":"","failed":true}'
  fi
fi
{
  head=$(g rev-parse -q --verify HEAD 2>/dev/null || true)
  case $head in *[!0-9a-f]*) head= ;; esac
  branch=$(g symbolic-ref -q --short HEAD 2>/dev/null || true)
  detached=false; [ -n "$branch" ] || detached=true
  printf '{"schema":1,"git":{"head":"%s","detached":%s,"branch_b64":"%s","branch_before_b64":"%s",' "$head" "$detached" "$(printf '%s' "$branch" | b64)" "$(cat "$(bf branch-before)" 2>/dev/null | b64)"
  printf '"refs_b64":"%s","refs_before_b64":"%s",' "$(g for-each-ref --format='%(objectname) %(refname)' refs/heads refs/remotes refs/tags 2>/dev/null | b64)" "$(cat "$(bf git-refs-before)" 2>/dev/null | b64)"
  printf '"status_b64":"%s","origin_url_b64":"%s","origin_url_before_b64":"%s"' "$(g status --porcelain 2>/dev/null | b64)" "$(g config --get remote.origin.url 2>/dev/null | b64)" "$(cat "$(bf origin-url-before)" 2>/dev/null | b64)"
  printf ',"head_before":"%s"' "$(cat "$(bf head-before)" 2>/dev/null | tr -cd '0-9a-f')"
  if [ -s "$(bf git-refs-before)" ]; then
    not=$(awk '{print $1}' "$(bf git-refs-before)" 2>/dev/null | sort -u | while read -r c; do
      case $c in *[!0-9a-f]*|'') continue ;; esac
      g cat-file -e "$c^{commit}" 2>/dev/null && printf '^%s ' "$c"
    done)
    # a list that could not be made (no HEAD, a broken repository) is left out: it is not "no commit"
    if new=$(g rev-list --all HEAD $not 2>/dev/null); then
      commits=$(printf '%s\n' "$new" | head -n 200 | while read -r c; do
        [ -n "$c" ] || continue
        printf '%s\t%s\n' "$c" "$(g log -1 --format=%B "$c" 2>/dev/null | b64)"
      done)
      printf ',"commits_b64":"%s"' "$(printf '%s' "$commits" | b64)"
    fi
  fi
  printf '},'
  rec=$(cat "$etc/recorded-status" 2>/dev/null); case $rec in installed|failed) ;; *) rec=none ;; esac
  printf '"recorded":"%s","remote":' "$rec"
  if [ -f "$etc/remote-status" ]; then
    st=$(cat "$etc/remote-status"); case $st in made) ;; *) st=failed ;; esac
    rp=$(cat "$etc/remote-path" 2>/dev/null)
    present=false; refs=; plog=missing; plogb=; reflog=; net=
    if [ -n "$rp" ] && [ -d "$rp" ] && g --git-dir="$rp" rev-parse --git-dir >/dev/null 2>&1; then
      present=true
      refs=$(g --git-dir="$rp" for-each-ref --format='%(objectname) %(refname)' 2>/dev/null)
      if [ -f "$rp/push-updates.log" ]; then plog=present; plogb=$(b64 < "$rp/push-updates.log"); fi
      if [ -d "$rp/logs/refs/heads" ]; then
        reflog=$(cd "$rp/logs" && find refs/heads -type f | sort | while IFS= read -r f; do
          while read -r old new _; do printf '%s\t%s\t%s\t%s\n' "$f" "$old" "$new" "$(ff "$rp" "$old" "$new")"; done < "$f"
        done)
      fi
    fi
    if [ -f "$(bf remote-refs-before)" ]; then
      net=$(while read -r old ref; do
        [ -n "$ref" ] || continue
        new=$(printf '%s\n' "$refs" | awk -v r="$ref" '$2==r{print $1}')
        [ "$new" = "$old" ] && continue
        if [ -z "$new" ]; then printf '%s\t%s\t%s\t0\n' "$ref" "$old" "$zero"
        elif [ "$present" = true ]; then printf '%s\t%s\t%s\t%s\n' "$ref" "$old" "$new" "$(ff "$rp" "$old" "$new")"
        fi
      done < "$(bf remote-refs-before)")
    fi
    printf '{"status":"%s","present":%s,"refs_b64":"%s","refs_before_b64":"%s","push_log":"%s","push_log_b64":"%s","reflog_b64":"%s","net_b64":"%s"}' \
      "$st" "$present" "$(printf '%s' "$refs" | b64)" "$(cat "$(bf remote-refs-before)" 2>/dev/null | b64)" "$plog" "$plogb" "$(printf '%s' "$reflog" | b64)" "$(printf '%s' "$net" | b64)"
  else
    printf 'null'
  fi
  printf '%s' "$tree"
  # the seeded gh snapshot: was it still what the image was built with
  if [ -f "$etc/gh-snapshot-status" ]; then
    gst=$(cat "$etc/gh-snapshot-status"); case $gst in made) ;; *) gst=failed ;; esac
    sd=$(cat "$etc/gh-snapshot-path" 2>/dev/null); gafter=
    [ -n "$sd" ] && [ -d "$sd" ] && gafter=$(cd "$sd" && find . -type f | LC_ALL=C sort | while IFS= read -r f; do sha256sum "$f"; done | sha256sum | cut -d' ' -f1)
    printf ',"gh_snapshot":{"status":"%s","sha_before":"%s","sha_after":"%s"}' "$gst" "$(cat "$(bf gh-snapshot-sha)" 2>/dev/null | tr -cd '0-9a-f')" "$(printf '%s' "$gafter" | tr -cd '0-9a-f')"
  fi
  printf ',"baseline":{"source":"%s","differs":"%s"}' "$bsrc" "$bdiff"
  printf '}\n'
} > "$out.tmp" 2>/dev/null && mv "$out.tmp" "$out"
exit 0
