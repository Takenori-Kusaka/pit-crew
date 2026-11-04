// Compare "all conventions followed" rates between two conditions.
// Wilson 95% interval per condition, Newcombe (hybrid score) 95% interval for the
// difference, and a two-sided Fisher exact test.
// Usage: node experiments/compare.mjs <results-A.json[+more.json]> <caseA> <results-B.json[+more.json]> <caseB> [outcome]
import { readFileSync } from 'node:fs';

const [fa, ca, fb, cb, want = 'all-followed'] = process.argv.slice(2);
// A side may pool several result files: "a/results.json+b/results.json".
const count = (f, c) => {
  const recs = f.split('+').flatMap((x) => JSON.parse(readFileSync(x, 'utf8')).records).filter((r) => r.case === c && r.validity?.status !== 'invalid');
  return { k: recs.filter((r) => r.outcome === want).length, n: recs.length };
};
const z = 1.959964;
const wilson = (k, n) => {
  if (!n) return [NaN, NaN];
  const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
};
const newcombe = (a, b) => {
  const p1 = a.k / a.n, p2 = b.k / b.n, [l1, u1] = wilson(a.k, a.n), [l2, u2] = wilson(b.k, b.n);
  const d = p2 - p1;
  return [d - Math.sqrt((p2 - l2) ** 2 + (u1 - p1) ** 2), d + Math.sqrt((u2 - p2) ** 2 + (p1 - l1) ** 2)];
};
const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => {
  const n = a + b + c + d, r1 = a + b, c1 = a + c;
  const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k));
  const p0 = p(a);
  let s = 0;
  for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k);
  return Math.min(1, s);
};
const A = count(fa, ca), B = count(fb, cb);
const f2 = (x) => (Number.isNaN(x) ? '-' : x.toFixed(2));
const [la, ua] = wilson(A.k, A.n), [lb, ub] = wilson(B.k, B.n), [ld, ud] = newcombe(A, B);
console.log(`${ca}: ${A.k}/${A.n} (95% ${f2(la)}-${f2(ua)})`);
console.log(`${cb}: ${B.k}/${B.n} (95% ${f2(lb)}-${f2(ub)})`);
console.log(`difference (B - A): ${f2(B.k / B.n - A.k / A.n)} (Newcombe 95% ${f2(ld)} to ${f2(ud)}); Fisher two-sided p = ${fisher(A.k, A.n - A.k, B.k, B.n - B.k).toFixed(4)}`);
