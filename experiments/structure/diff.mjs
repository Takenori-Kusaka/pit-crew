// Difference of two rates given as counts (the structure metrics come from phase-metrics.mjs,
// not from outcomes, so experiments/compare.mjs does not apply). Same formulas as compare.mjs:
// Wilson 95% per side, Newcombe hybrid score 95% for B - A, Fisher exact two-sided.
// Usage: node experiments/structure/diff.mjs <kA> <nA> <kB> <nB> [labelA] [labelB]
const [kA, nA, kB, nB] = process.argv.slice(2, 6).map(Number);
const [la = 'A', lb = 'B'] = process.argv.slice(6);
const z = 1.959964;
const wilson = (k, n) => {
  const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
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
const pa = kA / nA, pb = kB / nB, [l1, u1] = wilson(kA, nA), [l2, u2] = wilson(kB, nB), d = pb - pa;
const lo = d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2), hi = d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2);
const f = (x) => x.toFixed(2);
console.log(`${la}: ${kA}/${nA} (95% ${f(l1)}-${f(u1)})  ${lb}: ${kB}/${nB} (95% ${f(l2)}-${f(u2)})`);
console.log(`${lb} - ${la}: ${f(d)} (Newcombe 95% ${f(lo)} to ${f(hi)}); Fisher two-sided p = ${fisher(kA, nA - kA, kB, nB - kB).toFixed(4)}`);
