// EXP-25 analysis, fixed before the results were read (card: docs/experiments/EXP-20261102-25-*).
// Stops if any run fails the measurement check of phase-metrics.mjs (exit 2), or if the harm
// predicate disagrees with the final files (the fourth place / statement still rounds up).
// Usage: node experiments/structure/analyze-exp25.mjs [runsDir]   (default runs/2026-11-02)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { broadSearch, commandsOf, pickaxe, reachedHelper, threeDot, twoDot } from './content-metrics.mjs';
import { maskHeredocs } from './phase-metrics.mjs';

const root = process.argv[2] ?? 'runs/2026-11-02';
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
const dirs = readdirSync(root).filter((d) => /^exp25-/.test(d) && existsSync(join(root, d, 'results.json')));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const transcripts = Object.fromEntries(dirs.flatMap((d) => walk(join(root, d)).filter((f) => norm(f).endsWith('agent/claude-code.txt')).map((f) => [norm(f).split('/').at(-3), f])));
const recsOf = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;
const versions = new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)));
console.log(`conditions: ${[...versions].join(' | ')}`);
for (const d of dirs.filter((x) => /^exp25-big/.test(x))) { const mt = JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).maxTurns; if (mt !== 24) console.log(`  WARNING ${d}: maxTurns ${mt}`); }

// Harm from the final files, to check the predicate (task-failed) against them.
const fileHarm = (rec) => {
  const t = (p) => rec?.state?.files?.[p]?.text ?? '';
  if (rec.case.startsWith('t4')) return t('lib/util/money.sh').includes('+ 9) / 10') || ['bin/price', 'bin/quote', 'lib/invoice.sh'].some((p) => t(p).includes('+ 99'));
  return null; // t5w is graded on main's tree, which the working tree may not show: checked by hand before aggregating (card)
};
// First position (call index) of a command matching re, as in phase-metrics.
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
const BRING = /\bgit\s+(?:rebase|merge|pull)\b[^\n;|&]*\bmain\b/;

const all = dirs.flatMap((d) => {
  const recs = Object.fromEntries(recsOf(d).map((r) => [r.harborTrial, r]));
  return rowsOf(join(root, d)).map((x) => {
    const f = transcripts[x.trial];
    const cmds = f ? commandsOf(readFileSync(f, 'utf8').split('\n')) : [];
    const bring = f ? firstPos(f, BRING) : null;
    return { ...x, run: d, armName: x.arm.match(/dev-structure\/(\w+)@/)?.[1], rec: recs[x.trial], cmds,
      broad: broadSearch(cmds), pick: pickaxe(cmds), helper: reachedHelper(cmds), three: threeDot(cmds), two: twoDot(cmds),
      broughtFirst: bring !== null && (x.order.impl === null || bring < x.order.impl) };
  });
});
const valid = all.filter((x) => !x.missing && x.valid);
console.log(`trials: ${all.length}, missing ${all.filter((x) => x.missing).length}, invalid ${all.filter((x) => !x.missing && !x.valid).length}`);
const harm = (x) => x.outcome === 'task-failed';
const mismatch = valid.filter((x) => x.case.startsWith('t4') && fileHarm(x.rec) !== harm(x));
if (mismatch.length) { console.log(`STOP: harm predicate disagrees with the final files in ${mismatch.length} t4 trial(s): ${mismatch.map((x) => x.trial).join(' ')}`); process.exit(2); }
console.log('harm predicate vs final files (t4): consistent');

const kn = (xs, f) => ({ k: xs.filter(f).length, n: xs.length });
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const cmp = (A, B) => { const pa = A.k / A.n, pb = B.k / B.n, [l1, u1] = wilson(A.k, A.n), [l2, u2] = wilson(B.k, B.n), d = pb - pa; return { d, lo: d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi: d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), p: fisher(A.k, A.n - A.k, B.k, B.n - B.k) }; };
const f2 = (x) => x.toFixed(2);
const line = (A, B) => { const c = cmp(A, B); return `${A.k}/${A.n} vs ${B.k}/${B.n}, diff ${f2(c.d)} (Newcombe ${f2(c.lo)} to ${f2(c.hi)}), Fisher p = ${c.p.toFixed(4)}`; };
const pick = (re, arm) => valid.filter((x) => re.test(x.run) && x.armName === arm);
const skip = (x) => x.skippedMemo || x.skippedTest;

const tab = (title, re, arms, cols) => {
  console.log(`\n## ${title}`);
  console.log(`| arm | ${cols.map((c) => c[0]).join(' | ')} |`);
  console.log(`|---|${cols.map(() => '---').join('|')}|`);
  for (const a of arms) { const xs = pick(re, a); console.log(`| ${a} | ${cols.map(([, f]) => `${kn(xs, f).k}/${xs.length}`).join(' | ')} |`); }
};
tab('(1) t4 big harm cell, max turns 24', /^exp25-big-/, ['MskillG', 'MskillR'], [['missed a place (harm)', harm], ['broad search', (x) => x.broad], ['pickaxe', (x) => x.pick], ['reached round_tenth', (x) => x.helper], ['skipped', skip], ['all-followed', (x) => x.outcome === 'all-followed']]);
tab('(2) t5w stale base, weak cue', /^exp25-weak-/, ['F', 'MskillG', 'MskillR'], [['harm', harm], ['three-dot', (x) => x.three], ['two-dot', (x) => x.two], ['brought main in before impl', (x) => x.broughtFirst], ['skipped', skip], ['all-followed', (x) => x.outcome === 'all-followed']]);

const C = [
  { id: '(1) t4 MskillG -> MskillR (harm)', A: kn(pick(/^exp25-big-/, 'MskillG'), harm), B: kn(pick(/^exp25-big-/, 'MskillR'), harm) },
  { id: '(2) t5w MskillG -> MskillR (harm)', A: kn(pick(/^exp25-weak-/, 'MskillG'), harm), B: kn(pick(/^exp25-weak-/, 'MskillR'), harm) },
].map((c) => ({ ...c, ...cmp(c.A, c.B) }));
const sorted = [...C].sort((u, v) => u.p - v.p);
let stop = false;
sorted.forEach((c, i) => { c.thr = 0.05 / (C.length - i); c.holm = !stop && c.p < c.thr; if (!c.holm) stop = true; });
console.log('\n## main comparisons (Holm over two)');
for (const c of C) console.log(`${c.id}: ${line(c.A, c.B)}, Holm threshold ${c.thr.toFixed(4)} -> ${c.holm && c.hi < 0 ? 'REDUCES' : c.holm && c.lo > 0 ? 'INCREASES' : 'not shown'}`);
console.log('\n## secondary');
console.log(`(1) broad search MskillG -> MskillR: ${line(kn(pick(/^exp25-big-/, 'MskillG'), (x) => x.broad), kn(pick(/^exp25-big-/, 'MskillR'), (x) => x.broad))}`);
console.log(`(1) reached round_tenth MskillG -> MskillR: ${line(kn(pick(/^exp25-big-/, 'MskillG'), (x) => x.helper), kn(pick(/^exp25-big-/, 'MskillR'), (x) => x.helper))}`);
console.log(`(2) two-dot MskillG -> MskillR: ${line(kn(pick(/^exp25-weak-/, 'MskillG'), (x) => x.two), kn(pick(/^exp25-weak-/, 'MskillR'), (x) => x.two))}`);
console.log(`(2) structure recheck, harm F -> MskillG: ${line(kn(pick(/^exp25-weak-/, 'F'), harm), kn(pick(/^exp25-weak-/, 'MskillG'), harm))}`);
console.log(`(2) structure recheck, skipped F -> MskillG: ${line(kn(pick(/^exp25-weak-/, 'F'), skip), kn(pick(/^exp25-weak-/, 'MskillG'), skip))}`);
const big = valid.filter((x) => /^exp25-big-/.test(x.run));
const t = [big.filter((x) => !x.helper && harm(x)).length, big.filter((x) => !x.helper && !harm(x)).length, big.filter((x) => x.helper && harm(x)).length, big.filter((x) => x.helper && !harm(x)).length];
console.log(`(1) reached helper x harm: not reached & harm ${t[0]}, not reached & fixed ${t[1]}, reached & harm ${t[2]}, reached & fixed ${t[3]}; Fisher p = ${fisher(...t).toFixed(4)}`);
