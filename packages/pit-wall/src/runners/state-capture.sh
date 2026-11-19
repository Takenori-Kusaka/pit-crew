#!/bin/bash
# Captures the final state of the workspace for pit-wall's state graders.
# Runs inside the sandbox after the agent (Harbor verifier). Needs only coreutils
# and git, so it works in any agent image. Contents are base64 so no escaping is needed.
# Output: /logs/verifier/state.json
#   { "files": { "<path>": { "sha256": "...", "b64": "..." } },
#     "git": { "head": "...", "fixtureHead": "...", "fixtureIntact": true, "log_b64": "..." },
#     "commands": { "gh_b64", "gh_state_b64", "gh_unparsed_b64" }, "runs_b64", "finalTree", "checks_b64", "oomKills" }
set -u
# Content hash of the working tree, exactly as shims/mark-run.sh records it per run (keep the
# two in step; test/effects.test.mjs compares them): tracked + untracked non-ignored files, in
# a temporary index and object directory, so the real index and object store are untouched.
pw_tree() {
  (
    g() { git -c safe.directory='*' "$@"; }
    top=$(g rev-parse --show-toplevel 2>/dev/null) && [ -n "$top" ] && cd "$top" || exit 2
    idx=$(g rev-parse --git-path index 2>/dev/null) && objs=$(g rev-parse --git-path objects 2>/dev/null) || exit 2
    case $idx in /*) ;; *) idx=$top/$idx ;; esac
    case $objs in /*) ;; *) objs=$top/$objs ;; esac
    tmp=$(mktemp -d 2>/dev/null) || exit 2
    trap 'rm -rf "$tmp"' EXIT
    mkdir "$tmp/objects" || exit 2
    [ -f "$idx" ] && { cp "$idx" "$tmp/index" || exit 2; }
    export GIT_INDEX_FILE=$tmp/index GIT_OBJECT_DIRECTORY=$tmp/objects GIT_ALTERNATE_OBJECT_DIRECTORIES=$objs
    g add -A >/dev/null 2>&1 || exit 2
    t=$(g write-tree 2>/dev/null) && [ -n "$t" ] || exit 2
    printf '%s\n' "$t"
  ) 2>/dev/null
}
cd /app || exit 0
out=/logs/verifier/state.json
mkdir -p /logs/verifier
{
  printf '{"files":{'
  first=1
  while IFS= read -r -d '' f; do
    p=${f#./}
    sha=$(sha256sum "$f" | cut -d' ' -f1)
    size=$(stat -c %s "$f")
    if [ "$size" -le 262144 ]; then b64=$(base64 -w0 "$f"); else b64=""; fi
    [ $first -eq 1 ] || printf ','
    first=0
    printf '"%s":{"sha256":"%s","b64":"%s"}' "$p" "$sha" "$b64"
  done < <(find . -path ./.git -prune -o -type f -print0 | sort -z)
  printf '},"git":{'
  head=$(git rev-parse HEAD 2>/dev/null || echo "")
  fx=$(cat /etc/pitwall/fixture-head 2>/dev/null || echo "")
  intact=false
  if [ -n "$fx" ] && git merge-base --is-ancestor "$fx" HEAD 2>/dev/null; then intact=true; fi
  log=$(git log --all --format='%H %cI %s' 2>/dev/null | base64 -w0)
  printf '"head":"%s","fixtureHead":"%s","fixtureIntact":%s,"log_b64":"%s"},' "$head" "$fx" "$intact" "$log"
  gh=$(cat /tmp/pitwall-gh.log 2>/dev/null | base64 -w0)
  # The effects of the gh calls (shims/gh: normalised per issue / PR), the calls left out of
  # them, and the runs of documented commands (shims/mark-run.sh). Read before the checks
  # run; what the checks themselves run is written elsewhere (below).
  ghstate=$(cat /tmp/pitwall-gh-state.json 2>/dev/null | base64 -w0)
  ghunparsed=$(cat /tmp/pitwall-gh-state.unparsed 2>/dev/null | base64 -w0)
  runs=$(cat /tmp/pitwall-runs.log 2>/dev/null | base64 -w0)
  # The final working tree, hashed as each marked run hashed its tree: a run "on the final
  # tree" has the same hash. Empty when it cannot be computed. Taken before the checks run.
  final=$(pw_tree) || final=
  case $final in *[!0-9a-f]*) final= ;; esac
  # Processes the kernel killed for the container's memory limit during the trial (cgroup v2;
  # "-1" when unknown). Read before the checks below run.
  oom=$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory.events 2>/dev/null)
  case "$oom" in ''|*[!0-9]*) oom=-1 ;; esac
  # Case checks (e.g. the test suite) run after the files above are captured, so their
  # side effects never reach the state. /tests is uploaded only after the agent ends,
  # so the agent never sees them. Output: "<name>\t<exit code>" per line.
  # A check reads the agent's effects from /tmp/pitwall-gh-state.{json,tsv} and
  # /tmp/pitwall-runs.log; gh calls and marked runs made by the checks go to other files.
  # pitwall-ran-on-final reads the agent's runs and the final tree from the two PITWALL_ vars
  # below, so what a check changes or runs cannot move "the final tree".
  ck=""
  if [ -f /tests/checks.sh ]; then ck=$(PITWALL_GH_STATE=/tmp/pitwall-gh-state.checks.json PITWALL_RUNS_LOG=/tmp/pitwall-runs.checks.log \
    PITWALL_AGENT_RUNS_LOG=/tmp/pitwall-runs.log PITWALL_FINAL_TREE="$final" bash /tests/checks.sh 2>/dev/null | base64 -w0); fi
  printf '"commands":{"gh_b64":"%s","gh_state_b64":"%s","gh_unparsed_b64":"%s"},"runs_b64":"%s","finalTree":"%s","checks_b64":"%s","oomKills":%s}' "$gh" "$ghstate" "$ghunparsed" "$runs" "$final" "$ck" "$oom"
} > "$out"
echo 1 > /logs/verifier/reward.txt
