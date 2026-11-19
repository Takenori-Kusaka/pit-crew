// Both-way validation of the third-edition reader measure (design 23 §13.2) by construction, on the
// BALANCED synthetic decisions (synthetic-decisions-balanced.mjs; the first run on the lopsided
// structures failed because the reader picks from option wording alone, log 11-06 00:3x).
// For every case and every option taken as "adopted" in turn:
//   T1 = the adopted option's wording (3 phrasings) — conclusion only;   expected S≈0 and no leak (k=0)
//   T2 = its decisive observation (names no option)                     expected S>0 (≥0.3 for 2 options, ≥0.2 for 3)
//   T3 = T1 + T2                                                        expected S≈T2 (naming adds nothing after masking)
//   T4 = control = the masked TASK statement (same task, no reasons)    expected P_x ≈ P_0 (|L2| ≤ 0.15)
//   T5 = a rejected option's decisive observation                       expected S<0
// S is reported both as a probability difference and as a logit difference (less compressed near 0/1).
// Jev is the reader; all texts masked. Network only; cost printed; key never printed.
// Usage: node experiments/judge/validate-reader-v3.mjs [--k=4] [--tau=0.15]
import { writeFileSync } from 'node:fs';
import { maskOptions, maskedResidue, MASK } from '../../packages/pit-wall/src/graders/process/judge/mask.mjs';
import { apiKey, jevPickRate } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import { BALANCED } from './synthetic-decisions-balanced.mjs';

if (!apiKey()) { console.error('no key'); process.exit(2); }
const args = process.argv.slice(2);
const K = Number(args.find((a) => a.startsWith('--k='))?.slice(4) ?? 4);
const TAU = Number(args.find((a) => a.startsWith('--tau='))?.slice(6) ?? 0.15);
const ja = (s) => /[぀-ヿ㐀-鿿]/.test(s);
const logit = (p) => Math.log(Math.min(0.995, Math.max(0.005, p)) / (1 - Math.min(0.995, Math.max(0.005, p))));

let tokens = 0, errors = 0;
const rows = [];
for (const c of BALANCED) {
  const options = c.options.map((o) => ({ text: o.text }));
  const m = options.length;
  for (let a = 0; a < m; a++) {
    const A = c.options[a], J = ja(A.text);
    const T1 = J ? [`${A.text}。`, `${A.text}ことにする。`, `判断: ${A.text}。`] : [`${A.text}.`, `I will ${A.text}.`, `Decision: ${A.text}.`];
    const T2 = A.obs;
    const T3 = J ? `${A.text}。${A.obs}` : `${A.text}. ${A.obs}`;
    const R = c.options[(a + 1) % m];
    const T5 = R.obs;
    const rate = async (text) => { const r = await jevPickRate(options, a, text == null ? null : maskOptions(text, options), { k: K }); tokens += r.inputTokens; errors += r.errors; return r.rate; };
    // P_0 = a content-free MASKED stub, not "no reasoning": with no reasoning the reader keeps its
    // wording prior (e.g. 0.23), with any masked text it drifts toward uniform — the two are not the
    // same footing, and the difference looked like a leak (run 2, 4/12 false k=1). P_none kept for reference.
    const P_none = await rate(null);
    const P_0 = await rate(`${MASK}.`), P_x = await rate(c.task);
    const P_T1 = []; for (const t of T1) P_T1.push(await rate(t));
    const P_T2 = await rate(T2), P_T3 = await rate(T3), P_T5 = await rate(T5);
    const row = { id: c.id, adopted: a, m, P_none, P_0, P_x, P_T1, P_T2, P_T3, P_T5,
      residueT1: T1.map((t) => +maskedResidue(maskOptions(t, options), t).toFixed(2)), residueT2: +maskedResidue(maskOptions(T2, options), T2).toFixed(2),
      S_T2: P_T2 - P_x, S_T3: P_T3 - P_x, S_T5: P_T5 - P_x, S_T2_logit: logit(P_T2) - logit(P_x), S_T5_logit: logit(P_T5) - logit(P_x), L1: P_T1.map((p) => p - P_0), L2: P_x - P_0 };
    // T4 (control ≈ prior) is NOT a pass criterion: a task statement may legitimately imply a
    // direction (L2 is reported, and S subtracts it). A point whose control already sits at the
    // ceiling (P_x ≥ 0.85) cannot show T2 and is excluded from that check (reported as ceiling).
    row.ceiling = P_x >= 0.85;
    row.checks = {
      T1_noLeak: row.L1.every((l) => l <= TAU),
      T2_positive: row.ceiling ? null : row.S_T2 >= (m === 2 ? 0.3 : 0.2),
      T3_notAboveT2: row.S_T3 <= row.S_T2 + 0.1,
      T5_negative: row.S_T5 < 0,
    };
    rows.push(row);
    console.log(`${c.id}#${a} (m=${m}): P_none ${P_none.toFixed(2)} P_0 ${P_0.toFixed(2)} P_x ${P_x.toFixed(2)}${row.ceiling ? ' (ceiling)' : ''} | T1 ${P_T1.map((p) => p.toFixed(2)).join('/')} | T2 ${P_T2.toFixed(2)} T3 ${P_T3.toFixed(2)} T5 ${P_T5.toFixed(2)} | S_T2 ${row.S_T2.toFixed(2)} (logit ${row.S_T2_logit.toFixed(1)}) S_T5 ${row.S_T5.toFixed(2)} L2 ${row.L2.toFixed(2)} | ${Object.entries(row.checks).map(([k, v]) => `${k}:${v == null ? 'n/a' : v ? 'ok' : 'FAIL'}`).join(' ')}`);
  }
}
const summary = {};
for (const ck of Object.keys(rows[0].checks)) { const app = rows.filter((r) => r.checks[ck] != null); summary[ck] = `${app.filter((r) => r.checks[ck]).length}/${app.length}`; }
summary.allChecks = `${rows.filter((r) => Object.values(r.checks).every((v) => v !== false)).length}/${rows.length}`;
summary.ceilingPoints = rows.filter((r) => r.ceiling).length;
summary.P_0_vsChance_meanAbs = +(rows.reduce((s, r) => s + Math.abs(r.P_0 - 1 / r.m), 0) / rows.length).toFixed(3);
summary.k = K; summary.tau = TAU; summary.jevInputTokens = tokens; summary.errors = errors; summary.costUSD = +(tokens / 1e6 * 0.042).toFixed(4);
console.log(JSON.stringify(summary));
writeFileSync(`experiments/judge/validate-reader-v3-balanced-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ summary, rows }, null, 2));
