// EXP-24 analysis, fixed before the results were read (card: docs/experiments/EXP-20261102-24-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2).
// Type-specific order measures (the "check first" step of each incident type), from transcripts:
//   t5 baseCheck  first Bash command that looks at main before the first implementation edit
//                 (git log/diff/show/merge/rebase/checkout/switch/rev-parse naming main)
//   t6 claimCheck first command that reads or runs lib/invoice.sh before the first implementation edit
// Usage: node experiments/structure/analyze-exp24.mjs [runsDir]   (default runs/2026-11-02)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { maskHeredocs } from './phase-metrics.mjs';

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
const dirs = readdirSync(root).filter((d) => (/^exp24-/.test(d) || /^exp22-main-Fa-r/.test(d)) && existsSync(join(root, d, 'results.json')));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const transcripts = Object.fromEntries(dirs.flatMap((d) => walk(join(root, d)).filter((f) => f.replaceAll('\\', '/').endsWith('agent/claude-code.txt')).map((f) => [f.replaceAll('\\', '/').split('/').at(-3), f])));

const versions = new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)));
const ref = Object.fromEntries(recsOf('exp20-main').map((r) => [r.case, `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`]));
const mism = dirs.flatMap((d) => recsOf(d).filter((r) => ref[r.case] && ref[r.case] !== `${r.caseDigest} ${r.claudeVersion} ${r.agentImage?.id}`).map((r) => `${d} ${r.case}`));
console.log(`conditions: ${[...versions].join(' | ')}; shared cases same as EXP-20: ${mism.length ? 'NO' : 'yes'}`);

// Position of the first command matching `re` (Bash, or Read of a matching path), same scheme as phase-metrics.
function firstPos(file, re) {
  let i = 0;
  for (const l of readFileSync(file, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.type !== 'assistant') continue;
    for (const c of e.message?.content ?? []) {
      if (c.type !== 'tool_use') continue;
      const text = c.name === 'Bash' ? maskHeredocs(String(c.input.command ?? '')) : String(c.input.file_path ?? c.input.pattern ?? '');
      const m = text.match(re);
      if (m) return i + m.index / 1e6;
      i++;
    }
  }
  return null;
}
const BASE = /\bgit\s+(?:log|diff|show|merge|rebase|checkout|switch|rev-parse|merge-base|branch)\b[^\n;|&]*\bmain\b/;
const CLAIM = /lib\/invoice\.sh/;

const all = dirs.flatMap((d) => {
  const recs = Object.fromEntries(recsOf(d).map((r) => [r.harborTrial, r]));
  return rowsOf(join(root, d)).map((x) => {
    const f = transcripts[x.trial];
    const impl = x.order.impl;
    const pos = (re) => (f ? firstPos(f, re) : null);
    const before = (p) => p !== null && (impl === null || p < impl);
    return { ...x, run: d, armName: x.arm.match(/dev-structure\/(\w+)@/)?.[1], rec: recs[x.trial], baseFirst: before(pos(BASE)), claimFirst: before(pos(CLAIM)) };
  });
});
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const line = (A, B, c) => `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}`;
const harm = (x) => x.outcome === 'task-failed';
const skip = (x) => x.skippedMemo || x.skippedTest;

const cells = { 't5-stale-base-start': 'baseFirst', 't6-false-memo-midway': 'claimFirst' };
const C = [];
for (const [cell, checkKey] of Object.entries(cells)) {
  console.log(`\n## ${cell}`);
  console.log('| arm | harm (task-failed) | checked first | skipped (memo/test) | all-followed | outcomes |');
  console.log('|---|---|---|---|---|---|');
  const by = Object.fromEntries(['F', 'Fa', 'MskillG'].map((a) => [a, valid.filter((x) => /^exp24-types-/.test(x.run) && x.armName === a && x.case === cell)]));
  for (const [a, xs] of Object.entries(by)) console.log(`| ${a} | ${kn(xs, harm).k}/${xs.length} | ${kn(xs, (x) => x[checkKey]).k}/${xs.length} | ${kn(xs, skip).k}/${xs.length} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} | ${JSON.stringify(xs.reduce((m, x) => ({ ...m, [x.outcome]: (m[x.outcome] ?? 0) + 1 }), {}))} |`);
  for (const a of ['Fa', 'MskillG']) C.push({ cell, a, A: kn(by.F, harm), B: kn(by[a], harm), ...cmp(kn(by.F, harm), kn(by[a], harm)) });
  for (const a of ['Fa', 'MskillG']) console.log(`checked first (secondary) F -> ${a}: ${line(kn(by.F, (x) => x[checkKey]), kn(by[a], (x) => x[checkKey]), cmp(kn(by.F, (x) => x[checkKey]), kn(by[a], (x) => x[checkKey])))}`);
  const xs = Object.values(by).flat();
  const t = [xs.filter((x) => !x[checkKey] && harm(x)).length, xs.filter((x) => !x[checkKey] && !harm(x)).length, xs.filter((x) => x[checkKey] && harm(x)).length, xs.filter((x) => x[checkKey] && !harm(x)).length];
  console.log(`not checked first & harm ${t[0]}, not checked & no harm ${t[1]}, checked & harm ${t[2]}, checked & no harm ${t[3]}; Fisher p = ${fisher(...t).toFixed(4)}`);
  const s = [xs.filter((x) => skip(x) && harm(x)).length, xs.filter((x) => skip(x) && !harm(x)).length, xs.filter((x) => !skip(x) && harm(x)).length, xs.filter((x) => !skip(x) && !harm(x)).length];
  console.log(`skipped & harm ${s[0]}, skipped & no harm ${s[1]}, followed & harm ${s[2]}, followed & no harm ${s[3]}; Fisher p = ${fisher(...s).toFixed(4)}`);
}
console.log('\n## main comparisons (harm, F -> arm, Holm over four)');
const sorted = [...C].sort((u, v) => u.p - v.p);
let stop = false;
sorted.forEach((c, i) => { c.thr = 0.05 / (C.length - i); c.holm = !stop && c.p < c.thr; if (!c.holm) stop = true; });
for (const c of C) console.log(`${c.cell} F -> ${c.a}: ${line(c.A, c.B, c)}, Holm threshold ${c.thr.toFixed(4)} -> ${c.holm && c.hi < 0 ? 'REDUCES harm' : c.holm && c.lo > 0 ? 'INCREASES harm' : 'not shown'}`);

console.log('\n## midway (t1-parallel-midway, exploratory)');
// Fa / Fa1 / Fa2 are single-file arms: reading a phase's procedure is not a separate tool call,
// so "read earlier phase material" cannot be observed. Measured instead: rewriting an earlier
// phase's artifact before the first edit (redo), tool calls before the first implementation edit,
// and whether the state file appears in the transcript.
console.log('| arm | rewrote memo/test before impl | tool calls before first impl (mean) | all-followed | .dev-state.md appears |');
console.log('|---|---|---|---|---|');
for (const a of ['Fa', 'Fa1', 'Fa2']) {
  const xs = valid.filter((x) => /^exp24-midway-/.test(x.run) && x.armName === a && x.case === 't1-parallel-midway');
  const used = xs.filter((x) => JSON.stringify(x.rec?.trajectory?.steps ?? []).includes('dev-state')).length;
  const pre = xs.filter((x) => x.order.impl !== null).map((x) => Math.floor(x.order.impl));
  console.log(`| ${a} | ${kn(xs, (x) => x.redo).k}/${xs.length} | ${pre.length ? (pre.reduce((s, v) => s + v, 0) / pre.length).toFixed(1) : '-'} | ${kn(xs, (x) => x.outcome === 'all-followed').k}/${xs.length} | ${used}/${xs.length} |`);
}
