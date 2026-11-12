#!/bin/bash
# EXP-48: build the layered task images (node -> deps per lock file -> tree per task and arm kind)
# from the contexts written by materialise.mjs. Run inside WSL, one docker job at a time:
#   bash experiments/exp48/build-images.sh <task id>...
# Appends "time, image, build seconds, bytes, exit" to local/exp48-gq/build/build-times.tsv.
set -u
B=/mnt/e/Github/pit-crew/local/exp48-gq/build
L=$B/build-times.tsv
avail=$(free -g | awk '/^Mem:/{print $7}'); [ "$avail" -ge 6 ] || { echo "free memory ${avail}G < 6G: not starting"; exit 1; }
img() { # tag context
  if docker image inspect "$1" >/dev/null 2>&1 && [ -z "${REBUILD:-}" ]; then echo "have $1"; return 0; fi
  s=$(date +%s)
  docker build -q -t "$1" "$2" > /tmp/exp48-build.log 2>&1; rc=$?
  e=$(date +%s)
  size=$(docker image inspect "$1" --format '{{.Size}}' 2>/dev/null)
  printf '%s\t%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "$1" "$((e-s))" "${size:-0}" "$rc" | tee -a "$L"
  [ $rc -eq 0 ] || { tail -30 /tmp/exp48-build.log; return 1; }
}
for t in "$@"; do
  m=$B/$t/materialised.json
  node=$(grep -o '"node": *"[^"]*"' $m | head -1 | cut -d'"' -f4); deps=$(grep -o '"deps": *"[^"]*"' $m | head -1 | cut -d'"' -f4)
  nv=${node##*:}; lh=${deps##*:}
  img "$node" "$B/node-$nv" || exit 1
  img "$deps" "$B/deps-$lh" || exit 1
  img "pitwall/realrepo-tree:$t-abc" "$B/$t/tree-abc" || exit 1
  if [ -z "${SKIP_D:-}" ]; then img "pitwall/realrepo-tree:$t-d" "$B/$t/tree-d" || exit 1; fi
done
docker images --format '{{.Repository}}:{{.Tag}}\t{{.Size}}' | grep realrepo
