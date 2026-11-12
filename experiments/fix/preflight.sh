#!/bin/bash
# Preflight for the fix suite: one cell, the default arm, one trial, the Haiku class. Checks that the
# fixture builds in the image, the gh stand-in answers, the fix skill is invoked and the fix grader
# reads the record. Not an experiment (no verdict is drawn; the cell's outcome is not reported).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh preflight-fix
C=${1:-fx-a1}
MODEL=${MODEL:-claude-haiku-5-5}
out=runs/2026-11-11/preflight-fix-$C
echo "$(date +%H:%M) preflight $C model $MODEL free $(free -g | awk '/^Mem:/{print $7}')G"
node packages/pit-wall/src/cli.mjs run suites/fix/suite.yaml --runner harbor --arms path:subjects/fix-skill-default@/fix --cases "$C" --trials 1 --model "$MODEL" --max-turns 40 --out "$out" > "$out.log" 2>&1; tail -3 "$out.log"
node -e '
const r=JSON.parse(require("fs").readFileSync(process.argv[1]+"/results.json","utf8")).records[0];
const calls=(r.trajectory?.steps??[]).flatMap(s=>s.tool_calls??[]);
const skills=calls.filter(c=>c.function_name==="Skill").map(c=>JSON.stringify(c.arguments).slice(0,60));
console.log("validity", r.validity?.status, r.validity?.faults??"", "| steps", r.trajectory?.steps?.length, "calls", calls.length, "| model", r.trajectory?.agent?.model, "| skills", skills.join(" "));
console.log("gh state items", Object.keys(r.state?.gh?.items??{}).length, "| rate limits", JSON.stringify((r.trajectory?.extra?.pitwall?.rate_limits??[]).slice(-1)).slice(0,200));
' "$out"
node packages/pit-wall/src/graders/process/cli.mjs "$out/results.json" --spec experiments/fix/process-spec.json --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const r=j.rows[0];console.log("grader read the record: role", r.role??"?", "B required", r.B?.required, "(share not reported: preflight)");}catch(e){console.log("grader output unreadable:", String(e.message).slice(0,100));}})'
echo "$(date +%H:%M) preflight done"
