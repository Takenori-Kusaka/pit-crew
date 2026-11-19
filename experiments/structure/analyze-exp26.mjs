// EXP-26 analysis, fixed before the results were read (card: docs/experiments/EXP-20261103-26-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2), or if the harm
// predicate disagrees with the final files (t4: the four places; t5w: lib/statement.sh in the
// final tree when it is there; trials without it are listed for a check by hand).
// Usage: node experiments/structure/analyze-exp26.mjs [runsDir]   (default runs/2026-11-03)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BRING_MAIN, broadSearch, commandsOf, pickaxe, reachedHelper, threeDot, twoDot } from './content-metrics.mjs';
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
const dirs = readdirSync(root).filter((d) => /^exp26-/.test(d) && existsSync(join(root, d, 'results.json')));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const transcripts = Object.fromEntries(dirs.flatMap((d) => walk(join(root, d)).filter((f) => norm(f).endsWith('agent/claude-code.txt')).map((f) => [norm(f).split('/').at(-3), f])));
const recsOf = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;
console.log(`conditions: ${[...new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)))].join(' | ')}`);
for (const d of dirs) {
  const mt = JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).maxTurns;
  const want = /^exp26-big/.test(d) ? 24 : null;
  if (mt !== want) console.log(`  WARNING ${d}: maxTurns ${mt}, expected ${want}`);
}
const firstPos = (file, re) => {
  let i = 0;
  for (const l of readFileSync(file, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.type !== 'assistant') continue;
    for (const c of e.message?.content ?? []) {
      if (c.type !== 'tool_use') continue;
      const text = c.name === 'Bash' ? maskHeredocs(String(c.input.command ?? '')) : '';
      const m = text.match(re);
      if (m) return i + m.index / 1e6;
      i++;
    }
  }
  return null;
};
// BRING_MAIN (content-metrics.mjs) does not count `git merge-base ... main`, which only looks at
// the base. The first version did (found after reading the EXP-26 results); it is kept as V1 so
// that both counts are shown.
const BRING = BRING_MAIN;
const BRING_V1 = /\bgit\s+(?:rebase|merge|pull)\b[^\n;|&]*\bmain\b/;
const all = dirs.flatMap((d) => {
  const recs = Object.fromEntries(recsOf(d).map((r) => [r.harborTrial, r]));
  return rowsOf(join(root, d)).map((x) => {
    const f = transcripts[x.trial];
    const cmds = f ? commandsOf(readFileSync(f, 'utf8').split('\n')) : [];
    const bring = f ? firstPos(f, BRING) : null;
    const bringV1 = f ? firstPos(f, BRING_V1) : null;
    const arm = x.arm.match(/dev-structure\/(\w+)@/)?.[1];
    return { ...x, run: d, armName: { MskillG: 'D0', MskillD1: 'D1', MskillD2: 'D2' }[arm] ?? arm, rec: recs[x.trial],
      phase1: x.phases.includes(1), broad: broadSearch(cmds), pick: pickaxe(cmds), helper: reachedHelper(cmds), three: threeDot(cmds), two: twoDot(cmds),
      broughtFirst: bring !== null && (x.order.impl === null || bring < x.order.impl),
      broughtFirstV1: bringV1 !== null && (x.order.impl === null || bringV1 < x.order.impl) };
  });
});
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const harm = (x) => x.outcome === 'task-failed';

// Harm predicate against the final files.
const text = (x, p) => x.rec?.state?.files?.[p]?.text;
const bad = [], byHand = [];
for (const x of valid) {
  if (x.case.startsWith('t4')) {
    const fh = (text(x, 'lib/util/money.sh') ?? '').includes('+ 9) / 10') || ['bin/price', 'bin/quote', 'lib/invoice.sh'].some((p) => (text(x, p) ?? '').includes('+ 99'));
    if (fh !== harm(x)) bad.push(x.trial);
  } else {
    const s = text(x, 'lib/statement.sh');
    if (s === undefined) byHand.push(x.trial); else if (s.includes('+ 99') !== harm(x)) bad.push(x.trial);
  }
}
if (bad.length) { console.log(`STOP: harm predicate disagrees with the final files: ${bad.join(' ')}`); process.exit(2); }
console.log(`harm predicate vs final files: consistent${byHand.length ? `; check by hand (statement not in the final tree): ${byHand.join(' ')}` : ''}`);

const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const line = (A, B) => { const c = cmp(A, B); return `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}`; };
const sel = (cell, arm) => valid.filter((x) => x.case === cell && x.armName === arm);
const T4 = 't4-scatter-big-start', T5 = 't5-stale-base-weak';
const ARMS = ['D0', 'D1', 'D2'];
const tab = (cell, cols) => {
  console.log(`\n## ${cell}`);
  console.log(`| arm | ${cols.map((c) => c[0]).join(' | ')} |`);
  console.log(`|---|${cols.map(() => '---').join('|')}|`);
  for (const a of ARMS) { const xs = sel(cell, a); console.log(`| ${a} | ${cols.map(([, f]) => `${kn(xs, f).k}/${xs.length}`).join(' | ')} |`); }
};
const skip = (x) => x.skippedMemo || x.skippedTest;
tab(T4, [['harm (a place left)', harm], ['called investigation skill', (x) => x.phase1], ['broad search', (x) => x.broad], ['pickaxe', (x) => x.pick], ['reached round_tenth', (x) => x.helper], ['skipped', skip], ['all-followed', (x) => x.outcome === 'all-followed']]);
tab(T5, [['harm', harm], ['called investigation skill', (x) => x.phase1], ['three-dot', (x) => x.three], ['two-dot', (x) => x.two], ['brought main in before impl', (x) => x.broughtFirst], ['(v1, counted merge-base)', (x) => x.broughtFirstV1], ['skipped', skip], ['all-followed', (x) => x.outcome === 'all-followed']]);

const C = [T4, T5].flatMap((cell) => ['D1', 'D2'].map((a) => ({ id: `${cell} D0 -> ${a}`, A: kn(sel(cell, 'D0'), harm), B: kn(sel(cell, a), harm) }))).map((c) => ({ ...c, ...cmp(c.A, c.B) }));
const sorted = [...C].sort((u, v) => u.p - v.p);
let stop = false;
sorted.forEach((c, i) => { c.thr = 0.05 / (C.length - i); c.holm = !stop && c.p < c.thr; if (!c.holm) stop = true; });
console.log('\n## main comparisons (harm, Holm over four)');
for (const c of C) console.log(`${c.id}: ${line(c.A, c.B)}, Holm threshold ${c.thr.toFixed(4)} -> ${c.holm && c.hi < 0 ? 'REDUCES' : c.holm && c.lo > 0 ? 'INCREASES' : 'not shown'}`);

console.log('\n## delivery (did the rules reach the run?)');
for (const cell of [T4, T5]) console.log(`${cell} called investigation skill D0 -> D1: ${line(kn(sel(cell, 'D0'), (x) => x.phase1), kn(sel(cell, 'D1'), (x) => x.phase1))}`);
console.log(`${T4} broad search D0 -> D2: ${line(kn(sel(T4, 'D0'), (x) => x.broad), kn(sel(T4, 'D2'), (x) => x.broad))}`);
console.log(`${T4} reached round_tenth D0 -> D1: ${line(kn(sel(T4, 'D0'), (x) => x.helper), kn(sel(T4, 'D1'), (x) => x.helper))}`);
console.log(`${T4} reached round_tenth D0 -> D2: ${line(kn(sel(T4, 'D0'), (x) => x.helper), kn(sel(T4, 'D2'), (x) => x.helper))}`);
console.log(`${T5} brought main in before impl D0 -> D1: ${line(kn(sel(T5, 'D0'), (x) => x.broughtFirst), kn(sel(T5, 'D1'), (x) => x.broughtFirst))}`);
console.log(`${T5} brought main in before impl D0 -> D2: ${line(kn(sel(T5, 'D0'), (x) => x.broughtFirst), kn(sel(T5, 'D2'), (x) => x.broughtFirst))}`);
for (const cell of [T4, T5]) {
  const xs = valid.filter((x) => x.case === cell);
  const t = [xs.filter((x) => x.phase1 && harm(x)).length, xs.filter((x) => x.phase1 && !harm(x)).length, xs.filter((x) => !x.phase1 && harm(x)).length, xs.filter((x) => !x.phase1 && !harm(x)).length];
  console.log(`${cell} called investigation skill x harm (all arms): called&harm ${t[0]}, called&ok ${t[1]}, not&harm ${t[2]}, not&ok ${t[3]}; Fisher p = ${fisher(...t).toFixed(4)}`);
}
