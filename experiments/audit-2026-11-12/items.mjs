// Audit helper (read-only on runs/graders): per group x arm item table for a Dev B experiment,
// B share with all items / without W items, and first-impl-edit diagnostics.
// Usage: node experiments/audit-2026-11-12/items.mjs <config-name>
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor, rawInstructions } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';

export const CONFIGS = {
  exp32: { root: 'runs/2026-11-04', arms: ['vanilla', 'v0', 'v1', 'default'], groups: {
    dev: { dirs: (c, a) => `exp32-dev-${c}-${a}`, cells: ['t4-scatter-big-start', 't5-stale-base-weak'], spec: 'experiments/process/spec-dev-cells.json' },
    heldout: { dirs: (c, a) => `exp32-heldout-${c}-${a}`, cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'], spec: 'experiments/heldout-s5/process-spec.json' },
    d3: { dirs: (c, a) => `exp32-d3-${c}-${a}`, cells: ['d3-3', 'd3-4'], spec: 'experiments/d3/process-spec.json' } } },
  // EXP-36: non-inferiority of v5b against default (v4), pooled over 3 cells. ref = v5b (difference = v5b - default).
  exp36: { root: 'runs/2026-11-04', arms: ['default', 'v5b'], ref: 'v5b', groups: {
    dev: { dirs: (c, a) => `exp36-${c}-${a}`, cells: ['t5-stale-base-weak'], spec: 'experiments/process/spec-dev-cells.json' },
    heldout: { dirs: (c, a) => `exp36-${c}-${a}`, cells: ['h5-a1'], spec: 'experiments/heldout-s5/process-spec.json' },
    d3: { dirs: (c, a) => `exp36-${c}-${a}`, cells: ['d3-3'], spec: 'experiments/d3/process-spec.json' } } },
};
const W = new Set(['eval.no-stale-claim']);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const share = (checks, drop = new Set()) => { const r = checks.filter((c) => c.series === 'B' && c.result !== null && !drop.has(c.id)); return r.length ? r.filter((c) => c.result === true).length / r.length : null; };

export function load(cfgName) {
  const cfg = CONFIGS[cfgName];
  const rows = [];
  for (const [g, G] of Object.entries(cfg.groups)) {
    const spec = JSON.parse(readFileSync(G.spec, 'utf8'));
    for (const c of G.cells) for (const a of cfg.arms) {
      const dir = join(cfg.root, G.dirs(c, a));
      const f = join(dir, 'results.json');
      if (!existsSync(f)) { rows.push({ group: g, cell: c, arm: a, missingDir: true }); continue; }
      const doc = JSON.parse(readFileSync(f, 'utf8'));
      let raw = null;
      doc.records.forEach((r, k) => {
        if (!r.trajectory || String(r.arm).startsWith('script:')) return;
        if (!r.trajectory.extra?.pitwall?.instruction && r.instruction == null && r.harborTrial) { raw ??= rawInstructions(dir); r.instruction = raw.get(r.harborTrial) ?? null; }
        const opts = optsFor(r.case, spec, { trajectory: 'T1', bug: false, base: false, implFiles: [] });
        const g2 = gradeRecord(r, opts);
        rows.push({ group: g, cell: c, arm: a, k, file: f, trial: r.trial ?? r.harborTrial, valid: r.validity?.status !== 'invalid', opts: { trajectory: opts.trajectory, bug: !!opts.bug, base: opts.base, implFiles: opts.implFiles },
          checks: g2.phases.checks, facts: g2.phases.facts, record: r });
      });
    }
  }
  return rows;
}

if (process.argv[1].split(String.fromCharCode(92)).join('/').endsWith('items.mjs')) {
  const name = process.argv[2] ?? 'exp32';
  const rows = load(name);
  const cfg = CONFIGS[name];
  for (const g of Object.keys(cfg.groups)) {
    console.log(`\n## ${name} group ${g}`);
    const ids = [...new Set(rows.filter((r) => r.group === g && r.checks).flatMap((r) => r.checks.filter((c) => c.series === 'B').map((c) => c.id)))];
    console.log(`| arm | n | B all | B w/o W | no impl edit | ${ids.map((i) => i.replace(/^(research|test|eval)\./, '')).join(' | ')} |`);
    for (const a of cfg.arms) {
      const rs = rows.filter((r) => r.group === g && r.arm === a && r.valid && r.checks);
      const cells = ids.map((id) => { const cs = rs.map((r) => r.checks.find((c) => c.id === id)).filter(Boolean); const req = cs.filter((c) => c.result !== null); return `${req.filter((c) => c.result).length}/${req.length}${cs.length - req.length ? ` (n/a ${cs.length - req.length})` : ''}`; });
      console.log(`| ${a} | ${rs.length} | ${mean(rs.map((r) => share(r.checks) ?? 0)).toFixed(3)} | ${mean(rs.map((r) => share(r.checks, W) ?? 0)).toFixed(3)} | ${rs.filter((r) => r.facts.firstImpl == null).length} | ${cells.join(' | ')} |`);
    }
  }
}
