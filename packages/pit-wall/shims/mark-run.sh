#!/bin/bash
# pitwall-mark-run: records that a project's documented command ran, and with what exit,
# so a cell check can ask "did the documented check run" however it was invoked
# (./tools/check, bash tools/check, sh tools/check, make check, from another script...),
# and on which working tree, so it can ask "did it run, and pass, on the final tree".
# Installed in the task image as /usr/local/bin/pitwall-mark-run. Call it from the
# documented command itself:
#   pitwall-mark-run <name> -- <command> [args...]   run the command, record, exit with its code
#   pitwall-mark-run <name> <exit-code>              record only (e.g. trap 'pitwall-mark-run check $?' EXIT)
#   pitwall-mark-run --tree                          print the working tree's content hash (exit 2 if none)
# Appends "<name>\t<UTC timestamp>\t<exit code>\t<tree>" to $PITWALL_RUNS_LOG
# (default /tmp/pitwall-runs.log). <tree> is the content hash of the working tree of the
# repository containing the current directory, taken when the run is recorded (after the
# command ends); empty when it cannot be computed (no git, not a repository, git failed).
# Failure to record never changes the exit code.

# Content hash of the working tree: a git tree id of every tracked file and every untracked
# file that is not ignored, as they are on disk. Computed from the repository root in a
# temporary index (a copy of the real one, so tracked files stay tracked even if they match
# an ignore rule) and a temporary object directory (the repository's objects as alternates),
# so neither the real index nor the repository's object store is touched.
# state-capture.sh computes the final tree with the same function: keep the two in step.
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

if [ "${1-}" = "--tree" ]; then pw_tree; exit; fi
name=${1:-unnamed}
name=${name//$'\t'/ }
shift
if [ "${1-}" = "--" ]; then
  shift
  "$@"
  code=$?
else
  code=${1:-0}
  case $code in ''|*[!0-9]*) code=255 ;; esac
fi
ts=$(date -u +%Y-%m-%dT%H:%M:%S.%NZ 2>/dev/null)
tree=$(pw_tree) || tree=
{ printf '%s\t%s\t%s\t%s\n' "$name" "$ts" "$code" "$tree" >> "${PITWALL_RUNS_LOG:-/tmp/pitwall-runs.log}"; } 2>/dev/null || true
exit "$code"
