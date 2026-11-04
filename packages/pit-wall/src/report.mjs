// Turn graded records into per-case pass rates, arm comparisons and a Markdown report.
// Scores are reported per dimension: 'behavior' (fair to every arm) and 'protocol'
// (the harness's own channel), plus 'overall'.

import { compareArms, passHatK, wilson } from './stats.mjs';
import { assessCase } from './validity.mjs';

// Runs that did not measure the agent are dropped from every score (and listed).
const counted = (r) => r.validity?.status !== 'invalid';

const DIMENSIONS = ['behavior', 'protocol', 'overall'];

function outcome(r, dim) {
  if (dim === 'overall') return r.passed;
  return r.passedBy?.[dim]; // undefined when the case has no grader in this dimension
}

function summarizeDimension(doc, dim, cases, arms) {
  const byCaseArm = {};
  // Runs whose outcome could not be decided (null: a tristate check exited 2) are counted
  // apart, never as failures.
  const undecided = {};
  for (const r of doc.records.filter(counted)) {
    const o = outcome(r, dim);
    if (o === undefined) continue;
    if (o === null) { undecided[`${r.case}\u0000${r.arm}`] = (undecided[`${r.case}\u0000${r.arm}`] ?? 0) + 1; continue; }
    (byCaseArm[`${r.case}\u0000${r.arm}`] ??= []).push(o ? 1 : 0);
  }
  const rows = cases
    .filter((c) => arms.some((a) => byCaseArm[`${c}\u0000${a}`] || undecided[`${c}\u0000${a}`]))
    .map((c) => ({
      case: c,
      arms: Object.fromEntries(arms.map((a) => {
        const xs = byCaseArm[`${c}\u0000${a}`] ?? [];
        const k = xs.reduce((s, x) => s + x, 0);
        return [a, { k, n: xs.length, undecided: undecided[`${c}\u0000${a}`] ?? 0, rate: xs.length ? k / xs.length : null, ci: wilson(k, xs.length), passHat3: passHatK(k, xs.length, 3) }];
      })),
    }));
  const comparisons = (doc.candidates ?? []).map((cand) => {
    const byCase = {};
    for (const row of rows) {
      byCase[row.case] = { candidate: byCaseArm[`${row.case}\u0000${cand}`] ?? [], baseline: byCaseArm[`${row.case}\u0000${doc.baseline}`] ?? [] };
    }
    return { candidate: cand, baseline: doc.baseline, ...compareArms(byCase) };
  });
  return { rows, comparisons };
}

export function summarize(doc) {
  const cases = [...new Set(doc.records.map((r) => r.case))];
  const arms = [...new Set(doc.records.map((r) => r.arm))];
  const fired = {};
  for (const r of doc.records) {
    for (const x of r.results.filter((x) => x.indicator)) {
      const f = (fired[`${r.case}\u0000${r.arm}`] ??= { hit: 0, n: 0 });
      f.n++; if (x.passed) f.hit++;
    }
  }
  const dims = Object.fromEntries(DIMENSIONS.map((d) => [d, summarizeDimension(doc, d, cases, arms)]));
  const errors = doc.records.filter((r) => r.error).map((r) => ({ arm: r.arm, case: r.case, trial: r.trial, error: r.error }));
  // Run validity per case/arm, and the faults behind it.
  const validity = {};
  const faults = [];
  for (const r of doc.records) {
    const v = (validity[`${r.case}\u0000${r.arm}`] ??= { ok: 0, suspect: 0, invalid: 0 });
    const st = r.validity?.status ?? 'ok';
    v[st]++;
    for (const f of r.validity?.faults ?? []) faults.push({ arm: r.arm, case: r.case, trial: r.trial, ...f });
  }
  // Case discrimination: only when the suite names its control arms.
  const caseFlags = [];
  if (doc.controls?.good && doc.controls?.bad) {
    for (const dim of DIMENSIONS) {
      for (const row of dims[dim].rows) {
        const flags = assessCase(row.arms, { good: doc.controls.good, bad: doc.controls.bad, baseline: doc.baseline });
        if (flags.length) caseFlags.push({ case: row.case, dim, flags });
      }
    }
  }
  return { suite: doc.suite, model: doc.model, runner: doc.runner, createdAt: doc.createdAt, arms, cases, dims, fired, errors, validity, faults, caseFlags, controls: doc.controls ?? null, n: doc.records.length, nCounted: doc.records.filter(counted).length };
}

const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
const pt = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(0)}`;

export function renderReport(s) {
  const L = [];
  L.push(`# pit-wall report: ${s.suite}`, '');
  L.push(`- runner: ${s.runner} / model: ${s.model ?? 'default'} / runs: ${s.n} (scored: ${s.nCounted}) / ${s.createdAt}`);
  const invalid = s.n - s.nCounted;
  if (invalid) L.push(`- **${invalid} run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.`);
  const undecidable = s.faults.filter((f) => f.kind === 'check-undecidable').length;
  if (undecidable) L.push(`- **${undecidable} run(s) had a check that could not decide.** They are shown as "undecidable" next to the scores, not counted as passes or failures. See "Run validity".`);
  if (s.caseFlags.some((f) => f.flags.includes('non-discriminating'))) L.push('- **Some cases cannot tell the good control from the bad one.** Their verdicts are not evidence. See "Case validity".');
  L.push('- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness\'s own channel (e.g. a specific label); vanilla cannot know it.');
  L.push('- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.', '');
  for (const dim of DIMENSIONS) {
    const { rows, comparisons } = s.dims[dim];
    if (!rows.length) continue;
    L.push(`## ${dim}`, '');
    L.push(`| case | ${s.arms.join(' | ')} |`, `|---|${s.arms.map(() => '---').join('|')}|`);
    for (const row of rows) {
      L.push(`| ${row.case} | ${s.arms.map((a) => {
        const x = row.arms[a];
        const u = x.undecided ? ` + ${x.undecided} undecidable` : '';
        return x.n ? `${x.k}/${x.n} (${pct(x.rate)}; ${pct(x.ci[0])}–${pct(x.ci[1])})${u}` : u ? u.slice(3) : '–';
      }).join(' | ')} |`);
    }
    L.push('', '| candidate vs baseline | Δ | 95% interval | verdict |', '|---|---|---|---|');
    for (const c of comparisons) {
      if (c.delta == null) { L.push(`| ${c.candidate} vs ${c.baseline} | – | – | not enough data |`); continue; }
      L.push(`| ${c.candidate} vs ${c.baseline} | ${pt(c.delta)} pt | ${pt(c.ci[0])} … ${pt(c.ci[1])} pt | **${c.verdict}** |`);
    }
    L.push('');
  }
  L.push('## Skill activation (indicator, not scored)', '');
  L.push(`| case | ${s.arms.join(' | ')} |`, `|---|${s.arms.map(() => '---').join('|')}|`);
  for (const c of s.cases) {
    L.push(`| ${c} | ${s.arms.map((a) => { const f = s.fired[`${c}\u0000${a}`]; return f ? `${f.hit}/${f.n}` : '–'; }).join(' | ')} |`);
  }
  L.push('', '## Run validity (did the run measure the agent?)', '');
  L.push('ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.', '');
  L.push(`| case | ${s.arms.join(' | ')} |`, `|---|${s.arms.map(() => '---').join('|')}|`);
  for (const c of s.cases) {
    L.push(`| ${c} | ${s.arms.map((a) => { const v = s.validity[`${c}\u0000${a}`]; return v ? `${v.ok} / ${v.suspect} / ${v.invalid}` : '–'; }).join(' | ')} |`);
  }
  const byKind = {};
  for (const f of s.faults) (byKind[f.name ? `${f.kind}:${f.name}` : f.kind] ??= []).push(f);
  if (Object.keys(byKind).length) {
    L.push('', '| fault | count | example |', '|---|---|---|');
    for (const [k, fs] of Object.entries(byKind)) {
      const e = fs.find((f) => f.evidence) ?? fs[0];
      L.push(`| ${k} | ${fs.length} | ${e.arm} / ${e.case} #${e.trial}${e.evidence ? `: \`${String(e.evidence).replace(/[|`]/g, ' ')}\`` : ''} |`);
    }
  }
  if (s.controls) {
    L.push('', `## Case validity (controls: good = ${s.controls.good}, bad = ${s.controls.bad})`, '');
    if (!s.caseFlags.length) L.push('Every case separates the good control from the bad one, with room above the baseline.');
    for (const f of s.caseFlags) L.push(`- ${f.case} / ${f.dim}: ${f.flags.join(', ')}`);
  }
  if (s.errors.length) {
    L.push('', '## Run errors (runner failures: invalid, excluded from scores)', '');
    for (const e of s.errors) L.push(`- ${e.arm} / ${e.case} #${e.trial}: ${e.error}`);
  }
  return L.join('\n') + '\n';
}
