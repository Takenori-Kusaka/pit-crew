// Power by simulation for EXP-32: per-trial shares (0..1), difference of means, two-sided
// permutation test, Holm over 3 comparisons. Shares are drawn by resampling an empirical pool
// (stage 0b) or from a clipped normal for assumed groups.
// Usage: node experiments/structure/power-share.mjs
const SIMS = 1000, PERMS = 2000;
let seed = 20261104;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const normal = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const draw = (g, n) => Array.from({ length: n }, () => (g.pool ? g.pool[Math.floor(rnd() * g.pool.length)] : Math.min(1, Math.max(0, g.mean + g.sd * normal()))));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const perm = (a, b) => {
  const obs = Math.abs(mean(a) - mean(b)), all = [...a, ...b];
  let k = 0;
  for (let p = 0; p < PERMS; p++) {
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    if (Math.abs(mean(all.slice(0, a.length)) - mean(all.slice(a.length))) >= obs - 1e-12) k++;
  }
  return (k + 1) / (PERMS + 1);
};
const holm = (ps) => { const o = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]); const adj = []; let prev = 0; o.forEach(([p, i], r) => { prev = Math.max(prev, Math.min(1, p * (ps.length - r))); adj[i] = prev; }); return adj; };
function power(label, def, bases, n) {
  const hits = bases.map(() => 0);
  for (let s = 0; s < SIMS; s++) {
    const d = draw(def, n);
    const ps = bases.map((b) => perm(d, draw(b, n)));
    holm(ps).forEach((p, i) => { if (p < 0.05) hits[i]++; });
  }
  console.log(`${label} (n=${n} per arm): ${hits.map((h, i) => `${bases[i].name} ${(h / SIMS).toFixed(2)}`).join(', ')}`);
}
// Dev group: means and spreads of stage 0b (EXP-29 R): vanilla 0.36, v0 0.59, v1 0.65, default 0.92
power('dev (stage-0b-like)', { mean: 0.92, sd: 0.12 }, [{ name: 'vanilla', mean: 0.36, sd: 0.2 }, { name: 'v0', mean: 0.59, sd: 0.2 }, { name: 'v1', mean: 0.65, sd: 0.2 }], 20);
// Held-out / D3: assumed smaller differences
power('held-out (assumed, gap halved)', { mean: 0.8, sd: 0.18 }, [{ name: 'vanilla', mean: 0.55, sd: 0.2 }, { name: 'v0', mean: 0.68, sd: 0.2 }, { name: 'v1', mean: 0.7, sd: 0.2 }], 40);
power('D3 (assumed, gap halved)', { mean: 0.8, sd: 0.18 }, [{ name: 'vanilla', mean: 0.55, sd: 0.2 }, { name: 'v0', mean: 0.68, sd: 0.2 }, { name: 'v1', mean: 0.7, sd: 0.2 }], 20);
