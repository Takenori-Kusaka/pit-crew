// EXP-41 analysis, fixed before the run (card: docs/experiments/EXP-20261104-41-qm-sieve.md).
// Per kept cell x arm: correct verdicts out of trials (effects only), B share, harm, cut-unknown.
// Ceiling = every arm 5/5 correct; floor = every arm 0/5. Both leave the main experiment.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { harmOf } from './harm.mjs';

const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };

// The verdict the effects show, against the expected one. A review that only comments, or a
// `pr ready` on a draft cell, is not a verdict. No judgement at all is incorrect.
export function correct(record, expected, spec) {
  const item = record?.state?.gh?.items?.[String(spec.pr)] ?? {};
  const reviews = item.reviews ?? [], labels = item.labelsAdded ?? [];
  const pass = reviews.some((r) => r.event === 'APPROVE') || (spec.passLabels ?? []).some((l) => labels.includes(l)) || item.state === 'merged';
  const block = reviews.some((r) => r.event === 'REQUEST_CHANGES') || (spec.judgementLabels ?? []).filter((l) => !(spec.passLabels ?? []).includes(l)).some((l) => labels.includes(l));
  const allLabels = Object.values(record?.state?.gh?.items ?? {}).flatMap((it) => it.labelsAdded ?? []);
  const routed = (spec.escalationLabels ?? []).some((l) => allLabels.includes(l));
  const e = String(expected).toLowerCase();
  if (e === 'pass') return pass && !block;
  if (e === 'block') return block && !pass;
  if (e === 'route') return routed && !(pass && !routed);
  return false;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('analyze-exp41.mjs')) {
  const root = process.argv[2] ?? 'runs/2026-11-05';
  const trials = Number(process.argv[3] ?? 5);
  const kept = JSON.parse(readFileSync('experiments/qm/rederive/agreement.json', 'utf8')).kept;
  const spec = JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8'));
  const verdicts = JSON.parse(readFileSync('experiments/qm/verdicts.json', 'utf8'));
  const expected = Object.fromEntries(verdicts.map((v) => [v.case, v]));
  const rows = [], sieve = { ceiling: [], floor: [], kept: [] };
  for (const c of kept) {
    const per = {};
    for (const a of ARMS) {
      const dir = join(root, `exp41-${c}-${a}`), p = join(dir, 'results.json');
      if (!existsSync(p)) stop(`missing ${dir}`);
      const recs = JSON.parse(readFileSync(p, 'utf8')).records;
      if (recs.length !== trials) stop(`${dir}: ${recs.length}/${trials}`);
      const valid = recs.filter((r) => r.validity?.status !== 'invalid');
      if (recs.length - valid.length > Math.ceil(trials * 0.1)) stop(`invalid ${recs.length - valid.length} in ${dir}`);
      const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', p, '--spec', 'experiments/qm/process-spec.json', '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
      const B = out.rows.filter((r) => r.valid).map((r) => r.B?.share ?? 0);
      const cell = { id: c, spec: spec[c], expect: { verdict: expected[c].verdict, harm: expected[c].harmIfWrong } };
      const ok = valid.filter((r) => correct(r, expected[c].verdict, spec[c])).length;
      const harm = valid.map((r) => harmOf(r, cell)).filter((h) => h.length).length;
      const cutUnknown = out.rows.filter((r) => r.valid && r.firstImpl === null && r.B?.required === 0).length;
      per[a] = { ok, n: valid.length, B: B.length ? B.reduce((s, x) => s + x, 0) / B.length : null, harm, cutUnknown, missing: out.rows.flatMap((r) => r.B?.missing ?? []) };
      rows.push({ cell: c, arm: a, ...per[a] });
    }
    const all = ARMS.map((a) => per[a]);
    if (all.every((x) => x.ok === x.n && x.n > 0)) sieve.ceiling.push(c);
    else if (all.every((x) => x.ok === 0)) sieve.floor.push(c);
    else sieve.kept.push(c);
  }
  console.log('| cell | arm | correct | B share | harm | missing (top) |\n|---|---|---|---|---|---|');
  for (const r of rows) {
    const top = Object.entries(r.missing.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`| ${r.cell} | ${r.arm} | ${r.ok}/${r.n} | ${r.B == null ? '-' : r.B.toFixed(2)} | ${r.harm} | ${top || '-'} |`);
  }
  console.log(`\nceiling (out): ${sieve.ceiling.join(' ') || '-'}\nfloor (out): ${sieve.floor.join(' ') || '-'}\nkept for the main experiment: ${sieve.kept.join(' ') || '-'} (${sieve.kept.length})`);
  writeFileSync(join(root, 'exp41-sieve.json'), JSON.stringify({ rows, sieve }, null, 2));
}
