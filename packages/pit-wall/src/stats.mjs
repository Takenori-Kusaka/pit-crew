// Statistics for small-n, noisy agent runs.
// Results are per (case, arm) lists of 0/1 run outcomes.

// Wilson score interval for a proportion.
export function wilson(k, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - r) / d), Math.min(1, (c + r) / d)];
}

// Deterministic PRNG so reports are reproducible.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Standard normal and Gamma/Beta samplers (Marsaglia–Tsang), for posterior draws.
function normal(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function gamma(shape, rand) {
  if (shape < 1) return gamma(shape + 1, rand) * Math.pow(rand(), 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = normal(rand); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function beta(a, b, rand) { const x = gamma(a, rand); return x / (x + gamma(b, rand)); }

// Difference in pass rate (candidate - baseline), averaged over cases (case-macro).
// Interval: each (case, arm) pass rate gets a Jeffreys Beta(k+.5, n-k+.5) posterior;
// we draw from them and take percentiles of the case-averaged difference. Unlike a
// bootstrap, this stays honest at 0/n and n/n with tiny n (a bootstrap collapses to
// a zero-width interval there).
// byCase: { [case]: { candidate: number[], baseline: number[] } }
export function compareArms(byCase, { iterations = 20000, seed = 7, alpha = 0.05 } = {}) {
  const cases = Object.keys(byCase).filter((c) => byCase[c].candidate.length && byCase[c].baseline.length);
  if (!cases.length) return null;
  const point = mean(cases.map((c) => mean(byCase[c].candidate) - mean(byCase[c].baseline)));
  const rand = mulberry32(seed);
  const post = (xs) => { const k = xs.reduce((a, b) => a + b, 0); return [k + 0.5, xs.length - k + 0.5]; };
  const params = cases.map((c) => [post(byCase[c].candidate), post(byCase[c].baseline)]);
  const draws = [];
  for (let i = 0; i < iterations; i++) {
    draws.push(mean(params.map(([[a1, b1], [a0, b0]]) => beta(a1, b1, rand) - beta(a0, b0, rand))));
  }
  draws.sort((a, b) => a - b);
  const lo = draws[Math.floor((alpha / 2) * iterations)];
  const hi = draws[Math.ceil((1 - alpha / 2) * iterations) - 1];
  return { delta: point, ci: [lo, hi], cases: cases.length, verdict: verdict([lo, hi]) };
}

// Three-valued verdict: the CI must exclude zero to claim a direction.
export function verdict([lo, hi]) {
  if (lo > 0) return 'improved';
  if (hi < 0) return 'regressed';
  return 'inconclusive';
}

// pass^k estimate: probability that k independent runs all pass, from c passes in n runs.
export function passHatK(c, n, k) {
  if (k > n) return null;
  let num = 1, den = 1;
  for (let i = 0; i < k; i++) { num *= c - i; den *= n - i; }
  return c < k ? 0 : num / den;
}
