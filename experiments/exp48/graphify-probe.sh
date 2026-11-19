#!/bin/bash
# EXP-48 (issue #56, G4.partial "graphify-in-D", review 12.3 g): why `graphify explain` fails on a
# task's D tree — asked OUTSIDE the image, with no docker job, so that the cause can be read while
# the image run waits for memory. The in-image answer is the `graphify` phase of already-red.sh;
# this probe is the same tool version on the same tracked graph, not the image.
#   bash experiments/exp48/graphify-probe.sh [id ...]        (inside WSL; default: v19 and, as a control, v16)
# graphify: PyPI graphifyy (Apache-2.0), the version the images pin, installed with `pip --target`
# under ~/.cache/pit-wall/exp48-graphify (needs network once). The tracked graph is taken from the
# local clone at the task's pre-fix commit. Output: local/exp48-gq/g4-out/graphify-probe/<id>.json
# (numbers, exception type, frames inside python packages) and <id>.stderr.txt (local only).
set -u
cd /mnt/e/Github/pit-crew
G=local/exp48-gq
OUT=$G/g4-out/graphify-probe
VER=${G4_GRAPHIFY:-0.9.107}
W=$HOME/.cache/pit-wall/exp48-graphify
mkdir -p "$OUT" "$W"
[ -d "$W/site/graphify" ] || pip3 install -q --no-cache-dir --target "$W/site" "graphifyy==$VER" || { echo "could not install graphifyy $VER"; exit 1; }
export PYTHONPATH=$W/site
for id in ${*:-v19 v16}; do
  spec=$G/verify/specs/$id.json
  [ -f "$spec" ] || { echo "$id: no spec"; continue; }
  c=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).prefix_commit)' "$spec")
  f=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).impl_files[0] ?? "src")' "$spec")
  rm -rf "$W/$id"; mkdir -p "$W/$id"
  if ! git --git-dir=$G/gq.git archive "$c" graphify-out 2>/dev/null | tar -x -C "$W/$id"; then echo "$id: graphify-out/ is not tracked at the pre-fix commit"; continue; fi
  blob=$(git --git-dir=$G/gq.git rev-parse "$c:graphify-out/graph.json")
  ( cd "$W/$id" && python3 "$W/site/bin/graphify" explain "$f" > out.txt 2> err.txt; echo $? > exit.txt )
  cp "$W/$id/err.txt" "$OUT/$id.stderr.txt"
  node experiments/exp48/graphify-probe.mjs "$id" "$W/$id" "$c" "$blob" "$VER" > "$OUT/$id.json"
  node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(d.id, "exit", d.explain.exit, d.explain.exceptionType ?? "", "graph.json parses:", d.graphJsonParses)' "$OUT/$id.json"
done
