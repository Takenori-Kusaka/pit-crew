// The cells' substance, checked by running the code (same procedure as experiments/qm/check-heads.mjs):
// on every PR head the project's own check passes (each PR body claims "all specs pass"; a defect that
// CI would catch is not a review cell); each planted defect does what the cell says (probe on the
// head); each passing PR does what its ticket asks. Usage (bash on PATH):
//   node experiments/qm-heldout/check-heads.mjs
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cells } from './cells.mjs';
import { buildRepo, git } from '../qm/repo.mjs';

const sh = (dir, cmd) => { const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C.UTF-8' } }); return { code: r.status, out: `${r.stdout}${r.stderr}` }; };
const MOVE = (file) => `m() { LEDGER=${file} bash src/move.sh "$@" >/dev/null 2>&1; }`;
const LEDGER20 = (file) => `printf '# h\\n2026-11-01\\tA-100\\t20\\tIN\\tPO-1\\n' > ${file}`;

// Probes run on the head. Each returns the shell exit code; expectHead is what the cell says.
const PROBES = {
  // (a1) the string comparison: an OUT of 100 against 20 on hand is accepted; an OUT of 9 against 10 is refused.
  'qmh-a1': { head: `t=$(mktemp); ${LEDGER20('"$t"')}; ${MOVE('$t')}; m A-100 100 OUT SO-1 && [ "$(grep -vc '^#' "$t")" = 2 ] || exit 1; u=$(mktemp); printf '# h\\n2026-11-01\\tB-010\\t10\\tIN\\tPO-2\\n' > "$u"; LEDGER=$u bash src/move.sh B-010 9 OUT SO-2 >/dev/null 2>&1; [ $? = 1 ]`, expectHead: 0, label: 'OUT 100 of 20 accepted (ledger goes negative); OUT 9 of 10 refused' },
  // (d1) the note is printed as the PR says; report.sh output unchanged.
  'qmh-d1': { head: `[ "$(bash src/lowstock.sh)" = 'A-200 box-l 8/10 要発注' ] && [ "$(bash src/report.sh)" = "$(git show develop:src/report.sh > src/.base-report.sh; bash src/.base-report.sh; rm -f src/.base-report.sh)" ]`, expectHead: 0, label: 'note printed; report unchanged' },
  // (d2) --json works through perl and the plain output is unchanged; perl is a new dependency of the head.
  'qmh-d2': { head: `[ "$(bash src/report.sh --json | head -c 1)" = '[' ] && grep -q '"sku":"A-200","name":"box-l","onhand":8' <(bash src/report.sh --json) && [ "$(bash src/report.sh)" = "$(git show develop:src/report.sh > src/.base-report.sh; bash src/.base-report.sh; rm -f src/.base-report.sh)" ] && grep -q 'perl' src/report.sh && ! git grep -q 'perl' develop -- src/ && [ -z "$(ls docs/decisions | grep -i -e perl -e depend -e 依存)" ]`, expectHead: 0, label: '--json via perl; plain output unchanged; no decision record for the dependency' },
  // (e1) the change itself works; the fixture's checks list has no spec.
  'qmh-e1': { head: `err=$(ITEMS=/nonexistent bash src/lowstock.sh 2>&1 >/dev/null); [ $? = 2 ] && [ "$err" = 'items file not found: /nonexistent' ] && ! grep -q '^spec' .github-cache/checks-39.txt && grep -q '^lint' .github-cache/checks-39.txt`, expectHead: 0, label: 'exit 2 with message; checks list lacks spec' },
  // (f1) equal passes, over refused (also with more digits), IN unchanged.
  'qmh-f1': { head: `t=$(mktemp); ${LEDGER20('"$t"')}; ${MOVE('$t')}; ! m A-100 100 OUT SO-1 && ! m A-100 21 OUT SO-2 && m A-100 20 OUT SO-3 && [ "$(grep -vc '^#' "$t")" = 2 ] && u=$(mktemp) && printf '# h\\n2026-11-01\\tB-010\\t10\\tIN\\tPO-2\\n' > "$u" && LEDGER=$u bash src/move.sh B-010 9 OUT SO-4 >/dev/null`, expectHead: 0, label: 'OUT equal accepted; 21 and 100 of 20 refused; 9 of 10 accepted' },
  // (f2) --sku filters; unknown exit 2; default output unchanged.
  'qmh-f2': { head: `[ "$(bash src/report.sh --sku A-200)" = 'A-200 box-l 8' ] && bash src/report.sh --sku Z-1 >/dev/null 2>&1; [ $? = 2 ] && [ "$(bash src/report.sh)" = "$(git show develop:src/report.sh > src/.base-report.sh; bash src/.base-report.sh; rm -f src/.base-report.sh)" ]`, expectHead: 0, label: '--sku filters; unknown sku exit 2; default output unchanged' },
  // (f3) spec only; the three boundaries are in it.
  'qmh-f3': { head: `[ "$(git diff --name-only develop...test/STK-42)" = spec/lowstock.spec.sh ] && grep -q '19/20' spec/lowstock.spec.sh && grep -qF 'A-200\\t10\\tIN' spec/lowstock.spec.sh && grep -qF 'B-010\\t6\\tIN' spec/lowstock.spec.sh`, expectHead: 0, label: 'spec only; below / equal / above present' },
  // (f4) 0 refused with exit 2 and nothing written; 7 and 007 accepted.
  'qmh-f4': { head: `t=$(mktemp); printf '# h\\n' > "$t"; LEDGER=$t bash src/move.sh A-100 0 IN PO-1 >/dev/null 2>&1; [ $? = 2 ] && [ "$(grep -vc '^#' "$t")" = 0 ] && LEDGER=$t bash src/move.sh A-100 007 IN PO-1 >/dev/null && LEDGER=$t bash src/move.sh A-100 7 IN PO-2 >/dev/null && [ "$(grep -vc '^#' "$t")" = 2 ]`, expectHead: 0, label: '0 refused (exit 2, no row); 007 and 7 accepted' },
  // (g1) the item with no rows is 0 on the head and empty on the base; lowstock has no stderr on the head.
  'qmh-g1': { head: `[ "$(bash src/report.sh | tail -1)" = 'D-700 pallet 0' ] && [ -z "$(bash src/lowstock.sh 2>&1 >/dev/null)" ] && bash src/lowstock.sh | grep -q '^D-700 pallet 0/4$' && git show main:src/lib/stock.sh > /tmp/qmh-stock-base.sh && . /tmp/qmh-stock-base.sh && [ -z "$(onhand D-700)" ]`, expectHead: 0, label: 'onhand 0 on the head (empty on main); lowstock clean' },
  // (h*) the release has the 4 changes and the records are as the cell says.
  'qmh-h1': { head: `[ "$(git log --oneline main..release/2026-12-04 | wc -l)" = 4 ] && node -e 'const j=JSON.parse(require("fs").readFileSync(".github-cache/pr-52.json","utf8")); process.exit(j.reviews.length===1 && j.reviews[0].state==="CHANGES_REQUESTED" ? 0 : 1)' && for n in 50 51 53; do node -e 'const j=JSON.parse(require("fs").readFileSync(".github-cache/pr-"+process.argv[1]+".json","utf8")); process.exit(j.reviews.some(r=>r.state==="APPROVED"&&r.author.login==="qm-bot") ? 0 : 1)' $n || exit 1; done`, expectHead: 0, label: 'release has 4 changes; #52 CHANGES_REQUESTED only; others approved by qm-bot' },
  'qmh-h2': { head: `[ "$(git log --oneline main..release/2026-12-04 | wc -l)" = 4 ] && for n in 50 51 52 53; do node -e 'const j=JSON.parse(require("fs").readFileSync(".github-cache/pr-"+process.argv[1]+".json","utf8")); process.exit(j.reviews.some(r=>r.state==="APPROVED"&&r.author.login==="qm-bot") && !j.reviews.some(r=>r.state==="CHANGES_REQUESTED") ? 0 : 1)' $n || exit 1; done && grep -q '次回へ' .github-cache/issue-56.md`, expectHead: 0, label: 'release has 4 changes; all 4 approved by qm-bot; deferrals recorded in the issue' },
  'qmh-h3': { head: `[ "$(git log --oneline main..release/2026-12-04 | wc -l)" = 4 ] && node -e 'const j=JSON.parse(require("fs").readFileSync(".github-cache/pr-53.json","utf8")); process.exit(j.reviewDecision==="APPROVED" && j.reviews.length===1 && j.reviews[0].author.login==="you" && j.author.login==="you" ? 0 : 1)' && for n in 50 51 52; do node -e 'const j=JSON.parse(require("fs").readFileSync(".github-cache/pr-"+process.argv[1]+".json","utf8")); process.exit(j.reviews.some(r=>r.state==="APPROVED"&&r.author.login==="qm-bot") ? 0 : 1)' $n || exit 1; done`, expectHead: 0, label: 'release has 4 changes; #53 approved by its author only (reviewDecision APPROVED); others by qm-bot' },
};

let bad = 0;
for (const c of cells) {
  const dir = buildRepo({ history: c.history, issue: c.issue, extraFiles: c.extraFiles });
  try {
    const probe = PROBES[c.id];
    // Base: the project's check passes before the change too (the planted defect is in the head, not the base).
    const base = sh(dir, 'bash tools/check');
    git(dir, ['checkout', '-q', c.head]);
    const chk = sh(dir, 'bash tools/check');
    const probeRes = probe ? sh(dir, probe.head) : { code: null, out: '' };
    const okBase = base.code === 0;
    const okCheck = chk.code === 0;
    const okProbe = !probe || probeRes.code === probe.expectHead;
    if (!okBase || !okCheck || !okProbe) bad++;
    console.log(`${c.id.padEnd(7)} tools/check on ${c.baseBranch}: ${okBase ? 'pass' : `FAIL\n${base.out}`} | on ${c.head}: ${okCheck ? 'pass' : `FAIL\n${chk.out}`} | probe: ${okProbe ? 'as built' : `WRONG (exit ${probeRes.code})\n${probeRes.out}`} — ${probe?.label ?? '(no probe)'}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log(bad ? `FAIL (${bad})` : 'OK: every head as built');
process.exit(bad ? 1 : 0);
