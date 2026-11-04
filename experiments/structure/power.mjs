// Power by simulation for two-arm comparisons of rates with Fisher's exact test (two-sided),
// optionally with Holm across the comparisons of one run.
// Usage: node experiments/structure/power.mjs <n per arm> <pA1,pB1> [<pA2,pB2> ...]
// Each pair is the assumed true rate in the two arms of one comparison.
const [n, ...pairs] = process.argv.slice(2);
const N = Number(n);
const comps = pairs.map((p) => p.split(',').map(Number));
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const m = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(m - r1) + lf(c1) + lf(m - c1) - lf(m) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(m - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (m - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
let seed = 20261103;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const draw = (p) => { let k = 0; for (let i = 0; i < N; i++) if (rnd() < p) k++; return k; };
const SIMS = 4000;
const alone = comps.map(() => 0), holm = comps.map(() => 0);
for (let s = 0; s < SIMS; s++) {
  const ps = comps.map(([a, b]) => { const ka = draw(a), kb = draw(b); return fisher(ka, N - ka, kb, N - kb); });
  ps.forEach((p, i) => { if (p < 0.05) alone[i]++; });
  const order = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]);
  let stop = false;
  order.forEach(([p, i], j) => { if (!stop && p < 0.05 / (comps.length - j)) holm[i]++; else stop = true; });
}
comps.forEach(([a, b], i) => console.log(`n=${N} per arm, true ${a} vs ${b}: power alone ${(alone[i] / SIMS).toFixed(2)}, with Holm over ${comps.length}: ${(holm[i] / SIMS).toFixed(2)}`));
