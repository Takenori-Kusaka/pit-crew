#!/bin/bash
# Kit scaffold, image side (W4 #98): run once at the end of the task image build, as the last layer, in the
# repository the fixture built. It records the facts of the START state that the grader's end-state predicates
# compare against (kit/schema/trial-record.md), and makes the two things a fixture may declare:
#   remote    a local bare remote `origin` that logs every accepted ref update (fixture.yaml `remote`)
#   recorded  wrappers that record runs of the project's documented commands with the tree they ran on
#             (fixture.yaml `recorded`), through pitwall-mark-run
# Needs bash, coreutils and git only. It never fails the build: what could not be made is written to
# $etc/*-status and the capture reports it, so a missing fact is read as "not recorded", not as "did not happen".
#
# Paths (the defaults are the container's; capture-local.mjs sets them for a run in a temporary directory):
#   KIT_APP   /app                      the repository
#   KIT_ETC   /etc/pitwall/kit          where the start facts are kept (outside the repository)
#   KIT_CONF  the directory of this file: `remote` (line 1: the branch name), `recorded.tsv`, `wrap-<word>`
#   KIT_REMOTE /srv/git/origin.git      the bare remote
#   KIT_BIN   (empty)                   empty: a wrapper replaces the command in place (the command is kept
#                                       beside it as <command>.pitwall-real). Set: wrappers are written there
#                                       and the directory must come first in PATH
#   KIT_LOCAL (empty)                   set: no system-wide git configuration is written
set -u
app=${KIT_APP:-/app}
etc=${KIT_ETC:-/etc/pitwall/kit}
conf=${KIT_CONF:-$(cd -- "$(dirname -- "$0")" && pwd)}
g() { git -c safe.directory='*' "$@"; }
mkdir -p "$etc" || exit 0
cd "$app" || exit 0

# ---- the remote -------------------------------------------------------------------------------------------
if [ -f "$conf/remote" ]; then
  branch=$(sed -n 1p "$conf/remote")
  rp=${KIT_REMOTE:-/srv/git/origin.git}
  st=failed
  # `git init` in the image may name the branch master; a fixture with a remote starts on the declared branch
  [ -z "$branch" ] || g branch -M "$branch" 2>/dev/null
  cur=$(g symbolic-ref -q --short HEAD 2>/dev/null)
  # A remote with declared branches ($conf/remote.tsv; kit/schema/role-spec.md `remote`):
  #   branch <name> <revision>   a branch of the remote, at a revision relative to the HEAD the fixture built
  #   unpushed <name>            that branch exists locally only (it is not on the remote at the start)
  #   local <name> <upstream|->  a local branch at the start, and the remote branch it tracks (- = none)
  #   start <name>               the branch the agent starts on (its revision is HEAD: the tree does not change)
  # Every revision is resolved before any ref moves. Local branches that are not listed are removed (they stay on
  # the remote, and as refs/remotes/origin/<name>).
  plan=ok
  if [ -f "$conf/remote.tsv" ]; then
    ids=$(while IFS=$'\t' read -r kind name val; do
      [ "$kind" = branch ] || continue
      id=$(g rev-parse -q --verify "$val^{commit}" 2>/dev/null) || exit 1
      printf '%s\t%s\n' "$name" "$id"
    done < "$conf/remote.tsv") || plan=failed
    if [ "$plan" = ok ]; then
      while IFS=$'\t' read -r name id; do [ -n "$name" ] || continue; g update-ref "refs/heads/$name" "$id" 2>/dev/null || plan=failed; done <<EOF
$ids
EOF
    fi
  fi
  pushall() {
    if [ -f "$conf/remote.tsv" ]; then
      while IFS=$'\t' read -r kind name _; do
        [ "$kind" = branch ] || continue
        grep -qxF -- "unpushed	$name" "$conf/remote.tsv" && continue
        g push -q origin "refs/heads/$name:refs/heads/$name" >/dev/null 2>&1 || return 1
      done < "$conf/remote.tsv"
    else g push -q -u origin --all >/dev/null 2>&1; fi
  }
  localrefs() { # after the push: the start branch, the tracking, and no other local branch
    [ -f "$conf/remote.tsv" ] || return 0
    start=$(awk -F'\t' '$1=="start"{print $2; exit}' "$conf/remote.tsv")
    [ -z "$start" ] || { g symbolic-ref HEAD "refs/heads/$start" && g reset -q --hard >/dev/null 2>&1; } || return 1
    g for-each-ref --format='%(refname:short)' refs/heads | while IFS= read -r b; do
      awk -F'\t' -v b="$b" '$1=="local" && $2==b{f=1} END{exit !f}' "$conf/remote.tsv" || g update-ref -d "refs/heads/$b"
    done
    while IFS=$'\t' read -r kind name up; do
      [ "$kind" = local ] || continue
      if [ "$up" = - ] || [ -z "$up" ]; then g config --unset "branch.$name.remote" 2>/dev/null; g config --unset "branch.$name.merge" 2>/dev/null
      else g branch -q --set-upstream-to="origin/$up" "$name" >/dev/null 2>&1 || return 1; fi
    done < "$conf/remote.tsv"
    return 0
  }
  ahead() { # the commits that exist on the remote only (scene.mjs remote.ahead): made in a clone, pushed, not fetched.
    # They are pushed before the log below is reset, so they are not updates of the run; refs/remotes/origin/* of the
    # agent's repository stay where the fixture built them (the agent has not seen this work yet)
    [ -d "$conf/remote-ahead" ] || return 0
    local d w b a t op p
    for d in "$conf"/remote-ahead/*/; do
      [ -f "$d/branch" ] || continue
      b=$(sed -n 1p "$d/branch"); w=$(mktemp -d) || return 1
      git clone -q --branch "$b" "$rp" "$w" >/dev/null 2>&1 || return 1
      while IFS=$'\t' read -r op p; do
        [ -n "$p" ] || continue
        if [ "$op" = rm ]; then git -C "$w" rm -q -f -- "$p" >/dev/null 2>&1 || return 1
        else mkdir -p "$w/$(dirname -- "$p")" && cp -- "$d/f/$p" "$w/$p" && git -C "$w" add -- "$p" || return 1; fi
      done < "$d/files.tsv"
      a=$(sed -n 1p "$d/author"); t=$(sed -n 1p "$d/date")
      GIT_AUTHOR_DATE=$t GIT_COMMITTER_DATE=$t GIT_AUTHOR_NAME=$a GIT_AUTHOR_EMAIL=fixture@example.com GIT_COMMITTER_NAME=$a GIT_COMMITTER_EMAIL=fixture@example.com \
        git -C "$w" commit -q -F "$d/message" >/dev/null 2>&1 || return 1
      git -C "$w" push -q origin "HEAD:refs/heads/$b" >/dev/null 2>&1 || return 1
      rm -rf "$w"
    done
    return 0
  }
  if [ -n "$cur" ] && [ "$plan" = ok ] && mkdir -p "$(dirname -- "$rp")" && g init -q --bare "$rp" 2>/dev/null; then
    g --git-dir="$rp" symbolic-ref HEAD "refs/heads/$cur"
    g --git-dir="$rp" config core.logAllRefUpdates always
    g --git-dir="$rp" config receive.denyNonFastForwards false
    g --git-dir="$rp" config receive.denyDeletes false
    # Writable by every user, also for what the run creates. Without it, the first push of the run (as the user
    # that built the image, root) creates logs/refs/heads/ and objects/xx/ with mode 755, and a push by another
    # user is then rejected ("unable to append to ./logs/refs/heads/<ref>: Permission denied"; scene-check
    # 20261116T223040Z item 2). The chmod below only covers what exists at the end of the build.
    g --git-dir="$rp" config core.sharedRepository 0666
    if g remote add origin "$rp" 2>/dev/null && pushall && localrefs && ahead; then
      # the log starts empty: the push that filled the remote is not an update of the run
      rm -rf "$rp/logs"
      cat > "$rp/hooks/post-receive" <<'HOOK'
#!/bin/bash
# Records every accepted ref update of this repository, one line each:
#   <UTC time> TAB <ref> TAB <old id> TAB <new id> TAB <1 = fast-forward or new ref, 0 = not (rewrite or delete)>
log=${GIT_DIR:-.}/push-updates.log
while read -r old new ref; do
  case $old in *[!0]*) case $new in *[!0]*) if git merge-base --is-ancestor "$old" "$new" 2>/dev/null; then ff=1; else ff=0; fi ;; *) ff=0 ;; esac ;; *) ff=1 ;; esac
  printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$ref" "$old" "$new" "$ff" >> "$log"
done
exit 0
HOOK
      chmod 755 "$rp/hooks/post-receive"
      : > "$rp/push-updates.log"
      # The log is as writable as the remote: the hook runs as the pushing user, so a place the agent cannot
      # rewrite cannot be written by the hook either. A rewrite is detected instead: the capture compares this log
      # with the remote's reflogs, which git writes separately (capture.mjs `logs_agree`).
      chmod -R a+rwX "$rp" 2>/dev/null
      # the agent may run as another user than the one that built the image
      [ -n "${KIT_LOCAL-}" ] || git config --system --add safe.directory "$rp" 2>/dev/null
      g --git-dir="$rp" for-each-ref --format='%(objectname) %(refname)' > "$etc/remote-refs-before"
      printf '%s\n' "$rp" > "$etc/remote-path"
      st=made
    fi
  fi
  printf '%s\n' "$st" > "$etc/remote-status"
fi

# ---- the start facts of the agent's repository ----------------------------------------------------------------
g for-each-ref --format='%(objectname) %(refname)' refs/heads refs/remotes refs/tags > "$etc/git-refs-before" 2>/dev/null
g symbolic-ref -q --short HEAD > "$etc/branch-before" 2>/dev/null || : > "$etc/branch-before"
g config --get remote.origin.url > "$etc/origin-url-before" 2>/dev/null || : > "$etc/origin-url-before"
g rev-parse -q --verify HEAD > "$etc/head-before" 2>/dev/null || : > "$etc/head-before"
# the recorded fixture head follows what was built here (staged commits of a layer, the start branch of a remote)
[ -s "$etc/head-before" ] && [ -f "$etc/../fixture-head" ] && cp "$etc/head-before" "$etc/../fixture-head" 2>/dev/null

# ---- a scene layer on a base tree image ($conf/layer; kit/schema/role-spec.md `layer`) ---------------------------
# The base tree is not known outside the image, so the capture reads the start state from git at the end
# (kit-capture.sh "tree"): the paths that differ from the start commit, and the paths matching the globs in
# $conf/layer (one per line), with their text before and after.
if [ -f "$conf/layer" ]; then
  cp "$conf/layer" "$etc/tree-paths" && printf 'git\n' > "$etc/tree-mode"
fi

# ---- a seeded snapshot for the gh stand-in ($conf/gh-snapshot/; kit/schema/role-spec.md `gh_snapshot`) -----------
# Installed outside the repository. Its content hash is kept, so the capture can say whether it was changed.
if [ -d "$conf/gh-snapshot" ]; then
  sd=${KIT_GH_SNAPSHOT:-/opt/pitwall/kit-gh}
  st=failed
  if mkdir -p "$sd" && cp -R "$conf/gh-snapshot/." "$sd/" 2>/dev/null; then
    chmod -R a+rX "$sd" 2>/dev/null
    (cd "$sd" && find . -type f | LC_ALL=C sort | while IFS= read -r f; do sha256sum "$f"; done | sha256sum | cut -d' ' -f1) > "$etc/gh-snapshot-sha" 2>/dev/null
    printf '%s\n' "$sd" > "$etc/gh-snapshot-path"
    st=made
  fi
  printf '%s\n' "$st" > "$etc/gh-snapshot-status"
fi

# ---- recorded commands ----------------------------------------------------------------------------------------
# recorded.tsv: <name> TAB <command word> TAB <argument prefix>. One wrapper per command word (wrap-<word>,
# written by capture.mjs). A wrapper that does not answer `--version` is taken out again.
if [ -s "$conf/recorded.tsv" ]; then
  st=installed
  bin=${KIT_BIN:-}
  for w in $(cut -f2 "$conf/recorded.tsv" | sort -u); do
    real=$(command -v "$w" 2>/dev/null) || { st=failed; continue; }
    [ -f "$conf/wrap-$w" ] || { st=failed; continue; }
    if [ -n "$bin" ]; then
      mkdir -p "$bin" && cp "$conf/wrap-$w" "$bin/$w" && chmod 755 "$bin/$w" && printf '%s\n' "$real" > "$bin/$w.pitwall-real-path" || { st=failed; continue; }
      "$bin/$w" --version >/dev/null 2>&1 || { rm -f "$bin/$w" "$bin/$w.pitwall-real-path"; st=failed; }
    else
      mv "$real" "$real.pitwall-real" 2>/dev/null || { st=failed; continue; }
      if cp "$conf/wrap-$w" "$real" && chmod 755 "$real" && "$real" --version >/dev/null 2>&1; then :; else
        rm -f "$real"; mv "$real.pitwall-real" "$real"; st=failed
      fi
    fi
  done
  printf '%s\n' "$st" > "$etc/recorded-status"
fi
exit 0
