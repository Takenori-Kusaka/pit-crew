#!/bin/bash
# EXP-48, review §11.A4 step 1: build each candidate's image (A/B/C tree) and run, without a
# model, the "no change" control, the reference-fix control and the history check in it.
# Inputs come from `node experiments/exp48/image-verify.mjs prepare`. Resumable: a candidate
# with all three results is skipped. Run inside WSL; one docker job at a time.
#   bash experiments/exp48/image-verify.sh [id ...]
set -u
cd /mnt/e/Github/pit-crew
L=local/exp48-gq
V=$L/verify
W=${G4_WORK:-$HOME/.cache/pit-wall/exp48-verify}
MEM=${G4_MEM:-6144m}   # review §11.B4: 6,144 MiB, one trial at a time
mkdir -p "$V/out" "$W/out" "$W/g4"
source experiments/heavy-lock.sh exp48-verify
cp experiments/exp48/g4-in-image.mjs "$W/g4/"
HRE=$(node -e '
  const h = JSON.parse(require("fs").readFileSync("experiments/exp48/harness-files.json", "utf8")).remove;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  console.log(h.map(({ pattern: p }) => p.startsWith("**/") ? "(^|/)" + esc(p.slice(3)) + "$" : p.endsWith("/") ? "^" + esc(p) : "^" + esc(p) + "$").join("|"))')
ids=${*:-$(cat "$V/ids.txt")}
for id in $ids; do
  if [ -f "$V/out/$id-abc-hidden.json" ] && [ -f "$V/out/$id-abc-reference.json" ] && [ -f "$V/out/$id-abc-history.json" ]; then echo "$id: done"; continue; fi
  m=$(free -g | awk '/^Mem:/{print $7}'); [ "$m" -ge 6 ] || { echo "free memory ${m}G < 6G: stopping before $id"; exit 1; }
  s=$(date +%s)
  if SKIP_D=1 bash experiments/exp48/build-images.sh "$id" > "$W/build-$id.log" 2>&1; then b=0; else b=1; fi
  e=$(date +%s)
  printf '{"exit":%s,"sec":%s,"MiB":%s}\n' "$b" "$((e - s))" "$(( $(docker image inspect "pitwall/realrepo-tree:$id-abc" --format '{{.Size}}' 2>/dev/null || echo 0) / 1048576 ))" > "$V/out/$id-build.json"
  if [ $b -ne 0 ]; then echo "$id: BUILD FAILED"; tail -5 "$W/build-$id.log"; continue; fi
  rm -rf "$W/$id"; mkdir -p "$W/$id"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/tests" "$W/$id/tests"
  cp -r "$L/harbor/A-reference/harbor-tasks/$id/solution" "$W/$id/solution"
  for p in hidden reference history; do
    docker run --rm --network none --memory "$MEM" --memory-swap "$MEM" -e G4_HARNESS_RE="$HRE" \
      -v "$W/g4:/g4:ro" -v "$W/$id/tests:/tests:ro" -v "$W/$id/solution:/solution:ro" -v "$W/out:/out" \
      "pitwall/realrepo-tree:$id-abc" /opt/pitwall/node/bin/node /g4/g4-in-image.mjs "$p" "/out/$id-abc-$p.json" > /dev/null 2>&1
    cp "$W/out/$id-abc-$p.json" "$V/out/" 2>/dev/null || echo "$id: NO RESULT for $p"
  done
  echo "$id: $(( $(date +%s) - s )) s"
done
echo VERIFY-DONE
