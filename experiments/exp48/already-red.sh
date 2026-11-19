#!/bin/bash
# EXP-48, G4.partial open items that need no model (issue #56): per task and per tree, in the
# task's own image and without network,
#   checks    the whole unit suite once (`npx vitest run`, about 23 min): which test files are red
#             BEFORE any change — the "already-red list" of plan 34 §4 / §5 (E1 reads it)
#   leak      the hidden check files are nowhere in the image that was just built
# and, where they are still open: v03's tools / history on its rebuilt image (gh stand-in defect
# fixed after its image was built) and `graphify explain` with stderr kept on the D trees that
# track graphify-out/ (v19 failed with a traceback nobody kept).
#
#   bash experiments/exp48/already-red.sh [stage ...]      stages: small abc d   (default: all three)
#   IDS="v01 v02"   only these tasks (default: the tasks that passed sieve stage 5 in image-verify.json)
#
# Run it DETACHED inside WSL so that it outlives the launching session (README: a run was reaped):
#   mkdir -p local/exp48-gq/g4-out/already-red
#   setsid nohup bash experiments/exp48/already-red.sh > local/exp48-gq/g4-out/already-red/run-$(date +%Y%m%dT%H%M%S).log 2>&1 < /dev/null &
# Progress:  tail -5 local/exp48-gq/g4-out/already-red/progress.log ; ls local/exp48-gq/g4-out/already-red/*-checks.json | wc -l
# Resume:    the same command. A phase with a result file is skipped; delete the file to run it again.
#
# Rules kept (implementation-report.md, incidents of 2026-11-13):
#   - one docker job at a time: every unit (one task, one tree) runs under the host-wide heavy lock
#     (experiments/heavy-lock.sh) and gives it back afterwards, so other jobs can go in between;
#   - no docker step starts with less than 6 GiB available; the run WAITS for memory (and for the
#     lock) instead of failing, up to EXP48_WAIT_H hours (default 72), then stops;
#   - build -> phases -> delete the tree image; the dependency image goes when the next unit has
#     another lock file; build-images.sh stops below 40 GiB free on E: and above 15 GiB of EXP-48
#     images (exit 5: this script then stops too).
# Raw results (they hold the paths of the subject's test files) stay under local/exp48-gq/g4-out/;
# the tracked summary experiments/exp48/g4-machine.json (counts and hashes) is rewritten after
# every unit by g4-machine-collect.mjs.
set -u
cd /mnt/e/Github/pit-crew
L=local/exp48-gq
V=$L/verify
OUT=$L/g4-out/already-red
W=${G4_WORK:-$HOME/.cache/pit-wall/exp48-already-red}   # on the WSL disk
MEM=${G4_MEM:-6144m}
VITEST_SEC=${G4_VITEST_SEC:-3000}                       # the suite took 1,325-1,411 s on the samples
WAIT_H=${EXP48_WAIT_H:-72}
mkdir -p "$OUT" "$W/out" "$W/g4"
say() { printf '%s %s\n' "$(date -Iseconds)" "$*" | tee -a "$OUT/progress.log"; }

# one runner at a time
if [ -f "$OUT/runner.pid" ] && kill -0 "$(cat "$OUT/runner.pid")" 2>/dev/null; then echo "already running: pid $(cat "$OUT/runner.pid")"; exit 1; fi
echo $$ > "$OUT/runner.pid"
trap 'rm -f "$OUT/runner.pid"' EXIT
# a container left by a killed runner would be a second docker job
left=$(docker ps -q --filter name=exp48-ar-)
[ -n "$left" ] && { say "removing container(s) left by an earlier runner: $(docker ps --filter name=exp48-ar- --format '{{.Names}}' | tr '\n' ' ')"; docker rm -f $left > /dev/null; }

cp experiments/exp48/g4-in-image.mjs "$W/g4/"
HRE=$(node -e '
  const h = JSON.parse(require("fs").readFileSync("experiments/exp48/harness-files.json", "utf8")).remove;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  console.log(h.map(({ pattern: p }) => p.startsWith("**/") ? "(^|/)" + esc(p.slice(3)) + "$" : p.endsWith("/") ? "^" + esc(p) : "^" + esc(p) + "$").join("|"))')
field() { node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(String(t[process.argv[2]]??""))' "$V/specs/$1.json" "$2"; }
lock() { node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).lockHash)' "$V/specs/$1.prep.json"; }
graphify_of() { node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).tools?.d?.graphify ? "yes" : "")' "$V/specs/$1.prep.json"; }
avail_g() { free -g | awk '/^Mem:/{print $7}'; }
have() { [ -f "$OUT/$1.json" ]; }
disk() { printf '%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "$1" "$(df -BM --output=avail /mnt/e | tail -1 | tr -dc 0-9)" "$(docker system df --format '{{.Type}}={{.Size}}' | tr '\n' ' ')WSL-available-MiB=$(free -m | awk '/^Mem:/{print $7}')" >> "$OUT/disk.tsv"; }

stages=${*:-"small abc d"}
ids=${IDS:-$(node -e '
  const d = JSON.parse(require("fs").readFileSync("experiments/exp48/image-verify.json", "utf8"));
  console.log(d.rows.filter((r) => r.stage5 === true).map((r) => r.id).join(" "))')}
[ -n "$ids" ] || { say "no task ids"; exit 1; }
by_lock() { for id in $ids; do printf '%s %s\n' "$(lock $id)" "$id"; done | sort | awk '{print $2}'; }

# The plan: one line per unit, "id kind phases...". Stage small first (minutes), then every A/B/C
# tree, then every D tree; inside a stage lock file by lock file.
PLAN=$W/plan.txt; : > "$PLAN"
in_ids() { case " $ids " in *" $1 "*) return 0 ;; esac; return 1; }
for st in $stages; do
  case $st in
    small)
      [ -f "$V/specs/v03.json" ] && { echo "v03 abc tools history leak" >> "$PLAN"; echo "v03 d tools history leak" >> "$PLAN"; }
      [ -f "$V/specs/v19.json" ] && echo "v19 d graphify tools leak" >> "$PLAN" ;;
    abc) for id in $(by_lock); do echo "$id abc checks leak$([ $id = v03 ] && echo ' tools history')" >> "$PLAN"; done ;;
    d) for id in $(by_lock); do echo "$id d checks leak$([ $id = v03 ] && echo ' tools history')$([ -n "$(graphify_of $id)" ] && echo ' graphify')" >> "$PLAN"; done ;;
    *) say "unknown stage $st"; exit 2 ;;
  esac
done
say "runner $$ started: stages [$stages], $(echo $ids | wc -w) task(s), $(wc -l < "$PLAN") unit(s); container memory $MEM; vitest limit ${VITEST_SEC}s"

# Wait until 6 GiB are available (the container may use 6,144 MiB). Returns 1 after WAIT_H hours.
wait_mem() { # label
  local t0 last=0 now m
  t0=$(date +%s)
  while :; do
    m=$(avail_g); [ "$m" -ge 6 ] && return 0
    now=$(date +%s)
    [ $((now - t0)) -ge $((WAIT_H * 3600)) ] && { say "STOP: still only ${m}G available after ${WAIT_H} h (waiting for $1)"; return 1; }
    [ $((now - last)) -ge 3600 ] && { say "waiting for memory before $1: ${m}G available < 6G ($(free -m | awk '/^Mem:/{print $7}') MiB); checking every 5 min"; last=$now; }
    sleep 300
  done
}

# One unit under the heavy lock, in a subshell so that the lock is given back at its end.
unit() ( # id kind phases...
  id=$1; k=$2; shift 2
  export HEAVY_LOCK_WAIT=1 HEAVY_LOCK_WAIT_MAX=$((WAIT_H * 3600))
  source experiments/heavy-lock.sh "exp48-already-red $id $k"
  m=$(avail_g); [ "$m" -ge 6 ] || { say "$id $k: ${m}G available after taking the lock: giving the lock back"; exit 75; }
  s=$(date +%s)
  rm -rf "$W/$id"; mkdir -p "$W/$id"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/tests" "$W/$id/tests"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/solution" "$W/$id/solution"
  if [ "$k" = abc ]; then SKIP_D=1 bash experiments/exp48/build-images.sh "$id" > "$W/build-$id-$k.log" 2>&1; b=$?; else ONLY_D=1 bash experiments/exp48/build-images.sh "$id" > "$W/build-$id-$k.log" 2>&1; b=$?; fi
  printf '{"exit":%s,"sec":%s,"MiB":%s,"imageId":"%s","when":"%s"}\n' "$b" "$(( $(date +%s) - s ))" "$(( $(docker image inspect "pitwall/realrepo-tree:$id-$k" --format '{{.Size}}' 2>/dev/null || echo 0) / 1048576 ))" "$(docker image inspect "pitwall/realrepo-tree:$id-$k" --format '{{.Id}}' 2>/dev/null)" "$(date -Iseconds)" > "$OUT/$id-$k-build.json"
  disk "built $id $k exit $b"
  if [ $b -ne 0 ]; then
    say "$id $k: BUILD FAILED (exit $b): $(tail -2 "$W/build-$id-$k.log" | tr '\n' ' ' | cut -c1-200)"
    docker rmi "pitwall/realrepo-tree:$id-$k" > /dev/null 2>&1
    [ $b -eq 5 ] && exit 5   # the disk rule
    exit 1
  fi
  # the image itself has no /tests (asked without the mount); the leak phase records the answer
  absent=$(docker run --rm --network none "pitwall/realrepo-tree:$id-$k" bash -c 'test -e /tests && echo present || echo absent')
  for p in "$@"; do
    have "$id-$k-$p" && continue
    m=$(avail_g); [ "$m" -ge 6 ] || { say "$id $k $p: ${m}G available: stopping this unit"; docker rmi "pitwall/realrepo-tree:$id-$k" > /dev/null 2>&1; exit 75; }
    a=$(df -BG --output=avail /mnt/e | tail -1 | tr -dc 0-9); [ "${a:-0}" -ge "${EXP48_MIN_E_G:-40}" ] || { say "$id $k $p: E: has ${a}G free: STOP"; docker rmi "pitwall/realrepo-tree:$id-$k" > /dev/null 2>&1; exit 5; }
    p0=$(date +%s)
    docker run --rm --name "exp48-ar-$id-$k-$p" --network none --memory "$MEM" --memory-swap "$MEM" -e G4_HARNESS_RE="$HRE" \
      -e G4_ISSUE="$(field $id issue)" -e G4_PR="$(field $id pr)" -e G4_TESTS_ABSENT="$absent" -e G4_CHECKS=vitest -e G4_VITEST_SEC="$VITEST_SEC" \
      -v "$W/g4:/g4:ro" -v "$W/$id/tests:/tests:ro" -v "$W/$id/solution:/solution:ro" -v "$W/out:/out" \
      "pitwall/realrepo-tree:$id-$k" /opt/pitwall/node/bin/node /g4/g4-in-image.mjs "$p" "/out/$id-$k-$p.json" > "$W/out/$id-$k-$p.err" 2>&1
    rc=$?
    if cp "$W/out/$id-$k-$p.json" "$OUT/" 2>/dev/null; then
      cp "$W/out/$id-$k-$p.json".*.txt "$OUT/" 2>/dev/null   # stderr kept by the graphify phase
      say "$id $k $p: result written ($(( $(date +%s) - p0 )) s, docker exit $rc)"
    else
      cp "$W/out/$id-$k-$p.err" "$OUT/" 2>/dev/null
      say "$id $k $p: NO RESULT (docker exit $rc, $(( $(date +%s) - p0 )) s); stderr kept as $id-$k-$p.err"
    fi
    rm -f "$W/out/$id-$k-$p".*
  done
  docker rmi "pitwall/realrepo-tree:$id-$k" > /dev/null 2>&1; disk "deleted $id $k"
  rm -rf "$W/$id"
  exit 0
)

prev_lock=""
drop_deps() { [ -n "$prev_lock" ] && { docker rmi "pitwall/realrepo-deps:$prev_lock" > /dev/null 2>&1; docker builder prune -af > /dev/null 2>&1; disk "pruned deps $prev_lock"; }; prev_lock=""; }
stop=0
while read -r id k phases; do
  need=""; for p in $phases; do have "$id-$k-$p" || need="$need $p"; done
  [ -z "$need" ] && continue
  lh=$(lock $id)
  [ -n "$prev_lock" ] && [ "$lh" != "$prev_lock" ] && drop_deps
  tries=0
  while :; do
    wait_mem "$id $k" || { stop=1; break; }
    unit "$id" "$k" $need < /dev/null; rc=$?
    [ $rc -eq 75 ] && { tries=$((tries + 1)); [ $tries -ge 200 ] && { say "STOP: $id $k gave the lock back 200 times"; stop=1; break; }; sleep 300; continue; }
    break
  done
  [ $stop -eq 1 ] && break
  prev_lock=$lh
  [ $rc -eq 5 ] && { say "STOP: the disk rule fired at $id $k"; stop=1; break; }
  [ $rc -eq 0 ] || say "$id $k: unit ended with exit $rc; going on with the next unit"
  node experiments/exp48/g4-machine-collect.mjs > "$OUT/collect.last.txt" 2>&1 || say "collect failed (see collect.last.txt)"
done < "$PLAN"
drop_deps
node experiments/exp48/g4-machine-collect.mjs > "$OUT/collect.last.txt" 2>&1
if [ $stop -eq 1 ]; then say "runner $$ STOPPED before the end of the plan"; exit 1; fi
say "runner $$ ALREADY-RED-DONE: $(ls "$OUT"/*-abc-checks.json 2>/dev/null | wc -l) abc and $(ls "$OUT"/*-d-checks.json 2>/dev/null | wc -l) d suite result(s)"
