#!/bin/bash
# EXP-48: the history that arms A, B and C get (owner decision 2026-11-13: history in every arm up
# to the pre-fix commit; without the harness files in ANY commit for the arms without a harness).
# Makes local/exp48-gq/gq-filtered.git: the public clone with every path of harness-files.json
# removed from every commit (git-filter-repo, MIT, one python file, fetched at a pinned tag into
# local/exp48-gq/tools/). filter-repo/commit-map in it maps each original commit to its filtered one.
# Arm D uses the unfiltered clone. Run inside WSL (the rewrite runs on the Linux file system):
#   bash experiments/exp48/build-history-mirror.sh
set -eu
# disk rule 1: stop below 40 GiB free on E: (the rewrite needs about 2 GiB more while it runs)
a=$(df -BG --output=avail /mnt/e | tail -1 | tr -dc 0-9); [ "${a:-0}" -ge "${EXP48_MIN_E_G:-40}" ] || { echo "E: has ${a}G free: not starting"; exit 5; }
cd /mnt/e/Github/pit-crew
L=local/exp48-gq
W=${EXP48_HIST_WORK:-$HOME/.cache/pit-wall/exp48-hist}
TAG=v2.47.0
mkdir -p "$L/tools" "$W"
if [ ! -s "$L/tools/git-filter-repo" ]; then
  curl -fsSL "https://raw.githubusercontent.com/newren/git-filter-repo/$TAG/git-filter-repo" -o "$L/tools/git-filter-repo"
fi
# harness patterns -> filter-repo arguments: 'dir/' a directory, '**/NAME' a name at any depth, else a path
mapfile -t ARGS < <(node -e '
  const h = JSON.parse(require("fs").readFileSync("experiments/exp48/harness-files.json", "utf8")).remove;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const { pattern: p } of h) {
    if (p.startsWith("**/")) { console.log("--path-regex"); console.log("(^|/)" + esc(p.slice(3)) + "$"); }
    else { console.log("--path"); console.log(p); }
  }')
# Every commit a pointer file names must be in the clone and under a ref, or the filter does not
# see it: some candidates' commits are on no branch of the public repository (old PR branches;
# GitHub still serves them by id). They get refs/exp48/keep/<id> in the clone (local only).
node -e '
  const fs = require("fs"), path = require("path");
  const out = new Set();
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".json")) for (const m of fs.readFileSync(p, "utf8").matchAll(/"(?:prefix_commit|reference_commit|pre_fix_commit|fix_commit)"\s*:\s*"([0-9a-f]{40})"/g)) out.add(m[1]); } };
  walk("experiments/exp48");
  console.log([...out].join("\n"));' | while read -r c; do
  [ -n "$c" ] || continue
  git -C "$L/gq.git" cat-file -e "$c^{commit}" 2>/dev/null || git -C "$L/gq.git" fetch -q origin "$c" || { echo "cannot get commit $c"; exit 1; }
  git -C "$L/gq.git" update-ref "refs/exp48/keep/$c" "$c"
done
t0=$(date +%s)
rm -rf "$W/gq-filtered.git"
git clone -q --mirror "$L/gq.git" "$W/gq-filtered.git"
before=$(git -C "$W/gq-filtered.git" rev-list --all --count)
( cd "$W/gq-filtered.git" && python3 "/mnt/e/Github/pit-crew/$L/tools/git-filter-repo" --force --invert-paths "${ARGS[@]}" > "$W/filter-repo.log" 2>&1 ) || { tail -20 "$W/filter-repo.log"; exit 1; }
after=$(git -C "$W/gq-filtered.git" rev-list --all --count)
# No tag and no remote-tracking ref is wanted; branches stay so that every mapped commit is reachable.
git -C "$W/gq-filtered.git" for-each-ref --format='%(refname)' refs/tags | xargs -r -n1 git -C "$W/gq-filtered.git" update-ref -d
git -C "$W/gq-filtered.git" reflog expire --expire=now --all
git -C "$W/gq-filtered.git" gc -q --prune=now
t1=$(date +%s)
rm -rf "$L/gq-filtered.git"
cp -r "$W/gq-filtered.git" "$L/gq-filtered.git"
# one history mirror only (disk rule 3, 2026-11-13): the working copy is deleted once copied
rm -rf "$W/gq-filtered.git"
node -e '
  const [before, after, sec, n, size] = process.argv.slice(1);
  require("fs").writeFileSync("local/exp48-gq/history-mirror.json", JSON.stringify({ tool: "git-filter-repo '"$TAG"' (MIT)", commitsBefore: +before, commitsAfter: +after, seconds: +sec, patterns: +n, sizeMiB: Math.round(+size / 1024) }, null, 1));
  console.log(require("fs").readFileSync("local/exp48-gq/history-mirror.json", "utf8"));
' "$before" "$after" "$((t1 - t0))" "$(( ${#ARGS[@]} / 2 ))" "$(du -sk "$L/gq-filtered.git" | cut -f1)"
