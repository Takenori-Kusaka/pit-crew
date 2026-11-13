#!/bin/bash
# EXP-48: build the layered task images (node -> deps per lock file -> tree per task and arm kind)
# from the contexts written by materialise.mjs. Run inside WSL, one docker job at a time:
#   bash experiments/exp48/build-images.sh <task id>...
#   SKIP_D=1 / ONLY_D=1: build only the A/B/C tree or only the D tree.
# Appends "time, image, build seconds, bytes, exit, E: free GiB after" to local/exp48-gq/build/build-times.tsv.
# Disk rules (2026-11-13 incident: C: reached 0 bytes and WSL would not start; the WSL disk now
# lives on E:, so every byte docker writes is taken from E:):
#   - before every build, E: must have at least EXP48_MIN_E_G GiB free (default 40), else stop;
#   - the EXP-48 images present may not exceed EXP48_MAX_IMAGES_G GiB (default 15), else stop.
# The callers (image-verify.sh, run-g4.sh) delete the images after use; this script never deletes.
set -u
B=/mnt/e/Github/pit-crew/local/exp48-gq/build
L=$B/build-times.tsv
TMPLOG=/mnt/e/Github/pit-crew/local/exp48-gq/tmp/exp48-build.log
mkdir -p "$(dirname "$TMPLOG")"
e_free_g() { df -BG --output=avail /mnt/e | tail -1 | tr -dc 0-9; }
exp48_images_g() { docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | awk '/^pitwall\/realrepo-/{print $2}' | sort -u | xargs -r docker image inspect --format '{{.Size}}' | awk '{s+=$1} END {printf "%d", s/1073741824}'; }
need_disk() {
  a=$(e_free_g); if [ "${a:-0}" -lt "${EXP48_MIN_E_G:-40}" ]; then echo "E: has ${a}G free < ${EXP48_MIN_E_G:-40}G: not building $1"; exit 5; fi
  i=$(exp48_images_g); if [ "${i:-0}" -gt "${EXP48_MAX_IMAGES_G:-15}" ]; then echo "EXP-48 images use ${i}G > ${EXP48_MAX_IMAGES_G:-15}G: not building $1"; exit 5; fi
}
avail=$(free -g | awk '/^Mem:/{print $7}'); [ "$avail" -ge 6 ] || { echo "free memory ${avail}G < 6G: not starting"; exit 1; }
img() { # tag context
  if docker image inspect "$1" >/dev/null 2>&1 && [ -z "${REBUILD:-}" ]; then echo "have $1"; return 0; fi
  need_disk "$1"
  s=$(date +%s)
  docker build -q -t "$1" "$2" > "$TMPLOG" 2>&1; rc=$?
  e=$(date +%s)
  size=$(docker image inspect "$1" --format '{{.Size}}' 2>/dev/null)
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "$1" "$((e-s))" "${size:-0}" "$rc" "$(e_free_g)" | tee -a "$L"
  [ $rc -eq 0 ] || { tail -30 "$TMPLOG"; return 1; }
}
for t in "$@"; do
  m=$B/$t/materialised.json
  node=$(grep -o '"node": *"[^"]*"' $m | head -1 | cut -d'"' -f4); deps=$(grep -o '"deps": *"[^"]*"' $m | head -1 | cut -d'"' -f4)
  nv=${node##*:}; lh=${deps##*:}
  img "$node" "$B/node-$nv" || exit 1
  img "$deps" "$B/deps-$lh" || exit 1
  if [ -z "${ONLY_D:-}" ]; then img "pitwall/realrepo-tree:$t-abc" "$B/$t/tree-abc" || exit 1; fi
  if [ -z "${SKIP_D:-}" ]; then img "pitwall/realrepo-tree:$t-d" "$B/$t/tree-d" || exit 1; fi
done
docker images --format '{{.Repository}}:{{.Tag}}\t{{.Size}}' | grep realrepo
