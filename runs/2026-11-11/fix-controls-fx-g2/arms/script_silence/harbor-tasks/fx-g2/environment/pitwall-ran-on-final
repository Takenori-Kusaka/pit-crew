#!/bin/bash
# pitwall-ran-on-final <name>: for a cell check, did the documented command <name> run
# AFTER the last change, on the final working tree, and pass?
#   exit 0  some run of <name> recorded the final tree and exit code 0
#   exit 1  decided no: <name> never ran, or every passing run was on another tree
#   exit 2  undecidable: the final tree is unknown, or a passing run has no tree
#           (no git, hash unavailable, or a runs log written before trees were recorded)
# Reads the agent's runs from $PITWALL_AGENT_RUNS_LOG (default /tmp/pitwall-runs.log; not
# $PITWALL_RUNS_LOG, which in a check points at the check's own runs). The final tree is
# $PITWALL_FINAL_TREE when set (state-capture.sh sets it for the checks; empty = unknown),
# otherwise computed now with `pitwall-mark-run --tree` in the current directory.
# Installed in the task image as /usr/local/bin/pitwall-ran-on-final.
name=${1:-}
[ -n "$name" ] || { echo "usage: pitwall-ran-on-final <name>" >&2; exit 2; }
name=${name//$'\t'/ }
log=${PITWALL_AGENT_RUNS_LOG:-/tmp/pitwall-runs.log}
if [ -n "${PITWALL_FINAL_TREE+x}" ]; then
  final=$PITWALL_FINAL_TREE
else
  mark=$(dirname -- "$0")/pitwall-mark-run
  [ -x "$mark" ] || mark=pitwall-mark-run
  final=$("$mark" --tree 2>/dev/null) || final=
fi
[ -n "$final" ] || exit 2
[ -f "$log" ] || exit 1
PW_NAME=$name PW_FINAL=$final awk -F'\t' '
  $1 == ENVIRON["PW_NAME"] && $3 == "0" { if ($4 == "") unknown = 1; else if ($4 == ENVIRON["PW_FINAL"]) ok = 1 }
  END { exit ok ? 0 : (unknown ? 2 : 1) }' "$log"
