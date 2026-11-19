// EXP-27 analysis, fixed before the results were read (card: docs/experiments/EXP-20261103-27-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2), or if the harm
// predicate disagrees with the final files (t4: the four places; t5w: lib/statement.sh when it is
// in the final tree; trials without it are listed for a check by hand).
// Usage: node experiments/structure/analyze-exp27.mjs [runsDir]   (default runs/2026-11-03)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BRING_MAIN, broadSearch, commandsOf, reachedHelper, threeDot } from './content-metrics.mjs';
import { maskHeredocs } from './phase-metrics.mjs';

const root = process.argv[2] ?? 'runs/2026-11-03';
const norm = (p) => p.split('\\').join('/');
const rowsOf = (dir) => {
  try {
    return execFileSync(process.execPath, ['experiments/structure/phase-metrics.mjs', dir, '', '--rows'], { encoding: 'utf8' })
      .split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  } catch (e) {
    console.log(`STOP: ${dir} failed the measurement check\n${e.stdout}`);
    process.exit(2);
  }
};
const dirs = readdirSync(root).filter((d) => /^exp27-/.test(d) && existsSync(join(root, d, 'results.json')));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const transcripts = Object.fromEntries(dirs.flatMap((d) => walk(join(root, d)).filter((f) => norm(f).endsWith('agent/claude-code.txt')).map((f) => [norm(f).split('/').at(-3), f])));
const recsOf = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;
console.log(`conditions: ${[...new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)))].join(' | ')}`);
for (const d of dirs) {
  const mt = JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).maxTurns;
  const want = /^exp27-big/.test(d) ? 24 : null;
  if (mt !== want) console.log(`  WARNING ${d}: maxTurns ${mt}, expected ${want}`);
}
const ARM = { MskillG: 'D0', MskillD1: 'D1', MskillD1A: 'D1A' };
const all = dirs.flatMap((d) => {
  const recs = Object.fromEntries(recsOf(d).map((r) => [r.harborTrial, r]));
  return rowsOf(join(root, d)).map((x) => {
    const f = transcripts[x.trial];
    const cmds = f ? commandsOf(readFileSync(f, 'utf8').split('\n')) : [];
    const arm = x.arm.match(/dev-structure\/(\w+)@/)?.[1];
    const rec = recs[x.trial];
    const files = Object.keys(rec?.state?.files ?? {});
    const notes = files.filter((p) => p.startsWith('notes/'));
    const noteLines = notes.reduce((s, p) => s + (rec.state.files[p].text ?? '').split('\n').filter((l) => l.trim()).length, 0);
    const baseTests = ['tests/price_test.sh', 'tests/quote_test.sh'];
    const newTests = files.filter((p) => /^tests\/.*_test\.sh$/.test(p) && !baseTests.includes(p));
    const designDoc = files.some((p) => /^docs\//.test(p) || /design|設計/i.test(p));
    return { ...x, run: d, armName: ARM[arm] ?? arm, rec, phase1: x.phases.includes(1),
      broad: broadSearch(cmds), helper: reachedHelper(cmds), three: threeDot(cmds), brought: cmds.some((c) => BRING_MAIN.test(c)),
      notesMade: notes.length > 0, noteLines, newTests: newTests.length, designDoc };
  });
});
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const harm = (x) => x.outcome === 'task-failed';
const text = (x, p) => x.rec?.state?.files?.[p]?.text;
const bad = [], byHand = [];
for (const x of valid) {
  if (x.case.startsWith('t4')) {
    const fh = (text(x, 'lib/util/money.sh') ?? '').includes('+ 9) / 10') || ['bin/price', 'bin/quote', 'lib/invoice.sh'].some((p) => (text(x, p) ?? '').includes('+ 99'));
    if (fh !== harm(x)) bad.push(x.trial);
  } else if (x.case.startsWith('t5')) {
    // t5w is graded on main. A fixed statement in the work tree with a failed task means the fix
    // was not merged into main (found after reading the results: the first version stopped on
    // these 5 trials as disagreements). Only a statement still rounding up with a passed task
    // is a disagreement.
    const s = text(x, 'lib/statement.sh');
    if (s === undefined) byHand.push(x.trial);
    else if (s.includes('+ 99') && !harm(x)) bad.push(x.trial);
    else if (!s.includes('+ 99') && harm(x)) x.notMerged = true;
  }
}
if (bad.length) { console.log(`STOP: harm predicate disagrees with the final files: ${bad.join(' ')}`); process.exit(2); }
console.log(`harm predicate vs final files (t4, t5w): consistent${byHand.length ? `; check by hand (statement not in the final tree): ${byHand.join(' ')}` : ''}`);

const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const line = (A, B) => { const c = cmp(A, B); return `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}`; };
const sel = (re, cell, arm) => valid.filter((x) => re.test(x.run) && x.case === cell && x.armName === arm);
const avg = (xs, g) => (xs.length ? (xs.reduce((s, x) => s + g(x), 0) / xs.length).toFixed(1) : '-');
const T4 = 't4-scatter-big-start', T5 = 't5-stale-base-weak';

console.log('\n## (1) main: D0 vs D1');
for (const cell of [T4, T5]) {
  for (const a of ['D0', 'D1']) { const xs = sel(/^exp27-(big|weak)-/, cell, a); console.log(`${cell} ${a}: harm ${kn(xs, harm).k}/${xs.length}${cell === T5 ? ` (stale-base harm ${kn(xs, (x) => harm(x) && !x.notMerged).k}, fixed but not merged ${kn(xs, (x) => x.notMerged).k})` : ''}, called investigation skill ${kn(xs, (x) => x.phase1).k}/${xs.length}, broad ${kn(xs, (x) => x.broad).k}, reached helper ${kn(xs, (x) => x.helper).k}, three-dot/merge-base ${kn(xs, (x) => x.three).k}, brought main ${kn(xs, (x) => x.brought).k}`); }
}
const c4 = cmp(kn(sel(/^exp27-big-/, T4, 'D0'), harm), kn(sel(/^exp27-big-/, T4, 'D1'), harm));
console.log(`PRIMARY t4 D0 -> D1 (harm): ${line(kn(sel(/^exp27-big-/, T4, 'D0'), harm), kn(sel(/^exp27-big-/, T4, 'D1'), harm))} -> ${c4.p < 0.05 && c4.hi < 0 ? 'REDUCES' : c4.p < 0.05 && c4.lo > 0 ? 'INCREASES' : 'not shown'}`);
console.log(`secondary t5w D0 -> D1 (harm, underpowered): ${line(kn(sel(/^exp27-weak-/, T5, 'D0'), harm), kn(sel(/^exp27-weak-/, T5, 'D1'), harm))}`);

console.log('\n## (2) small requests (T0 s1, T1 s2)');
console.log('| cell | arm | task ok | tool calls (mean) | peak (mean) | called investigation skill | notes made | note lines (mean) | new test files | design doc | all-followed |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const cell of ['s1-typo-start', 's2-wording-start']) for (const a of ['D0', 'D1']) {
  const xs = sel(/^exp27-small-/, cell, a);
  console.log(`| ${cell} | ${a} | ${kn(xs, (x) => !harm(x)).k}/${xs.length} | ${avg(xs, (x) => x.toolCalls)} | ${avg(xs, (x) => x.peak)} | ${kn(xs, (x) => x.phase1).k}/${xs.length} | ${kn(xs, (x) => x.notesMade).k}/${xs.length} | ${avg(xs, (x) => x.noteLines)} | ${kn(xs, (x) => x.newTests > 0).k}/${xs.length} | ${kn(xs, (x) => x.designDoc).k}/${xs.length} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} |`);
}
// Excess (card): T0 = notes made, a new test file, or a design document; T1 = a design document or notes over 20 non-empty lines.
const excess = (x) => (x.case === 's1-typo-start' ? x.notesMade || x.newTests > 0 || x.designDoc : x.designDoc || x.noteLines > 20);
for (const cell of ['s1-typo-start', 's2-wording-start']) console.log(`${cell} excess procedure D0 -> D1: ${line(kn(sel(/^exp27-small-/, cell, 'D0'), excess), kn(sel(/^exp27-small-/, cell, 'D1'), excess))}`);
for (const cell of ['s1-typo-start', 's2-wording-start']) console.log(`${cell} task ok D0 -> D1: ${line(kn(sel(/^exp27-small-/, cell, 'D0'), (x) => !harm(x)), kn(sel(/^exp27-small-/, cell, 'D1'), (x) => !harm(x)))}`);

console.log('\n## (3) action after the check (t5w, exploratory)');
const checkedNoAction = (x) => x.three && !x.brought;
for (const [label, re, a] of [['D1 (main runs)', /^exp27-weak-/, 'D1'], ['D1A', /^exp27-act-/, 'D1A']]) {
  const xs = sel(re, T5, a);
  console.log(`${label}: harm ${kn(xs, harm).k}/${xs.length} (stale-base harm ${kn(xs, (x) => harm(x) && !x.notMerged).k}, fixed but not merged ${kn(xs, (x) => x.notMerged).k}), checked but did not bring main in ${kn(xs, checkedNoAction).k}/${xs.length}, brought main ${kn(xs, (x) => x.brought).k}/${xs.length}, called investigation skill ${kn(xs, (x) => x.phase1).k}/${xs.length}`);
}
console.log(`harm D1 -> D1A: ${line(kn(sel(/^exp27-weak-/, T5, 'D1'), harm), kn(sel(/^exp27-act-/, T5, 'D1A'), harm))}`);
console.log(`checked-no-action D1 -> D1A: ${line(kn(sel(/^exp27-weak-/, T5, 'D1'), checkedNoAction), kn(sel(/^exp27-act-/, T5, 'D1A'), checkedNoAction))}`);
