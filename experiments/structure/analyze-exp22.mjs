// EXP-22 analysis, fixed before the results were read (card: docs/experiments/EXP-20261102-22-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2).
// Usage: node experiments/structure/analyze-exp22.mjs [runsDir]   (default runs/2026-11-02)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'runs/2026-11-02';
const rowsOf = (dir) => {
  try {
    return execFileSync(process.execPath, ['experiments/structure/phase-metrics.mjs', dir, '', '--rows'], { encoding: 'utf8' })
      .split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  } catch (e) {
    console.log(`STOP: ${dir} failed the measurement check\n${e.stdout}`);
    process.exit(2);
  }
};
const dirs = readdirSync(root).filter((d) => (/^exp22-/.test(d) || /^exp21-main-F-r/.test(d)) && existsSync(join(root, d, 'results.json')));
const recs = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;

// Same conditions as EXP-20/21 for the shared cases.
const ref = Object.fromEntries(recs('exp20-main').map((r) => [r.case, `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`]));
const mism = dirs.flatMap((d) => recs(d).filter((r) => ref[r.case] && ref[r.case] !== `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`).map((r) => `${d} ${r.case}`));
const versions = new Set(dirs.flatMap((d) => recs(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)));
console.log(`conditions: ${[...versions].join(' | ')}; shared cases same as EXP-20: ${mism.length ? `NO (${mism.slice(0, 3).join(', ')})` : 'yes'}`);

const all = dirs.flatMap((d) => rowsOf(join(root, d)).map((x) => ({ ...x, run: d, armName: x.arm.match(/dev-structure\/(\w+)@/)?.[1] })));
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const skip = (x) => x.skippedMemo || x.skippedTest;
const pick = (re, arm, cases) => valid.filter((x) => re.test(x.run) && x.armName === arm && cases.includes(x.case));
const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const show = (A, B) => { const c = cmp(A, B); return `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}`; };
const avg = (xs, g) => (xs.length ? Math.round(xs.reduce((s, x) => s + g(x), 0) / xs.length) : '-');
const ST = ['t1-parallel-start', 't2-rename-start'];

console.log('\n## (1) elements, Sonnet, t1+t2');
console.log('| arm | skipped | t1 | t2 | all-followed | peak avg |');
console.log('|---|---|---|---|---|---|');
const rows = { F: pick(/^exp21-main-F-r/, 'F', ST), Fdrift: pick(/^exp22-drift-F/, 'F', ST) };
for (const a of ['Fa', 'Fb', 'Fc', 'Fd', 'MskillG']) rows[a] = pick(/^exp22-main-/, a, ST);
for (const [a, xs] of Object.entries(rows)) {
  const t = (c) => { const ys = xs.filter((x) => x.case === c); return `${ys.filter(skip).length}/${ys.length}`; };
  console.log(`| ${a} | ${kn(xs, skip).k}/${xs.length} | ${t(ST[0])} | ${t(ST[1])} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} | ${avg(xs, (x) => x.peak)} |`);
}
const C = ['Fa', 'Fb', 'Fc', 'Fd'].map((a) => ({ a, ...cmp(kn(rows.F, skip), kn(rows[a], skip)) }));
const sorted = [...C].sort((u, v) => u.p - v.p);
let stop = false;
sorted.forEach((c, i) => { c.thr = 0.05 / (C.length - i); c.holm = !stop && c.p < c.thr; if (!c.holm) stop = true; });
console.log('\nmain comparisons, F (EXP-21) -> arm, Holm over four:');
for (const c of C) console.log(`  F -> ${c.a}: ${show(kn(rows.F, skip), kn(rows[c.a], skip))}, Holm threshold ${c.thr.toFixed(4)} -> ${c.holm && c.hi < 0 ? 'REDUCES alone' : 'not shown'}`);
console.log(`drift: F EXP-21 vs F EXP-22: ${show(kn(rows.F, skip), kn(rows.Fdrift, skip))}`);

console.log('\n## (2) harm cell t3-scatter-start');
const H = { F: pick(/^exp22-harm-/, 'F', ['t3-scatter-start']), MskillG: pick(/^exp22-harm-/, 'MskillG', ['t3-scatter-start']) };
const miss = (x) => x.outcome === 'task-failed';
for (const [a, xs] of Object.entries(H)) console.log(`${a}: skipped ${kn(xs, skip).k}/${xs.length}, task-failed (a place left) ${kn(xs, miss).k}/${xs.length}, all-followed ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length}, outcomes ${JSON.stringify(xs.reduce((m, x) => ({ ...m, [x.outcome]: (m[x.outcome] ?? 0) + 1 }), {}))}`);
console.log(`task-failed F -> MskillG: ${show(kn(H.F, miss), kn(H.MskillG, miss))}`);
console.log(`skipped F -> MskillG: ${show(kn(H.F, skip), kn(H.MskillG, skip))}`);
const both = [...H.F, ...H.MskillG];
const a = both.filter((x) => skip(x) && miss(x)).length, b = both.filter((x) => skip(x) && !miss(x)).length, c = both.filter((x) => !skip(x) && miss(x)).length, d = both.filter((x) => !skip(x) && !miss(x)).length;
console.log(`skip x miss (both arms): skipped&missed ${a}, skipped&fixed ${b}, followed&missed ${c}, followed&fixed ${d}; Fisher p = ${fisher(a, b, c, d).toFixed(4)}`);

console.log('\n## (3) state file, MskillG t2 (exploratory)');
const g2 = rows.MskillG.filter((x) => x.case === 't2-rename-start');
const recG = dirs.filter((d) => /^exp22-main-MskillG/.test(d)).flatMap(recs).filter((r) => r.case === 't2-rename-start');
const denied = recG.filter((r) => (r.validity?.faults ?? []).some((f) => f.kind === 'harness-denied')).length;
const gitWrites = recG.filter((r) => (r.trajectory?.steps ?? []).flatMap((s) => s.tool_calls ?? []).some((t) => /\.git\/(info|config|hooks)/.test(JSON.stringify(t.arguments ?? {})))).length;
const noCommit = recG.filter((r) => !(r.results ?? []).some((x) => x.name === 'commit' && x.passed)).length;
console.log(`MskillG t2: n=${g2.length}, harness-denied ${denied}, tried to write .git/ ${gitWrites}, no commit ${noCommit} (EXP-21 M+Mall t2: 2/20 denied with no commit)`);
