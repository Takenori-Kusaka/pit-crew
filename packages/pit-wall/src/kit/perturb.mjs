#!/usr/bin/env node
// Planted errors (goal 2, N4): take a role's reference script (the normal case's correct run, built from
// the spec's examples) and plant one error at a time — add a forbidden act, drop a required act, swap an
// ordered pair. The grader must catch every planted error and still pass the original. This checks the
// grader and the spec against each other mechanically, without a model and without a human judge.
// Usage: node packages/pit-wall/src/kit/perturb.mjs [--out kit/results/perturb.json]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';
import { referenceEvents } from './gen-cases.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
const sub = (v, task) => (typeof v === 'string' ? v.replace(/\$\{task\.([\w-]+)\}/g, (_, k) => String(arr(task[k])[0] ?? '')) : v);
// a concrete path for a glob: '**/' and '*' become a plain name
const instantiate = (g, task) => { const s = sub(g, task); return s.replace(/\*\*\//g, '').replace(/\*\*/g, 'planted').replace(/\*/g, 'planted'); };
const stateOf = (events) => ({
  changed: [...new Set(events.filter((e) => ['Edit', 'Write'].includes(e.tool) && e.path).map((e) => e.path))],
  checks_pass: true, gh: [...new Set(events.flatMap((e) => e.gh ?? []))],
});

// Build the events (and task flags) that make a forbidden detector true; null when the detector cannot
// be instantiated from its own terms (a bare command regex) and the spec gives no `example`.
function plant(d, task) {
  if (d.any) { for (const x of d.any) { const p = plant(x, task); if (p) return p; } return null; }
  if (d.all) { const ps = d.all.map((x) => plant(x, task)); if (ps.some((p) => !p)) return null; return { events: ps.flatMap((p) => p.events), flags: Object.assign({}, ...ps.map((p) => p.flags)) }; }
  if (d.after) return plant(d.then, task);                       // appended at the end, i.e. after everything
  if (d.task) return { events: [], flags: Object.fromEntries(arr(d.task).map((t) => [t, true])) };
  if (d.gh) return { events: [{ tool: 'Bash', command: '# planted gh effect', gh: [arr(d.gh)[0]] }], flags: {} };
  if (d.changed) return { events: [{ tool: 'Write', path: instantiate(arr(d.changed)[0], task) }], flags: {} };
  if (d.changed_outside) return { events: [{ tool: 'Write', path: 'planted-outside-scope/x.txt' }], flags: {} };
  if (d.path && (d.tool === undefined || arr(d.tool).some((t) => ['Read', 'Grep', 'Edit', 'Write'].includes(t)))) {
    const tool = arr(d.tool)[0] ?? 'Read';
    const e = { tool, path: instantiate(arr(d.path)[0], task) };
    if (d.removes) { e.old = 'assert.equal(a, b);\n'; e.new = ''; }
    return { events: [e], flags: {} };
  }
  if (d.tool && d.command === undefined) return { events: [{ tool: arr(d.tool)[0] }], flags: {} };
  return null;
}

export function perturbRole(spec, task) {
  const ref = referenceEvents(spec, task).map((e) => ({ ...e }));
  const run = (events, t = task) => grade(spec, { events, state: stateOf(events), task: t, kind: 'normal' });
  const original = run(ref);
  const results = [];
  for (const f of spec.forbidden) {
    let p = plant(f.detect, task);
    if (!p && f.example) p = { events: [{ ...f.example, command: sub(f.example.command, task), path: sub(f.example.path, task) }], flags: {} };
    if (!p) { results.push({ kind: 'add-forbidden', target: f.id, plantable: false }); continue; }
    const t = { ...task, ...p.flags };
    const g = run([...ref, ...p.events], t);
    results.push({ kind: 'add-forbidden', target: f.id, plantable: true, detected: g.forbidden[f.id] === true && !g.pass });
  }
  for (const id of spec.procedure.required ?? []) {
    // the reference has one event per required action, in topological order; find it by detecting
    const idx = ref.findIndex((e) => grade(spec, { events: [e], state: stateOf([e]), task, kind: 'normal' }).action[id]);
    if (idx < 0) { results.push({ kind: 'drop-required', target: id, plantable: false }); continue; }
    const g = run(ref.filter((_, k) => k !== idx));
    results.push({ kind: 'drop-required', target: id, plantable: true, detected: g.required[id] === false && !g.pass });
  }
  for (const [a, b] of spec.procedure.order ?? []) {
    const find = (id) => ref.findIndex((e) => grade(spec, { events: [e], state: stateOf([e]), task, kind: 'normal' }).action[id]);
    const ia = find(a), ib = find(b);
    if (ia < 0 || ib < 0) { results.push({ kind: 'swap-order', target: `${a}→${b}`, plantable: false }); continue; }
    const ev = ref.filter((_, k) => k !== ib); ev.splice(ev.indexOf(ref[ia]), 0, ref[ib]);   // b moved just before a
    const g = run(ev);
    const row = g.order.find((o) => o.before === a && o.after === b);
    results.push({ kind: 'swap-order', target: `${a}→${b}`, plantable: true, detected: row?.ok === false && !g.pass });
  }
  return { original: { pass: original.pass, conformance: original.conformance, violations: original.violations }, results };
}

export function perturbAll(root = '.') {
  const out = {};
  // every fixture whose `role` has a spec; `<role>-basic` is reported as <role>, others by their directory name
  for (const d of readdirSync(join(root, 'kit/fixtures'))) {
    const fxPath = join(root, 'kit/fixtures', d, 'fixture.yaml');
    if (!existsSync(fxPath)) continue;
    const fx = YAML.parse(readFileSync(fxPath, 'utf8'));
    const specPath = join(root, 'kit/roles', `${fx.role}.yaml`);
    if (!existsSync(specPath)) continue;
    const spec = YAML.parse(readFileSync(specPath, 'utf8'));
    out[d === `${fx.role}-basic` ? fx.role : d] = perturbRole(spec, fx.task ?? {});
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/').replace(/^\/([a-z])\//i, '$1:/')) {
  const args = process.argv.slice(2);
  const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'kit/results/perturb.json';
  const all = perturbAll();
  for (const [role, r] of Object.entries(all)) {
    const n = r.results.length, det = r.results.filter((x) => x.detected).length, unpl = r.results.filter((x) => !x.plantable).map((x) => `${x.kind}:${x.target}`);
    console.log(`${role.padEnd(10)} original ${r.original.pass ? 'pass' : 'FAIL'}  detected ${det}/${n}${unpl.length ? `  not plantable: ${unpl.join(', ')}` : ''}${r.results.filter((x) => x.plantable && !x.detected).map((x) => `  MISSED ${x.kind}:${x.target}`).join('')}`);
  }
  writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString(), roles: all }, null, 1) + '\n');
}
