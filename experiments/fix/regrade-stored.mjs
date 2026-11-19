// Re-grade the stored EXP-45 / EXP-46 records with the process grader as it is now (no model run,
// no Harbor run), one row per record. Auditor only: the output names cells, trials and findings.
//
//   node experiments/fix/regrade-stored.mjs --out=<rows.json>
//   node experiments/fix/regrade-stored.mjs --compare=<before.json>,<after.json>
//
// Arms: EXP-45 vanilla / v0 / default, EXP-46 default-r1; cells: sieve.json `kept`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor } from '../../packages/pit-wall/src/graders/process/cli.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const root = 'runs/2026-11-12';
const ARMS = [['exp45', 'vanilla'], ['exp45', 'v0'], ['exp45', 'default'], ['exp46', 'default-r1']];
const kept = JSON.parse(readFileSync('experiments/fix/sieve.json', 'utf8')).kept;
const key = (r) => `${r.exp}/${r.arm}/${r.case}/${r.trial}`;

if (arg('out')) {
  const spec = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
  const rows = [];
  for (const [exp, arm] of ARMS) for (const id of kept) {
    const recs = JSON.parse(readFileSync(join(root, `${exp}-${id}-${arm}`, 'results.json'), 'utf8')).records;
    for (const r of recs) {
      if (!r.trajectory) continue;
      const g = gradeRecord(r, optsFor(r.case, spec, {})).phases;
      const res = Object.fromEntries((r.results ?? []).map((x) => [x.name, x.passed]));
      rows.push({
        exp, arm, case: r.case, trial: r.trial, harborTrial: r.harborTrial, valid: r.validity?.status !== 'invalid',
        share: g.B.share, satisfied: g.B.satisfied, required: g.B.required, missing: g.B.missing,
        checks: Object.fromEntries(g.checks.map((c) => [c.id, c.result])),
        findings: g.facts.findings.map((p) => ({ id: p.id, expect: p.expect, status: p.status, touched: p.touched, via: p.via ?? null })),
        fixedWithoutDiff: g.facts.fixedWithoutDiff, fixedUndecided: g.facts.fixedUndecided,
        weakening: g.facts.weakening.map((h) => ({ path: h.path, rule: h.rule, detail: h.detail, via: h.via ?? null })),
        unverifiable: g.facts.unverifiableEdits.map((h) => ({ path: h.path, rule: h.rule })),
        harm: g.harm, endH2: res['h2-no-weakened-check'] === false, endH4: res['h4-claims-have-effect'] === false,
      });
    }
  }
  writeFileSync(arg('out'), `${JSON.stringify(rows)}\n`);
  console.log(`wrote ${arg('out')}: ${rows.length} rows`);
}

const mean = (xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const pct = (x) => (x == null ? '-' : `${(100 * x).toFixed(1)}%`);
const summary = (rows) => {
  const out = {};
  for (const [exp, arm] of ARMS) {
    const rs = rows.filter((r) => r.exp === exp && r.arm === arm && r.valid);
    const missing = {}, handling = { fixed: 0, rejected: 0, routed: 0, mentioned: 0, absent: 0 };
    const nulls = {};
    for (const r of rs) {
      for (const m of r.missing) missing[m] = (missing[m] ?? 0) + 1;
      for (const [k, v] of Object.entries(r.checks)) if (v === null) nulls[k] = (nulls[k] ?? 0) + 1;
      for (const f of r.findings) handling[f.status]++;
    }
    out[`${exp}/${arm}`] = { n: rs.length, share: mean(rs.map((r) => r.share)), missing, nulls, handling };
  }
  return out;
};

if (arg('compare')) {
  const [bf, af] = arg('compare').split(',');
  const before = JSON.parse(readFileSync(bf, 'utf8')), after = JSON.parse(readFileSync(af, 'utf8'));
  const sb = summary(before), sa = summary(after);
  const amap = new Map(after.map((r) => [key(r), r]));
  for (const k of Object.keys(sb)) {
    const b = sb[k], a = sa[k];
    console.log(`\n${k}  n=${b.n}  mean B-F share ${pct(b.share)} -> ${pct(a.share)}`);
    const ids = [...new Set([...Object.keys(b.missing), ...Object.keys(a.missing)])].sort();
    console.log(`  missing: ${ids.map((i) => `${i.replace('fix.', '')} ${b.missing[i] ?? 0}->${a.missing[i] ?? 0}`).join(' | ')}`);
    const nids = [...new Set([...Object.keys(b.nulls), ...Object.keys(a.nulls)])].sort();
    console.log(`  undecided: ${nids.map((i) => `${i.replace('fix.', '')} ${b.nulls[i] ?? 0}->${a.nulls[i] ?? 0}`).join(' | ') || '-'}`);
    console.log(`  handling: ${Object.keys(b.handling).map((h) => `${h} ${b.handling[h]}->${a.handling[h]}`).join(' | ')}`);
    const [exp, arm] = k.split('/');
    const flips = {};
    let trials = 0;
    for (const r of before.filter((x) => x.exp === exp && x.arm === arm && x.valid)) {
      const n = amap.get(key(r));
      let any = false;
      for (const [id, v] of Object.entries(r.checks)) if (n.checks[id] !== v) { const t = `${id.replace('fix.', '')}: ${v}->${n.checks[id]}`; flips[t] = (flips[t] ?? 0) + 1; any = true; }
      if (any) trials++;
    }
    console.log(`  trials with a changed check: ${trials}  (${Object.entries(flips).map(([t, c]) => `${t} ×${c}`).join(' | ') || '-'})`);
  }
}
