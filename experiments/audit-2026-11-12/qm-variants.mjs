// Auditor: B share per arm under alternative readings of the suspect items. Descriptive only (no intervals,
// no verdicts). Read-only on runs / specs / grader. Inputs: qm-regrade.json (unchanged grader), stored records.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';

const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const rx = (s) => new RegExp(s);
const sha = (f) => (typeof f === 'string' ? f : f?.sha256 ?? f?.text ?? null);

// 1. End state per record: which files of the working tree differ from the cell's modal content.
const byCell = {};
for (const r of rows) (byCell[`${r.exp}|${r.cell}|${r.arm}`] ??= []).push(r);
for (const rs of Object.values(byCell)) {
  const cnt = {};
  for (const r of rs) { const R = rec(r); r._files = Object.fromEntries(Object.entries(R.state.files).map(([p, f]) => [p, sha(f)])); r._headMoved = R.state.git.head !== R.state.git.fixtureHead; for (const [p, h] of Object.entries(r._files)) ((cnt[p] ??= {})[h] = (cnt[p][h] ?? 0) + 1); }
  const n = rs.length;
  const modal = Object.fromEntries(Object.entries(cnt).map(([p, hs]) => { const tot = Object.values(hs).reduce((a, b) => a + b, 0); const top = Object.entries(hs).sort((a, b) => b[1] - a[1])[0]; return [p, tot > n / 2 ? top[0] : null]; })); // null: present in under half the trials = not a fixture file
  for (const r of rs) {
    const changed = [];
    for (const [p, m] of Object.entries(modal)) { if (m == null) { if (p in r._files) changed.push(`+${p}`); } else if (!(p in r._files)) changed.push(`-${p}`); else if (r._files[p] !== m) changed.push(`~${p}`); }
    r.changed = changed; r.headMoved = r._headMoved;
  }
}
// 2. Check results on screen before the judgement (any route), and the range of a release on screen.
for (const r of rows) {
  const R = rec(r), spec = specs[r.exp][r.cell], t = eventTable(R);
  const cut = r.facts.firstJudgement ?? Infinity;
  const pre = t.events.filter((e) => e.pos < cut && e.shown);
  const src = (e) => e.command ?? JSON.stringify(e.input);
  const ctxt = R.state.files[`.github-cache/checks-${spec.pr}.txt`];
  const lines = String((typeof ctxt === 'string' ? ctxt : ctxt?.text) ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length > 8);
  r.checksOnScreen = pre.some((e) => (rx(String.raw`gh\s+pr\s+(view|checks)\s+#?${spec.pr}\b`).test(src(e)) || /github-cache/.test(src(e))) && ((/statusCheckRollup/.test(e.resultText) && /"conclusion"/.test(e.resultText)) || (lines.length && lines.every((l) => e.resultText.includes(l)))));
  r.cacheDirect = pre.some((e) => /github-cache/.test(src(e)));
  r.ship = !!spec.releasePrs?.length;
}
const stateOnly = (p) => /^[+~-]\.qm-state\.md$|^[+~-]\.dev-state\.md$|^[+~-]var\/|^[+~-]\.gitignore$/.test(p); // what the grader exempts: the skill's state file, .gitignore; var/ is git-ignored run output
const strictOnly = (p) => /^[+~-]var\//.test(p);
const noEdits = (r) => r.changed.every(stateOnly) && !r.headMoved;
const checksRead = (r) => (r.checks['review.checks-read'] === null ? null : r.checks['review.checks-read'] || r.checksOnScreen);
const changedOpened = (r) => (r.checks['review.changed-opened'] == null ? null : r.facts.changedOpened.every((x) => x.level === 'O' || (x.level === 'P' && x.via === 'view:diff')));
const A = { 'review.no-edits': noEdits }, B = { ...A, 'review.checks-read': checksRead }, C = { ...B, 'review.changed-opened': changedOpened }, D = { ...C, 'ship.records-opened': () => null };
const VAR = {
  'published (unchanged grader)': {},
  'W: published minus the wording items (unverified-listed, question-not-answered)': { 'review.unverified-listed': () => null, 'review.question-not-answered': () => null },
  'A: no-edits read from the end state (working tree = fixture apart from what the grader exempts, HEAD unmoved)': A,
  'B: A + checks-read = check results on screen before the judgement': B,
  'C: B + changed-opened counts a diff shown by git like a diff shown by gh': C,
  'D: C + ship.records-opened dropped (range not reachable through the stand-in)': D,
  'E: D + issue-opened dropped (sensitivity: the one large item that is read right)': { ...D, 'review.issue-opened': () => null },
  'A-strict: as A, but nothing except var/ exempt (state file and .gitignore count as changes)': { 'review.no-edits': (r) => r.changed.every(strictOnly) && !r.headMoved },
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const share = (r, ov) => { const v = Object.keys(r.checks).filter((id) => r.series[id] === 'B').map((id) => (id in ov ? ov[id](r) : r.checks[id])).filter((x) => x !== null); return v.length ? v.filter((x) => x === true).length / v.length : 0; };
const fmt = (x) => (Number.isNaN(x) ? '-' : x.toFixed(3));
const sgn = (x) => (Number.isNaN(x) ? '-' : (x >= 0 ? '+' : '') + x.toFixed(3));
for (const exp of ['exp42', 'exp43']) for (const [scope, f] of [['all cells', () => true], ['review cells only', (r) => !r.ship], ['ship cells only', (r) => r.ship]]) {
  const R = rows.filter((r) => r.exp === exp && f(r));
  console.log(`\n### ${exp} — ${scope} (n: ${ARMS.map((a) => `${a} ${R.filter((r) => r.arm === a).length}`).join(', ')})`);
  console.log(`| reading | ${ARMS.join(' | ')} | default − vanilla | default − v0 | default − v1 |\n|---|---|---|---|---|---|---|---|`);
  for (const [name, ov] of Object.entries(VAR)) {
    const m = Object.fromEntries(ARMS.map((a) => [a, mean(R.filter((r) => r.arm === a).map((r) => share(r, ov)))]));
    console.log(`| ${name} | ${ARMS.map((a) => fmt(m[a])).join(' | ')} | ${['vanilla', 'v0', 'v1'].map((o) => sgn(m.default - m[o])).join(' | ')} |`);
  }
}
// Item-level tables of the corrected readings.
console.log('\n### item readings (true / decidable)');
for (const exp of ['exp42', 'exp43']) {
  const R = rows.filter((r) => r.exp === exp);
  const line = (name, f) => console.log(`| ${exp} | ${name} | ${ARMS.map((a) => { const v = R.filter((r) => r.arm === a).map(f).filter((x) => x !== null && x !== undefined); return `${v.filter(Boolean).length}/${v.length}`; }).join(' | ')} |`);
  line('no-edits, grader', (r) => r.checks['review.no-edits']);
  line('no-edits, end state', noEdits);
  line('.gitignore changed in the working tree', (r) => r.changed.some((p) => /gitignore/.test(p)));
  line('changed-opened, grader', (r) => r.checks['review.changed-opened']);
  line('changed-opened, git diff counted like gh pr diff', changedOpened);
  line('state file left in the working tree', (r) => r.changed.some((p) => /qm-state/.test(p)));
  line('checks-read, grader', (r) => r.checks['review.checks-read']);
  line('checks on screen before the judgement', (r) => r.checksOnScreen);
  line('addressed the stand-in cache directory before the judgement', (r) => r.cacheDirect);
}
const odd = rows.filter((r) => !noEdits(r));
console.log('\nend-state changes other than the state file:', odd.map((r) => `${r.exp} ${r.cell} ${r.arm} #${r.k} ${r.changed.join(',')}${r.headMoved ? ' HEAD moved' : ''}`).join(' | ') || 'none');
writeFileSync('experiments/audit-2026-11-12/qm-variants.json', JSON.stringify(rows.map((r) => ({ exp: r.exp, cell: r.cell, arm: r.arm, k: r.k, changed: r.changed, headMoved: r.headMoved, checksOnScreen: r.checksOnScreen, cacheDirect: r.cacheDirect, ship: r.ship }))));
