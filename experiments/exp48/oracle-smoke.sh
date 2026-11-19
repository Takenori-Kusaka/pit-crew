#!/bin/bash
# EXP-48: the two scripted controls THROUGH HARBOR (oracle agent: no model, no token), to check
# what the in-image tests cannot: that Harbor builds the one-line environment, runs the control,
# uploads tests/ only for the verifier, and that the verifier finishes inside its time limit.
#   bash experiments/exp48/oracle-smoke.sh <sample id>       (inside WSL; one heavy job at a time)
# Writes local/exp48-gq/g4-out/<sample>-oracle-<control>.json (numbers only).
set -u
cd /mnt/e/Github/pit-crew
s=${1:?sample id}
L=local/exp48-gq
OUT=$L/g4-out
W=${G4_WORK:-$HOME/.cache/pit-wall/exp48-g4}
MEM_MB=${G4_MEM_MB:-6144}
m=$(free -g | awk '/^Mem:/{print $7}'); [ "$m" -ge 6 ] || { echo "free memory ${m}G < 6G: not starting"; exit 1; }
source experiments/heavy-lock.sh exp48-oracle
for sc in reference noop; do
  node experiments/exp48/materialise.mjs arm experiments/exp48/samples/$s.json A --script $sc > /dev/null || exit 1
  rm -rf "$W/oracle-$sc"; mkdir -p "$W/oracle-$sc"
  cp -r "$L/harbor/A-$sc/harbor-tasks/$s" "$W/oracle-$sc/task"
  t0=$(date +%s)
  harbor run -p "$W/oracle-$sc/task" -a oracle -k 1 -n 1 -o "$W/oracle-$sc/jobs" --memory limit --override-memory-mb "$MEM_MB" > "$W/oracle-$sc/harbor.log" 2>&1
  rc=$?
  t1=$(date +%s)
  trial=$(ls -d "$W/oracle-$sc"/jobs/*/*/ 2>/dev/null | head -1)
  node -e '
    const fs = require("fs"), path = require("path");
    const [trial, rc, sec, out, sc] = process.argv.slice(1);
    const rd = (p) => { try { return JSON.parse(fs.readFileSync(path.join(trial, p), "utf8")); } catch { return null; } };
    const res = rd("result.json"), h = rd("verifier/hidden.json"), st = rd("verifier/state.json");
    const doc = { control: sc, harborExit: Number(rc), wallSec: Number(sec), trialFound: !!trial && fs.existsSync(trial),
      exception: res && res.exception_info ? String(res.exception_info.exception_type) : null,
      hidden: h && { hidden: h.hidden, siblings: h.siblings, run: { exit: h.run.exit, timedOut: h.run.timedOut, ms: h.run.ms }, q4: h.q4 && { failsOnPrefix: h.q4.failsOnPrefix, passesOnReference: h.q4.passesOnReference }, totalMs: h.totalMs },
      state: st && { changed: Object.keys(st.files).length, treeFiles: st.real.treeFiles, fixtureIntact: st.git.fixtureIntact, records: st.real.records.length, bytes: fs.statSync(path.join(trial, "verifier/state.json")).size } };
    fs.writeFileSync(out, JSON.stringify(doc, null, 1));
    console.log(sc, JSON.stringify({ harborExit: doc.harborExit, wallSec: doc.wallSec, exception: doc.exception, allPassed: doc.hidden && doc.hidden.hidden.allPassed, anyFailed: doc.hidden && doc.hidden.hidden.anyFailed }));
  ' "${trial:-/nonexistent}" "$rc" "$((t1 - t0))" "$OUT/$s-oracle-$sc.json" "$sc"
done
