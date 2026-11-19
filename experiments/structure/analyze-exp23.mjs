// EXP-23 analysis, fixed before the results were read (card: docs/experiments/EXP-20261102-23-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2).
// Usage: node experiments/structure/analyze-exp23.mjs [runsDir]   (default runs/2026-11-02)
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
const recsOf = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;
const dirs = readdirSync(root).filter((d) => (/^exp23-/.test(d) || /^exp21-main-F-r/.test(d) || /^exp22-main-Fa-r/.test(d)) && existsSync(join(root, d, 'results.json')));

const ref = Object.fromEntries(recsOf('exp20-main').map((r) => [r.case, `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`]));
const mism = dirs.flatMap((d) => recsOf(d).filter((r) => ref[r.case] && ref[r.case] !== `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`).map((r) => `${d} ${r.case}`));
const versions = new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)));
console.log(`conditions: ${[...versions].join(' | ')}; t1/t2 same as EXP-20: ${mism.length ? `NO (${mism.slice(0, 3).join(', ')})` : 'yes'}`);
for (const d of dirs.filter((x) => /^exp23-big/.test(x))) {
  const mt = JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).maxTurns;
  if (mt !== 24) console.log(`  WARNING ${d}: maxTurns ${mt}`);
}

// Per-trial final state of the four places (big cell).
const places = (state) => {
  const t = (p) => state?.files?.[p]?.text ?? '';
  return {
    three: ['bin/price', 'bin/quote', 'lib/invoice.sh'].every((p) => t(p) && !t(p).includes('+ 99')),
    fourth: !!t('lib/util/money.sh') && !t('lib/util/money.sh').includes('+ 9) / 10'),
  };
};
const all = dirs.flatMap((d) => {
  const recs = Object.fromEntries(recsOf(d).map((r) => [r.harborTrial, r]));
  return rowsOf(join(root, d)).map((x) => ({ ...x, run: d, armName: x.arm.match(/dev-structure\/(\w+)@/)?.[1], rec: recs[x.trial] }));
});
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const skip = (x) => x.skippedMemo || x.skippedTest;
const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const holm = (C) => { const s = [...C].sort((u, v) => u.p - v.p); let stop = false; s.forEach((c, i) => { c.thr = 0.05 / (C.length - i); c.holm = !stop && c.p < c.thr; if (!c.holm) stop = true; }); return C; };
const line = (c, A, B) => `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}, Holm threshold ${c.thr?.toFixed(4) ?? '-'}`;
const avg = (xs, g) => (xs.length ? Math.round(xs.reduce((s, x) => s + g(x), 0) / xs.length) : '-');

console.log('\n## Family A: big harm cell t4-scatter-big-start (max turns 24)');
const big = Object.fromEntries(['F', 'Fa', 'MskillG'].map((a) => [a, valid.filter((x) => /^exp23-big-/.test(x.run) && x.armName === a)]));
const miss = (x) => x.outcome === 'task-failed';
console.log('| arm | missed a place | three fixed, fourth left | none fixed | skipped | turn-limit | all-followed | peak avg |');
console.log('|---|---|---|---|---|---|---|---|');
for (const [a, xs] of Object.entries(big)) {
  const pl = xs.map((x) => places(x.rec?.state));
  const tl = xs.filter((x) => (x.rec?.validity?.faults ?? []).some((f) => f.kind === 'turn-limit')).length;
  console.log(`| ${a} | ${kn(xs, miss).k}/${xs.length} | ${pl.filter((p) => p.three && !p.fourth).length} | ${pl.filter((p) => !p.three && !p.fourth).length} | ${kn(xs, skip).k}/${xs.length} | ${tl} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} | ${avg(xs, (x) => x.peak)} |`);
}
const CA = holm(['Fa', 'MskillG'].map((a) => ({ a, ...cmp(kn(big.F, miss), kn(big[a], miss)) })));
for (const c of CA) console.log(`missed: F -> ${c.a}: ${line(c, kn(big.F, miss), kn(big[c.a], miss))} -> ${c.holm && c.hi < 0 ? 'REDUCES' : 'not shown'}`);
for (const a of ['Fa', 'MskillG']) { const c = cmp(kn(big.F, skip), kn(big[a], skip)); console.log(`skipped (secondary): F -> ${a}: ${line(c, kn(big.F, skip), kn(big[a], skip))}`); }
const ab = Object.values(big).flat();
const t = [ab.filter((x) => skip(x) && miss(x)).length, ab.filter((x) => skip(x) && !miss(x)).length, ab.filter((x) => !skip(x) && miss(x)).length, ab.filter((x) => !skip(x) && !miss(x)).length];
console.log(`skip x missed (3 arms): skipped&missed ${t[0]}, skipped&fixed ${t[1]}, followed&missed ${t[2]}, followed&fixed ${t[3]}; Fisher p = ${fisher(...t).toFixed(4)}`);

console.log('\n## Family B: element a split (t1+t2, max turns 12)');
const ST = ['t1-parallel-start', 't2-rename-start'];
const B = { F: valid.filter((x) => /^exp21-main-F-r/.test(x.run) && ST.includes(x.case)), Fa: valid.filter((x) => /^exp22-main-Fa-r/.test(x.run) && ST.includes(x.case)) };
for (const a of ['Fa1', 'Fa2']) B[a] = valid.filter((x) => /^exp23-split-/.test(x.run) && x.armName === a && ST.includes(x.case));
const usedState = (x) => JSON.stringify(x.rec?.trajectory?.steps ?? []).includes('dev-state');
console.log('| arm | skipped | t1 | t2 | all-followed | used .dev-state.md |');
console.log('|---|---|---|---|---|---|');
for (const [a, xs] of Object.entries(B)) {
  const per = (c) => { const ys = xs.filter((x) => x.case === c); return `${ys.filter(skip).length}/${ys.length}`; };
  console.log(`| ${a} | ${kn(xs, skip).k}/${xs.length} | ${per(ST[0])} | ${per(ST[1])} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} | ${xs.filter(usedState).length}/${xs.length} |`);
}
const CB = holm(['Fa1', 'Fa2'].map((a) => ({ a, ...cmp(kn(B.F, skip), kn(B[a], skip)) })));
for (const c of CB) console.log(`F -> ${c.a}: ${line(c, kn(B.F, skip), kn(B[c.a], skip))} -> ${c.holm && c.hi < 0 ? 'REDUCES alone' : 'not shown'}`);
for (const a of ['Fa1', 'Fa2']) { const c = cmp(kn(B.Fa, skip), kn(B[a], skip)); console.log(`secondary: Fa -> ${a}: ${line(c, kn(B.Fa, skip), kn(B[a], skip))}`); }
