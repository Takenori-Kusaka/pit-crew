#!/bin/bash
# Stage 0 of plan 31, inside the sandbox: every scripted control on every kept fix cell, one trial
# each (no model, no quota). The author verified the controls on the host shell only; this checks
# that the same scripts behave the same in the Harbor image (git, the gh stand-in, state capture).
# Resumable per cell. Output: runs/<D>/fix-controls-<cell>/{results.json,controls.md}.
# Usage (WSL): bash -l experiments/fix/run-controls-harbor.sh [cell ...]
set -u -o pipefail
cd /mnt/e/Github/pit-crew
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh fix-controls
D=${D:-runs/2026-11-11}
mkdir -p "$D"
if [ $# -gt 0 ]; then CELLS=("$@"); else mapfile -t CELLS < <(node -e "console.log(JSON.parse(require('fs').readFileSync('experiments/fix/rederive/agreement.json','utf8')).summary.keptIds.join('\n'))"); fi
ARMS=$(node -e "import('./packages/pit-wall/src/suite.mjs').then(({loadSuite})=>console.log(loadSuite('suites/fix/suite.yaml').arms.filter(a=>a.startsWith('script:')).join(',')))" 2>/dev/null)
echo "arms: $ARMS"
for c in "${CELLS[@]}"; do
  out=$D/fix-controls-$c
  [ -f "$out/results.json" ] && { echo "skip $out (exists)"; continue; }
  sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true
  echo "$(date +%H:%M) $c free $(free -g | awk '/^Mem:/{print $7}')G"
  node packages/pit-wall/src/cli.mjs run suites/fix/suite.yaml --runner harbor --arms "$ARMS" --cases "$c" --trials 1 --out "$out" > "$out.log" 2>&1; tail -1 "$out.log"
  head -1 "$out/controls.md" 2>/dev/null
done
echo "$(date +%H:%M) fix controls in harbor done"
