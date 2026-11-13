#!/bin/bash
# EXP-48, review §11.A4 step 1 and the owner's decisions of 2026-11-13 (no model): for each
# candidate build its images and run in them, without a model:
#   A/B/C tree: the "no change" control (hidden), the reference-fix control (reference), the
#               history check (history) and the stand-in tools (tools);
#   D tree:     the history check, the tools (gh, jq, graphify), D's hooks read (dhooks) and run
#               with 8 ordinary tool calls (dhooks-run).
# Inputs come from `node experiments/exp48/image-verify.mjs prepare`. Resumable: a phase with a
# result is skipped. Run inside WSL; one docker job at a time:
#   bash experiments/exp48/image-verify.sh [id ...]
# Disk rules (implementation-report.md, incident of 2026-11-13): build -> verify -> delete, one
# candidate at a time; candidates are taken lock file by lock file, the dependency image of a lock
# file is deleted after its last candidate and the build cache is pruned. build-images.sh stops
# below 40 GiB free on E: and above 15 GiB of EXP-48 images. Every step appends E: free space and
# docker's own total to local/exp48-gq/verify/disk.tsv (peak disk use is read from there).
set -u
cd /mnt/e/Github/pit-crew
L=local/exp48-gq
V=$L/verify
W=${G4_WORK:-$HOME/.cache/pit-wall/exp48-verify}   # on the WSL disk, which lives on E:
MEM=${G4_MEM:-6144m}   # review §11.B4: 6,144 MiB, one trial at a time
mkdir -p "$V/out" "$W/out" "$W/g4"
source experiments/heavy-lock.sh exp48-verify
cp experiments/exp48/g4-in-image.mjs "$W/g4/"
HRE=$(node -e '
  const h = JSON.parse(require("fs").readFileSync("experiments/exp48/harness-files.json", "utf8")).remove;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  console.log(h.map(({ pattern: p }) => p.startsWith("**/") ? "(^|/)" + esc(p.slice(3)) + "$" : p.endsWith("/") ? "^" + esc(p) : "^" + esc(p) + "$").join("|"))')
disk() { # label
  printf '%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "$1" "$(df -BM --output=avail /mnt/e | tail -1 | tr -dc 0-9)" \
    "$(docker system df --format '{{.Type}}={{.Size}}' | tr '\n' ' ')WSL-available-MiB=$(free -m | awk '/^Mem:/{print $7}')" >> "$V/disk.tsv"
}
field() { node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(String(t[process.argv[2]]??""))' "$V/specs/$1.json" "$2"; }
lock() { node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).lockHash)' "$V/specs/$1.prep.json"; }
have() { [ -f "$V/out/$1.json" ]; }
phase() { # id kind phase
  have "$1-$2-$3" && return 0
  m=$(free -g | awk '/^Mem:/{print $7}'); [ "$m" -ge 6 ] || { echo "free memory ${m}G < 6G: stopping before $1 $2 $3"; exit 1; }
  docker run --rm --network none --memory "$MEM" --memory-swap "$MEM" -e G4_HARNESS_RE="$HRE" \
    -e G4_ISSUE="$(field $1 issue)" -e G4_PR="$(field $1 pr)" -e G4_TESTS_ABSENT="${TESTS_ABSENT:-}" \
    -v "$W/g4:/g4:ro" -v "$W/$1/tests:/tests:ro" -v "$W/$1/solution:/solution:ro" -v "$W/out:/out" \
    "pitwall/realrepo-tree:$1-$2" /opt/pitwall/node/bin/node /g4/g4-in-image.mjs "$3" "/out/$1-$2-$3.json" > "$W/out/$1-$2-$3.err" 2>&1
  cp "$W/out/$1-$2-$3.json" "$V/out/" 2>/dev/null || { echo "$1: NO RESULT for $2 $3"; tail -c 600 "$W/out/$1-$2-$3.err" | sed 's/^/    /'; cp "$W/out/$1-$2-$3.err" "$V/out/" 2>/dev/null; }
}
build() { # id kind(abc|d)
  local s e b
  s=$(date +%s)
  if [ "$2" = abc ]; then SKIP_D=1 bash experiments/exp48/build-images.sh "$1" > "$W/build-$1-$2.log" 2>&1; b=$?; else ONLY_D=1 bash experiments/exp48/build-images.sh "$1" > "$W/build-$1-$2.log" 2>&1; b=$?; fi
  e=$(date +%s)
  printf '{"exit":%s,"sec":%s,"MiB":%s}\n' "$b" "$((e - s))" "$(( $(docker image inspect "pitwall/realrepo-tree:$1-$2" --format '{{.Size}}' 2>/dev/null || echo 0) / 1048576 ))" > "$V/out/$1-build-$2.json"
  disk "built $1 $2 exit $b"
  [ $b -eq 5 ] && { echo "$1: disk rule stopped the build"; tail -3 "$W/build-$1-$2.log"; exit 5; }
  return $b
}
ids=${*:-$(cat "$V/ids.txt")}
# order: lock file by lock file, so that each dependency image is built once and deleted after use
ordered=$(for id in $ids; do printf '%s %s\n' "$(lock $id)" "$id"; done | sort | awk '{print $2}')
prev_lock=""
disk start
for id in $ordered; do
  lh=$(lock $id)
  if [ -n "$prev_lock" ] && [ "$lh" != "$prev_lock" ]; then
    docker rmi "pitwall/realrepo-deps:$prev_lock" > /dev/null 2>&1; docker builder prune -af > /dev/null 2>&1; disk "pruned deps $prev_lock"
  fi
  prev_lock=$lh
  s=$(date +%s)
  rm -rf "$W/$id"; mkdir -p "$W/$id"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/tests" "$W/$id/tests"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/solution" "$W/$id/solution"
  # EXTRA_ABC="leak recorder capture": the remaining G4 phases on the rebuilt A/B/C image
  abc_phases="hidden reference history tools ${EXTRA_ABC:-}"
  need_abc=0; for p in $abc_phases; do have "$id-abc-$p" || need_abc=1; done
  if [ $need_abc -eq 1 ]; then
    if build "$id" abc; then
      # the leak phase needs to know that the image itself has no /tests (checked without the mount)
      TESTS_ABSENT=$(docker run --rm --network none "pitwall/realrepo-tree:$id-abc" bash -c 'test -e /tests && echo present || echo absent')
      for p in $abc_phases; do phase "$id" abc "$p"; done
    else echo "$id: BUILD FAILED (abc)"; tail -5 "$W/build-$id-abc.log"; fi
    docker rmi "pitwall/realrepo-tree:$id-abc" > /dev/null 2>&1; disk "deleted $id abc"
  fi
  if ! (have "$id-d-history" && have "$id-d-tools" && have "$id-d-dhooks" && have "$id-d-dhooks-run"); then
    if build "$id" d; then
      for p in history tools dhooks dhooks-run; do phase "$id" d "$p"; done
    else echo "$id: BUILD FAILED (d)"; tail -5 "$W/build-$id-d.log"; fi
    docker rmi "pitwall/realrepo-tree:$id-d" > /dev/null 2>&1; disk "deleted $id d"
  fi
  rm -rf "$W/$id"
  echo "$id: $(( $(date +%s) - s )) s"
done
[ -n "$prev_lock" ] && { docker rmi "pitwall/realrepo-deps:$prev_lock" > /dev/null 2>&1; docker builder prune -af > /dev/null 2>&1; disk "pruned deps $prev_lock"; }
echo VERIFY-DONE
