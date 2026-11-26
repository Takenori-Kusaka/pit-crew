#!/usr/bin/env node
// Planted errors (goal 2, N4): take a role's reference script (the normal case's correct run, built from
// the spec's examples) and plant one error at a time — add a forbidden act, drop a required act, swap an
// ordered pair. The grader must catch every planted error and still pass the original. This checks the
// grader and the spec against each other mechanically, without a model and without a human judge.
// W3 (#100): a fourth kind, hide-text — the planted forbidden edit with its text (old / new) taken out of
// the record. The grader must answer "undecidable" on that row: not a violation, and not a pass.
// A fifth kind, drop-before — the reference without the steps a fixture placed before an action
// (`reference.before`): a row the reference satisfied must turn false. A sixth, drop-after — the same for the steps placed
// after an action (`reference.after`).
// The ref facts: every variant is graded on the simulated state below PLUS the branch and ref facts (and, for a
// staged scene, the remote's refs) of its events replayed without a container, by the same replay as the self-check
// of the scripted controls (replay-facts.mjs). Without them a row that reads refs (hand-back-via-branch-or-pr on a
// scene with a logged remote) could not be decided, and a push dropped from the reference could not be caught.
// Usage: node packages/pit-wall/src/kit/perturb.mjs [--out kit/results/perturb.json]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';
import { referenceEvents } from './gen-cases.mjs';
import { harborCases } from './harbor-cases.mjs';
import { replayFacts } from './replay-facts.mjs';
import { cliArgs } from './cli-args.mjs';

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

const PLANT_OLD = 'assert.equal(a, b);\n';   // the text that a planted `removes` edit takes away

// Build the events (and task flags) that make a forbidden detector true; null when the detector cannot
// be instantiated from its own terms (a bare command regex) and the spec gives no `example`.
// `finalText`: the forbidden rule's `example_final` (a last message that a `final` predicate must match)
function plant(d, task, finalText) {
  if (d.any) { for (const x of d.any) { const p = plant(x, task, finalText); if (p) return p; } return null; }
  if (d.all) { const ps = d.all.map((x) => plant(x, task, finalText)); if (ps.some((p) => !p)) return null; return { events: ps.flatMap((p) => p.events), flags: Object.assign({}, ...ps.map((p) => p.flags)), final: ps.map((p) => p.final).find(Boolean) }; }
  if (d.after) return plant(d.then, task, finalText);
  // an "undecidable" branch never makes a violation; a text predicate other than a `removes` that the planted
  // text satisfies cannot be built from its regex — the row's `example` (with old / new) is used instead
  if (d.undecidable || d.unrecorded || d.adds !== undefined || d.edits !== undefined) return null;
  if (d.removes !== undefined && !new RegExp(sub(d.removes, task), 's').test(PLANT_OLD)) return null;
  if (d.final) return finalText ? { events: [], flags: {}, final: finalText } : null;                       // appended at the end, i.e. after everything
  if (d.task) return { events: [], flags: Object.fromEntries(arr(d.task).map((t) => [t, true])) };
  if (d.gh) return { events: [{ tool: 'Bash', command: '# planted gh effect', gh: [arr(d.gh)[0]] }], flags: {} };
  if (d.changed) return { events: [{ tool: 'Write', path: instantiate(arr(d.changed)[0], task) }], flags: {} };
  if (d.changed_outside) return { events: [{ tool: 'Write', path: 'planted-outside-scope/x.txt' }], flags: {} };
  if (d.path && (d.tool === undefined || arr(d.tool).some((t) => ['Read', 'Grep', 'Edit', 'Write'].includes(t)))) {
    const tool = arr(d.tool)[0] ?? 'Read';
    const e = { tool, path: instantiate(arr(d.path)[0], task) };
    if (d.removes) { e.old = PLANT_OLD; e.new = ''; }
    return { events: [e], flags: {} };
  }
  if (d.tool && d.command === undefined) return { events: [{ tool: arr(d.tool)[0] }], flags: {} };
  return null;
}

// `fx` (optional): the fixture. Its `reference.before` / `reference.after` steps are part of the reference script (gen-cases.mjs).
// `opts.replay` (optional): events -> the replayed ref facts ({ git, remote }) merged into each variant's state
// (perturbAll gives replay-facts.mjs; without it, the simulated state alone, as for a spec with no fixture).
export function perturbRole(spec, task, fx, opts = {}) {
  // `ref_step`: a step of the reference script (not a planted one): the replay runs it whole (replay-facts.mjs)
  const ref = referenceEvents(spec, task, fx).map((e) => ({ ...e, ref_step: true }));
  const facts = (events) => (opts.replay ? opts.replay(events) ?? {} : {});
  const run = (events, t = task, final) => grade(spec, { events, state: { ...stateOf(events), ...facts(events) }, task: t, kind: 'normal', final });
  const original = run(ref);
  const results = [];
  for (const f of spec.forbidden) {
    let p = plant(f.detect, task, f.example_final);
    if (!p && f.example) p = { events: [{ ...f.example, command: sub(f.example.command, task), path: sub(f.example.path, task) }], flags: {} };
    if (!p) { results.push({ kind: 'add-forbidden', target: f.id, plantable: false }); continue; }
    const t = { ...task, ...p.flags };
    const g = run([...ref, ...p.events], t, p.final);
    results.push({ kind: 'add-forbidden', target: f.id, plantable: true, detected: g.forbidden[f.id] === true && !g.pass });
    // hide-text: the same planted edit, recorded without its text (only for rows whose plant carries text)
    if (p.events.some((e) => typeof e.old === 'string')) {
      const hidden = p.events.map(({ old: _o, new: _n, ...e }) => e);
      const h = run([...ref, ...hidden], t, p.final);
      results.push({ kind: 'hide-text', target: f.id, plantable: true, detected: h.forbidden[f.id] === null && h.undecidable.includes(`forbidden:${f.id}`) && !h.pass });
    }
  }
  // W3 (#100): harm rows (forbidden outcomes read from the end state, spec.harms). A row carries its own planted
  // facts: example_task (the task values that make the row apply), example_state (facts merged into the end
  // state) and, when the row also reads a call, example. Two checks per row:
  //   add-harm       the facts planted on the reference run -> the row is a violation and the run does not pass
  //   withhold-harm  the row applies but its planted facts and call are absent -> the row is NOT a violation
  for (const h of spec.harms ?? []) {
    if (!h.example_state && !h.example) { results.push({ kind: 'add-harm', target: h.id, plantable: false }); continue; }
    const t = { ...task, ...(h.example_task ?? {}) };
    const ev = h.example ? [{ ...h.example, command: sub(h.example.command, t), path: sub(h.example.path, t) }] : [];
    // a row's planted ref facts (example_state git / remote) replace the replayed ref facts (the replayed checks stay): otherwise a replayed remote would
    // hide a plant written for the local refs (a row reads the remote when there is one). Without a plant, the replay.
    const withState = (events, patch) => { const { git, remote, ...rest } = facts(events); return grade(spec, { events, state: { ...stateOf(events), ...rest, ...(patch.git || patch.remote ? {} : { ...(git ? { git } : {}), ...(remote ? { remote } : {}) }), ...patch }, task: t, kind: 'normal' }); };
    const g = withState([...ref, ...ev], h.example_state ?? {});
    results.push({ kind: 'add-harm', target: h.id, plantable: true, detected: g.harms[h.id] === true && g.forbidden[h.id] === true && !g.pass });
    const w = withState(ref, {});
    results.push({ kind: 'withhold-harm', target: h.id, plantable: true, detected: h.id in w.harms && w.harms[h.id] !== true });
  }
  // An action's step goes together with the steps the fixture placed AFTER it (`reference.after.<id>`, e.g. a second
  // file of the same fix written by a shell command): they carry the action on, so dropping or moving the action drops
  // or moves them too (otherwise the action is still done by them and the planted error is no error).
  // Every step that does the action on its own counts, not only the first: a fixture may place a step that does it
  // earlier (`reference.before.edit-impl` writes the new test and runs it red, so add-test and run-checks are done there
  // too: Dev round 2, row 55). Dropping or moving only the first left the action done by the other, and the planted
  // error was no error (CI on 32d71c48c).
  const doers = (id) => ref.map((e, k) => (grade(spec, { events: [e], state: stateOf([e]), task, kind: 'normal' }).action[id] ? k : -1)).filter((k) => k >= 0);
  const groupOf = (id, idx) => [...new Set([...doers(id), idx, ...ref.map((e, k) => (e.after_of === id ? k : -1)).filter((k) => k > idx)])].sort((x, y) => x - y);
  for (const id of spec.procedure.required ?? []) {
    // the reference has one event per required action, in topological order; find it by detecting
    const idx = ref.findIndex((e) => grade(spec, { events: [e], state: stateOf([e]), task, kind: 'normal' }).action[id]);
    if (idx < 0) { results.push({ kind: 'drop-required', target: id, plantable: false }); continue; }
    const drop = new Set(groupOf(id, idx));
    const g = run(ref.filter((_, k) => !drop.has(k)));
    results.push({ kind: 'drop-required', target: id, plantable: true, detected: g.required[id] === false && !g.pass });
  }
  for (const [a, b] of spec.procedure.order ?? []) {
    const find = (id) => ref.findIndex((e) => grade(spec, { events: [e], state: stateOf([e]), task, kind: 'normal' }).action[id]);
    const ia = find(a), ib = find(b);
    if (ia < 0 || ib < 0) { results.push({ kind: 'swap-order', target: `${a}→${b}`, plantable: false }); continue; }
    const block = groupOf(b, ib), moved = new Set(block);
    const ev = ref.filter((_, k) => !moved.has(k)); ev.splice(ev.indexOf(ref[ia]), 0, ...block.map((k) => ref[k]));   // b (with its after-steps) moved just before a
    const g = run(ev);
    const row = g.order.find((o) => o.before === a && o.after === b);
    results.push({ kind: 'swap-order', target: `${a}→${b}`, plantable: true, detected: row?.ok === false && !g.pass });
  }
  // drop-before: the reference without the steps the fixture placed before one action (`reference.before.<id>`).
  // The steps exist to satisfy a row that reads "before <id>" (e.g. the callers were read before the implementation
  // was changed), so without them a row the reference satisfies must turn false, and the run must not pass.
  //   detected     every required row that stopped being true is false, there is at least one, and the run does
  //                not pass (`rows`: which rows)
  //   inert        no row changed: the steps are declared, but no row of this task counts them (e.g. the task value
  //                that switches the row on is not set yet). Not a planted error; listed in `inert_before`.
  //   not detected a row changed but the run still passes, or a row turned undecidable instead of false
  // drop-after: the same for the steps placed after an action (`reference.after.<id>`), e.g. the push after hand-back:
  // with the replayed remote, a row that reads the remote's refs turns false. A step no row counts is `inert_after`.
  const inert = [], inertAfter = [];
  for (const [side, kind, list] of [['before_of', 'drop-before', inert], ['after_of', 'drop-after', inertAfter]]) {
    for (const id of [...new Set(ref.map((e) => e[side]).filter(Boolean))]) {
      const g = run(ref.filter((e) => e[side] !== id));
      const moved = Object.keys(original.required ?? {}).filter((k) => original.required[k] === true && g.required[k] !== true);
      if (!moved.length) { list.push(id); continue; }
      results.push({ kind, target: id, plantable: true, detected: moved.every((k) => g.required[k] === false) && !g.pass, rows: moved });
    }
  }
  // the reference run itself: no harm row applies (the fixture's task sets none of their `when` values) or, where
  // one applies, it is not a violation
  return { original: { pass: original.pass, conformance: original.conformance, violations: original.violations, harms_applying: Object.keys(original.harms ?? {}) }, results, ...(inert.length ? { inert_before: inert } : {}), ...(inertAfter.length ? { inert_after: inertAfter } : {}) };
}

// Every fixture whose `role` has a spec, under each directory of `dirs` (relative to root): kit/fixtures, and the
// templates of the kit's own tests (packages/pit-wall/test/fixtures/kit), so a form only a template has is checked
// too. A fixture of kit/fixtures is reported as <role> (`<role>-basic`) or its directory name; a template as
// `template:<name>`. `replay`: false = the simulated state only (no ref facts); `bash` as replay-facts.mjs.
// Each result says how its ref facts were made: `replay` = 'pipeline' | 'local' | 'unavailable: <why>' | 'off'.
export const FIXTURE_DIRS = ['kit/fixtures', 'packages/pit-wall/test/fixtures/kit'];
export function perturbAll(root = '.', { dirs = FIXTURE_DIRS, replay = true, bash } = {}) {
  const out = {};
  for (const dir of dirs) {
    if (!existsSync(join(root, dir))) continue;
    const template = dir !== 'kit/fixtures';
    for (const d of readdirSync(join(root, dir)).sort()) {
      const fxDir = join(root, dir, d), fxPath = join(fxDir, 'fixture.yaml');
      if (!existsSync(fxPath)) continue;
      const fx = YAML.parse(readFileSync(fxPath, 'utf8'));
      const specPath = join(root, 'kit/roles', `${fx.role}.yaml`);
      if (!existsSync(specPath)) continue;
      out[template ? `template:${d}` : d === `${fx.role}-basic` ? fx.role : d] = { ...perturbFixture(specPath, fxDir, { replay, bash }), fixture: `${dir}/${d}` };
    }
  }
  return out;
}
// Only the given fixture directories (relative to root), each reported by its directory name.
export function perturbFixtures(root, dirs, opts = {}) {
  const out = {};
  for (const d of dirs) {
    const fxPath = join(root, d, 'fixture.yaml');
    if (!existsSync(fxPath)) throw new Error(`${d}: no fixture.yaml`);
    const fx = YAML.parse(readFileSync(fxPath, 'utf8'));
    out[d.replace(/[\\/]+$/, '').split(/[\\/]/).pop()] = perturbFixture(join(root, 'kit/roles', `${fx.role}.yaml`), join(root, d), opts);
  }
  return out;
}
// One fixture: its spec, its normal case (for the replay), and the planted errors graded with the replayed facts.
export function perturbFixture(specPath, fxDir, { replay = true, bash } = {}) {
  const spec = YAML.parse(readFileSync(specPath, 'utf8'));
  const fx = YAML.parse(readFileSync(join(fxDir, 'fixture.yaml'), 'utf8'));
  if (!replay) return { ...perturbRole(spec, fx.task ?? {}, fx), replay: 'off' };
  const kase = harborCases(specPath, fxDir).cases.find((c) => c.kit.kind === 'normal');
  let how = null;
  const fn = (events) => {
    const r = replayFacts(kase, events, { ...(bash !== undefined ? { bash } : {}), content: fx.reference?.files ?? {} });
    if (r.unavailable) { how = `unavailable: ${r.unavailable}`; return null; }
    how ??= r.replayed;
    return r.facts;
  };
  const res = perturbRole(spec, fx.task ?? {}, fx, { replay: fn });
  return { ...res, replay: how ?? 'off', staged: !!kase.staged };
}

if (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/').replace(/^\/([a-z])\//i, '$1:/')) {
  // checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
  const { options } = cliArgs(process.argv.slice(2), { options: ['out', 'fixtures'], max: 0,
    usage: 'usage: node packages/pit-wall/src/kit/perturb.mjs [--out <json>] [--fixtures <dir>[,<dir>...]]\n  Plants one error at a time in every role\'s reference script and grades it. No model, no docker.\n  --fixtures: only these fixture directories (reported by directory name). Default: every fixture of kit/fixtures and\n  every template of the tests. WRITES the result to --out (default kit/results/perturb.json, replacing it).' });
  const outPath = options.out ?? 'kit/results/perturb.json';
  let all;
  try { all = options.fixtures ? perturbFixtures('.', options.fixtures.split(',').filter(Boolean)) : perturbAll(); }
  catch (e) { process.stderr.write(`${e.message}\nNothing was written.\n`); process.exit(1); }
  for (const [role, r] of Object.entries(all)) {
    const n = r.results.length, det = r.results.filter((x) => x.detected).length, unpl = r.results.filter((x) => !x.plantable).map((x) => `${x.kind}:${x.target}`);
    console.log(`${role.padEnd(10)} original ${r.original.pass ? 'pass' : 'FAIL'}  detected ${det}/${n}${unpl.length ? `  not plantable: ${unpl.join(', ')}` : ''}${r.results.filter((x) => x.plantable && !x.detected).map((x) => `  MISSED ${x.kind}:${x.target}`).join('')}${r.inert_before ? `  before-steps no row counts: ${r.inert_before.join(', ')}` : ''}${r.inert_after ? `  after-steps no row counts: ${r.inert_after.join(', ')}` : ''}`);
  }
  writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString(), roles: all }, null, 1) + '\n');
}
