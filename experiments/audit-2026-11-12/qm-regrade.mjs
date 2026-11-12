// Auditor script (read-only on graders / specs / runs). Re-grades every stored EXP-42 / EXP-43 record with
// the unchanged review grader and writes per-record item results to qm-regrade.json (auditor-only).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor, rawInstructions } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { correct } from '../qm/analyze-exp41.mjs';

const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const EXPS = {
  exp42: { root: 'runs/2026-11-05', prefix: 'exp42', cells: JSON.parse(readFileSync('runs/2026-11-04/exp41-sieve.json', 'utf8')).sieve.kept, spec: 'experiments/qm/process-spec.json', verdicts: 'experiments/qm/verdicts.json', harm: '../qm/harm.mjs' },
  exp43: { root: 'runs/2026-11-05', prefix: 'exp43', cells: JSON.parse(readFileSync('experiments/qm-heldout/rederive/agreement.json', 'utf8')).kept, spec: 'experiments/qm-heldout/process-spec.json', verdicts: 'experiments/qm-heldout/verdicts.json', harm: '../qm-heldout/harm.mjs' },
};
const out = [];
for (const [exp, x] of Object.entries(EXPS)) {
  const spec = JSON.parse(readFileSync(x.spec, 'utf8'));
  const expected = Object.fromEntries(JSON.parse(readFileSync(x.verdicts, 'utf8')).map((v) => [v.case, v]));
  const { harmOf } = await import(x.harm);
  for (const c of x.cells) for (const a of ARMS) {
    const dir = join(x.root, `${x.prefix}-${c}-${a}`), p = join(dir, 'results.json');
    if (!existsSync(p)) throw new Error(`missing ${p}`);
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    const nInv = recs.filter((r) => r.validity?.status === 'invalid').length;
    const excluded = nInv > Math.ceil(recs.length * 0.1);
    let raw = null;
    recs.forEach((r, k) => {
      if (!r.trajectory || String(r.arm).startsWith('script:')) return;
      if (!r.trajectory.extra?.pitwall?.instruction && r.instruction == null && r.harborTrial) { raw ??= rawInstructions(dir); r.instruction = raw.get(r.harborTrial) ?? null; }
      const opts = optsFor(r.case, spec, { trajectory: 'T1', bug: false, base: false, implFiles: [] });
      const g = gradeRecord(r, opts).phases;
      const cell = { id: c, spec: spec[c], expect: { verdict: expected[c].verdict, harm: expected[c].harmIfWrong } };
      out.push({ exp, cell: c, arm: a, k, trial: r.trial ?? r.harborTrial, valid: r.validity?.status !== 'invalid', excluded,
        checks: Object.fromEntries(g.checks.map((ch) => [ch.id, ch.result])), series: Object.fromEntries(g.checks.map((ch) => [ch.id, ch.series])),
        B: g.B, facts: g.facts, ok: correct(r, expected[c].verdict, spec[c]), harm: harmOf(r, cell), expectKind: String(expected[c].verdict).toLowerCase() === 'pass' ? 'P' : 'N' });
    });
  }
}
writeFileSync('experiments/audit-2026-11-12/qm-regrade.json', JSON.stringify(out));
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
for (const exp of Object.keys(EXPS)) for (const a of ARMS) { const rows = out.filter((r) => r.exp === exp && r.arm === a && r.valid && !r.excluded); console.log(exp, a, rows.length, mean(rows.map((r) => r.B.share ?? 0)).toFixed(3)); }
