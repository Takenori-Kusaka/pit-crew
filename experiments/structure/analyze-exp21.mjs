// EXP-21 analysis, fixed before the results were read (card: docs/experiments/EXP-20261102-21-*).
// Pools the per-trial rows of phase-metrics.mjs over the run dirs of each arm, checks that
// every run used the same cases, Claude Code version and agent image as EXP-20, and prints
// the four main comparisons (Holm-adjusted) and the exploratory tables.
// Usage: node experiments/structure/analyze-exp21.mjs [runsDir]   (default runs/2026-11-02)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'runs/2026-11-02';
const rowsOf = (dir) => execFileSync(process.execPath, ['experiments/structure/phase-metrics.mjs', dir, '', '--rows'], { encoding: 'utf8' })
  .split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
const dirs = readdirSync(root).filter((d) => /^exp21-/.test(d) && existsSync(join(root, d, 'results.json')));

// Same conditions as EXP-20.
const ref = JSON.parse(readFileSync(join(root, 'exp20-main', 'results.json'), 'utf8')).records;
const key = (r) => `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`;
const refKeys = Object.fromEntries(ref.map((r) => [r.case, key(r)]));
const mismatch = [];
for (const d of dirs) for (const r of JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records) {
  if (refKeys[r.case] && refKeys[r.case] !== key(r)) mismatch.push(`${d} ${r.case}: ${key(r)} vs ${refKeys[r.case]}`);
}
const versions = new Set(dirs.flatMap((d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records.map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)));
console.log(`conditions: ${versions.size === 1 ? 'one version' : 'SEVERAL versions'} ${[...versions].join(' | ')}; same as EXP-20 for shared cases: ${mismatch.length ? 'NO' : 'yes'}`);
for (const m of mismatch.slice(0, 5)) console.log('  mismatch', m);

const all = dirs.flatMap((d) => rowsOf(join(root, d)).map((x) => ({ ...x, run: d, armName: x.arm.match(/dev-structure\/(\w+)@/)?.[1] })));
const missing = all.filter((x) => x.missing).length;
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, transcript missing ${missing}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);

const pick = (prefix, arm, cases) => valid.filter((x) => x.run.startsWith(prefix) && x.armName === arm && cases.includes(x.case));
const skip = (x) => x.skippedMemo || x.skippedTest;
const START = ['t1-parallel-start', 't2-rename-start'];
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => {
  const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa;
  return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) };
};
const f = (x) => x.toFixed(2);
const avg = (xs, g) => (xs.length ? Math.round(xs.reduce((s, x) => s + g(x), 0) / xs.length) : '-');

console.log('\n## Sonnet, start cases (both cases pooled; per case in brackets)');
console.log('| arm | skipped | t1 | t2 | all-followed | peak avg | phase reads | suspect |');
console.log('|---|---|---|---|---|---|---|---|');
const sk = {};
for (const a of ['F', 'M', 'Mall', 'H', 'Mskill']) {
  const xs = pick('exp21-main-', a, START);
  sk[a] = { k: xs.filter(skip).length, n: xs.length };
  const t = (c) => { const ys = xs.filter((x) => x.case === c); return `${ys.filter(skip).length}/${ys.length}`; };
  console.log(`| ${a} | ${sk[a].k}/${sk[a].n} | ${t(START[0])} | ${t(START[1])} | ${xs.filter((x) => x.outcome === 'all-followed').length}/${xs.length} | ${avg(xs, (x) => x.peak)} | ${xs.reduce((s, x) => s + x.phases.length, 0)} | ${xs.filter((x) => x.validity === 'suspect').length} |`);
}

console.log('\n## Main comparisons (difference = second - first; Holm over the four)');
const C = [['a', 'F', 'Mall'], ['b', 'M', 'Mall'], ['c', 'M', 'H'], ['d', 'M', 'Mskill']].map(([id, x, y]) => ({ id, x, y, ...cmp(sk[x], sk[y]) }));
const order = [...C].sort((u, v) => u.p - v.p);
let stop = false;
order.forEach((c, i) => { const thr = 0.05 / (C.length - i); c.thr = thr; c.holm = !stop && c.p < thr; if (!c.holm) stop = true; });
for (const c of C) console.log(`${c.id} ${c.x} -> ${c.y}: ${sk[c.x].k}/${sk[c.x].n} vs ${sk[c.y].k}/${sk[c.y].n}, diff ${f(c.d)} (Newcombe ${f(c.lo)} to ${f(c.hi)}), Fisher p = ${c.p.toFixed(4)}, Holm threshold ${c.thr.toFixed(4)} -> ${c.holm && (c.lo > 0 || c.hi < 0) ? 'DIFFERENT' : 'not shown'}`);

console.log('\n## Exploratory: entries (Sonnet, 5 each)');
console.log('| arm | midway: wrong-phase trials | midway: redo | midway: all-followed | rush: skipped | rush: all-followed |');
console.log('|---|---|---|---|---|---|');
for (const a of ['M', 'F', 'H']) {
  const m = pick('exp21-entry-', a, ['t1-parallel-midway']), r = pick('exp21-entry-', a, ['t1-parallel-rush']);
  console.log(`| ${a} | ${a === 'F' ? 'n/a' : `${m.filter((x) => x.wrong > 0).length}/${m.length}`} | ${m.filter((x) => x.redo).length}/${m.length} | ${m.filter((x) => x.outcome === 'all-followed').length}/${m.length} | ${r.filter(skip).length}/${r.length} | ${r.filter((x) => x.outcome === 'all-followed').length}/${r.length} |`);
}

console.log('\n## Exploratory: Haiku, M vs Mskill (5 each per case)');
for (const a of ['M', 'Mskill']) {
  const xs = pick('exp21-haiku-', a, START);
  console.log(`${a}: skipped ${xs.filter(skip).length}/${xs.length}, all-followed ${xs.filter((x) => x.outcome === 'all-followed').length}/${xs.length}, task solved ${xs.filter((x) => x.outcome !== 'task-failed').length}/${xs.length}, phase reads ${xs.reduce((s, x) => s + x.phases.length, 0)}, peak avg ${avg(xs, (x) => x.peak)}`);
}
