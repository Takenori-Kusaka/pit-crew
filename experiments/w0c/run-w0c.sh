#!/bin/bash
# W0c (#96): the headline probe. WITHOUT the harness, on Harbor (docker), model Fable 5.2, 3 trials each of
#   - EXP-29 group R, cell t4-scatter-big-start   (suites/structure-big, max turns 24 as in EXP-29)
#   - EXP-29 group R, cell t5-stale-base-weak     (suites/structure-types, max turns 12 as in EXP-29)
#   - the kit escalation scene `count-lines` of kit/fixtures/dev-cart3 (its 3 wordings, 1 trial each)
# For each scene, BEFORE any model trial: the three scripted controls (reference / no-op / incident), 3 times
# each, must be judged as built. If one is not, the scene's model trials do not start.
#
# One trial at a time. Before every trial: available memory >= 6 GiB and the 7-day quota below the line of
# experiments/quota.sh; otherwise the script stops (exit 4) and can be started again: finished trials are kept.
# Per trial it records wall time and the quota reading before / after (runs/w0c/timing.tsv).
# These probe trials are not counted in the 10 headline trials (kit/release-rules.json headline.screen).
#
#   bash -l experiments/w0c/run-w0c.sh --dry     print the plan, run nothing
#   bash -l experiments/w0c/run-w0c.sh           run (WSL; docker and Harbor needed)
# Env: W0C_OUT (default runs/w0c), W0C_TRIALS (default 3), W0C_MIN_FREE_MIB (default 6144), W0C_SCENES
#      (default "t4 t5 kit"), QUOTA_STOP (experiments/quota.sh, default 0.95)
set -u -o pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 2
ROOT=$(pwd)
DRY=0; [ "${1:-}" = "--dry" ] && DRY=1
OUT=${W0C_OUT:-runs/w0c}
TRIALS=${W0C_TRIALS:-3}
MIN_FREE_MIB=${W0C_MIN_FREE_MIB:-6144}
SCENES=${W0C_SCENES:-"t4 t5 kit"}
MODEL=claude-fable-5-2          # fixed by the owner (2026-11-15). Not an option.
export QUOTA_ROOT="$ROOT/runs"
TIMING=$OUT/timing.tsv

mem_mib() { awk '/^MemAvailable:/{print int($2/1024)}' /proc/meminfo; }
quota() { bash experiments/quota.sh 2>/dev/null | sed -n 's/.*(last reading) \([^,]*\),.*/\1/p' | tail -1; }
# need: stop (exit 4) unless there is memory and quota for one more trial. Sets MEM and Q.
need() {
  MEM=$(mem_mib)
  if [ -z "$MEM" ] || [ "$MEM" -lt "$MIN_FREE_MIB" ]; then echo "STOP: available memory ${MEM:-?} MiB < ${MIN_FREE_MIB} MiB. Start again later with the same command."; exit 4; fi
  if ! bash experiments/quota.sh > "$OUT/.quota.txt" 2>&1; then cat "$OUT/.quota.txt"; echo "STOP: 7-day quota. Start again after the reset with the same command."; exit 4; fi
  Q=$(sed -n 's/.*(last reading) \([^,]*\),.*/\1/p' "$OUT/.quota.txt" | tail -1)
  echo "$(date +%H:%M) available ${MEM} MiB, 7-day usage ${Q:-?}"
}
# timed <scene> <kind> <label> <dir to touch> <command...>: runs it, appends one row to timing.tsv
timed() {
  local scene=$1 kind=$2 label=$3 dir=$4; shift 4
  local t0 start code
  start=$(date -Is); t0=$(date +%s)
  "$@"; code=$?
  touch "$dir" 2>/dev/null   # experiments/quota.sh reads the newest directories two levels under runs/ first
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$scene" "$kind" "$label" "$start" "$(( $(date +%s) - t0 ))" "$MEM" "${Q:-?}" "$(quota)" "$code" >> "$TIMING"
  return $code
}
run() { if [ $DRY = 1 ]; then echo "  would run: $*"; else "$@"; fi; }

# cell <name> <suite> <case> <max turns>
cell() {
  local name=$1 suite=$2 case=$3 turns=$4 d=$OUT/exp29-$1
  echo "== $case (suite $suite, max turns $turns)"
  # 1. scripted controls x 3 (no model). One container at a time.
  if [ $DRY = 1 ]; then
    echo "  would run: controls script:reference,script:null,script:harmful x 3 -> $d/controls ; then check them (pit-wall controls + check-harm-controls)"
  elif [ ! -f "$d/controls/results.json" ]; then
    need
    PITWALL_HARBOR_CONCURRENCY=1 timed "$case" control "reference+null+harmful x3" "$d" \
      node packages/pit-wall/src/cli.mjs run "$suite" --runner harbor --arms script:reference,script:null,script:harmful --cases "$case" --trials 3 --out "$d/controls" || { echo "STOP: the controls of $case did not run"; exit 5; }
  fi
  if [ $DRY = 0 ]; then
    node experiments/w0c/summarize.mjs --check-controls "$d/controls/results.json" "$suite" || { echo "STOP: a control of $case is not judged as built. No model trial for this scene."; exit 5; }
  fi
  # 2. model trials, without the harness, one at a time
  for k in $(seq 1 "$TRIALS"); do
    if [ -f "$d/t$k/results.json" ] || [ -f "$d/t$k/FAILED" ]; then echo "  t$k: kept"; continue; fi
    if [ $DRY = 1 ]; then echo "  would run: t$k vanilla $MODEL -> $d/t$k (after the memory and quota check)"; continue; fi
    need
    timed "$case" model "t$k" "$d" \
      node packages/pit-wall/src/cli.mjs run "$suite" --runner harbor --arms vanilla --cases "$case" --trials 1 --model "$MODEL" --max-turns "$turns" --out "$d/t$k" \
      || echo "  t$k: the run ended with an error (recorded in timing.tsv; not run again by itself; it is counted as invalid)"
    [ -f "$d/t$k/results.json" ] || { mkdir -p "$d/t$k"; date -Is > "$d/t$k/FAILED"; }
  done
}

# the kit scene: release-gate.mjs makes the Harbor tasks, runs the controls x 3 first, then the probe trials,
# with the same guards before each; it keeps finished trials (--run-dir).
kit() {
  local d=$OUT/kit-cart3/probe
  echo "== kit scene count-lines (kit/fixtures/dev-cart3, 3 wordings x 1 trial)"
  local args=(dev --fixtures kit/fixtures/dev-cart3 --cases 'dev-esc-count-lines-' --phases probe --probe-trials 1 --controls-trials 3 --model "$MODEL" --min-free-gib "$(awk "BEGIN{print $MIN_FREE_MIB/1024}")" --run-dir "$d")
  if [ $DRY = 1 ]; then node scripts/release-gate.mjs "${args[@]}" --plan | sed 's/^/  /'; return; fi
  MEM=$(mem_mib); Q=$(quota)
  timed kit-count-lines all "controls x3 + 3 probe trials (per-trial times are in the saved trials)" "$OUT/kit-cart3" node scripts/release-gate.mjs "${args[@]}"
  local code=$?
  if [ $code = 4 ]; then echo "STOP: the kit scene was stopped by a guard. Start again with the same command."; exit 4; fi
  if [ $code != 0 ]; then echo "STOP: the kit scene did not finish (exit $code)"; exit 5; fi
}

mkdir -p "$OUT"
[ $DRY = 1 ] || [ -f "$TIMING" ] || printf 'scene\tkind\tlabel\tstart\twall_s\tmem_before_mib\tquota_before\tquota_after\texit\n' > "$TIMING"
echo "W0c probe: model $MODEL, without the harness, $TRIALS trial(s) per scene, out $OUT, scenes: $SCENES"
if [ $DRY = 1 ]; then
  echo "now: available $(mem_mib) MiB (need >= $MIN_FREE_MIB), $(bash experiments/quota.sh 2>/dev/null | tail -1)"
else
  echo "Claude Code on this host: $(claude --version 2>/dev/null || echo unknown) (the version in the agent image is recorded per trial)"
fi
for s in $SCENES; do
  case $s in
    t4) cell t4 suites/structure-big/suite.yaml t4-scatter-big-start 24 ;;
    t5) cell t5 suites/structure-types/suite.yaml t5-stale-base-weak 12 ;;
    kit) kit ;;
    *) echo "unknown scene $s"; exit 2 ;;
  esac
done
[ $DRY = 1 ] && { echo "dry run: nothing was started"; exit 0; }
node experiments/w0c/summarize.mjs "$OUT" --write experiments/w0c
echo "$(date +%H:%M) W0c done: experiments/w0c/result.md"
