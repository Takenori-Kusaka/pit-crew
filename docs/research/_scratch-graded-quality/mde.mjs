// Minimum detectable difference (MDE) between two arms for a graded (continuous) score,
// paired within task, tasks as the unit of error.
//
// Model: y[t,a,r] = mu[a] + task[t] + inter[t,a] + e[t,a,r]
//   total variance s2 = v_task + v_int + v_e
//   rho    = v_task / s2                 (correlation of two trials of the same task, different arms)
//   lambda = v_int / (v_int + v_e)       (share of the non-task variance that is task-by-arm interaction)
// Per-task difference of arm means (R trials each): var = 2*v_int + 2*v_e/R
// SE of the mean difference over T tasks = sqrt(var / T); test = paired t on T task differences (df = T-1).
// MDE = (t[1-alpha/2, df] + t[power, df]) * SE     (the usual approximation; slightly optimistic at df < 10)
//
// usage: node mde.mjs
const lgamma = (x) => {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015; for (const v of c) s += v / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
};
const tpdf = (x, df) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + x * x / df, -(df + 1) / 2);
const tcdf = (x, df) => { // Simpson from 0 to x
  const n = 2000, h = x / n; let s = tpdf(0, df) + tpdf(x, df);
  for (let i = 1; i < n; i++) s += tpdf(i * h, df) * (i % 2 ? 4 : 2);
  return 0.5 + s * h / 3;
};
const tq = (p, df) => { let lo = 0, hi = 50; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; (tcdf(m, df) < p ? (lo = m) : (hi = m)); } return (lo + hi) / 2; };

const mde = ({ T, R, rho, lambda, alpha = 0.05, power = 0.8 }) => {
  const rest = 1 - rho;                         // in units of total variance
  const varDiff = 2 * rest * (lambda + (1 - lambda) / R);
  const se = Math.sqrt(varDiff / T);
  return (tq(1 - alpha / 2, T - 1) + tq(power, T - 1)) * se; // in units of the total SD
};

const Ts = [6, 10, 20], Rs = [3, 5], rhos = [0.3, 0.5, 0.7], lambdas = [0, 0.25, 0.5];
const f = (x) => x.toFixed(2);
for (const alpha of [0.05, 0.05 / 3]) {
  console.log(`\n## alpha = ${alpha.toFixed(4)} (${alpha === 0.05 ? 'one planned comparison' : 'Bonferroni for 3 pairwise comparisons among 3 arms'}), power 0.80, MDE in units of the total SD`);
  for (const lambda of lambdas) {
    console.log(`\nlambda (task-by-arm interaction share of non-task variance) = ${lambda}`);
    console.log('| T tasks | R trials | rho 0.3 | rho 0.5 | rho 0.7 |');
    console.log('|---|---|---|---|---|');
    for (const T of Ts) for (const R of Rs) console.log(`| ${T} | ${R} | ${rhos.map((rho) => f(mde({ T, R, rho, lambda, alpha }))).join(' | ')} |`);
  }
}
console.log('\n## the same, converted to score points on a 0-1 scale (alpha 0.05, lambda 0.25)');
console.log('| T | R | SD 0.15: rho .3/.5/.7 | SD 0.25: rho .3/.5/.7 |');
console.log('|---|---|---|---|');
for (const T of Ts) for (const R of Rs) {
  const row = (sd) => rhos.map((rho) => f(sd * mde({ T, R, rho, lambda: 0.25 }))).join(' / ');
  console.log(`| ${T} | ${R} | ${row(0.15)} | ${row(0.25)} |`);
}
console.log('\n## floor set by the interaction alone (R -> infinity), alpha 0.05, lambda 0.25, total-SD units');
for (const T of Ts) console.log(`T=${T}: ${rhos.map((rho) => f(mde({ T, R: 1e9, rho, lambda: 0.25 }))).join(' / ')}`);
console.log('\n## t multipliers (t.975 + t.80) by df');
for (const T of [6, 10, 20, 30]) console.log(`T=${T} df=${T - 1}: ${f(tq(0.975, T - 1) + tq(0.8, T - 1))}  (z: 2.80)`);

// Monte-Carlo check of one row (T=10, R=3, rho=0.5, lambda=0.25): power at the computed MDE.
const rnd = (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const norm = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
const check = ({ T, R, rho, lambda }) => {
  const d = mde({ T, R, rho, lambda }), vInt = (1 - rho) * lambda, vE = (1 - rho) * (1 - lambda), crit = tq(0.975, T - 1);
  let hit = 0; const N = 20000;
  for (let i = 0; i < N; i++) {
    const ds = [];
    for (let t = 0; t < T; t++) {
      let a = Math.sqrt(vInt) * norm(), b = d + Math.sqrt(vInt) * norm();
      let ma = 0, mb = 0; for (let r = 0; r < R; r++) { ma += Math.sqrt(vE) * norm(); mb += Math.sqrt(vE) * norm(); }
      ds.push(b + mb / R - a - ma / R);
    }
    const m = ds.reduce((x, y) => x + y, 0) / T, sd = Math.sqrt(ds.reduce((x, y) => x + (y - m) ** 2, 0) / (T - 1));
    if (Math.abs(m / (sd / Math.sqrt(T))) > crit) hit++;
  }
  return hit / N;
};
console.log('\n## simulated power at the computed MDE (should be near 0.80; lower means the formula is optimistic)');
for (const c of [{ T: 6, R: 3, rho: 0.5, lambda: 0.25 }, { T: 10, R: 3, rho: 0.5, lambda: 0.25 }, { T: 20, R: 5, rho: 0.5, lambda: 0.25 }]) console.log(JSON.stringify(c), f(check(c)));
