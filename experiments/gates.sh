#!/bin/bash
# Gate check for run scripts (process v2 P5: the machine enforces the gates).
#   source experiments/gates.sh <experiment> <G5,G4,G2,...>
# Ends the calling script (exit 4) unless every named gate has a verdict file under
# gates/<experiment>/ that says PASS and was written by a role allowed to write it
# (packages/pit-wall/src/gates.mjs). There is no override variable on purpose.
# It exits rather than returns: a bare `return` from a sourced file lets the caller go on
# unless the caller remembers `|| exit` (found by the test, 2026-11-13).
# Both directions are tested by packages/pit-wall/test/gates.test.mjs.
GATES_REPO=${GATES_REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}
if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
  echo "gates.sh: usage: source experiments/gates.sh <experiment> <G5,G4,...>"
  exit 4
fi
if ! node "$GATES_REPO/packages/pit-wall/src/gates.mjs" check "$1" --need "$2" --repo "$GATES_REPO" --root "${GATES_ROOT:-gates}"; then
  exit 4
fi
