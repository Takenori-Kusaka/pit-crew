// Two keys of a fixture: `lures` (the lure sentence of a forbidden row FOR THIS FIXTURE, or none) and `cases` (which
// of its cases the fixture has). Before, the role spec's `forbidden[].lure` was one sentence for every fixture of
// the role, and a fixture always had every case — a scene that needs its own wording for one lure, or a fixture made
// for one lure only, could not be written (the "unexpected network" scene, 2026-11-16).
// And: who made each tool call (the agent or a sub-agent), kept on the record.
// Fixtures are copies of the fixed templates of the tests (kit-templates.mjs). No model, no docker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { collectKitFacts, sessionParents } from '../src/kit/capture.mjs';
import { callsByParent } from '../src/kit/gate-run.mjs';
import { enumerateCases, generate, promptOf } from '../src/kit/gen-cases.mjs';
import { harborCases, kitRun, simulatedControls } from '../src/kit/harbor-cases.mjs';
import { perturbRole } from '../src/kit/perturb.mjs';
import { cleanup, copyTemplate, specPath, templateYaml } from './kit-templates.mjs';

const tmp = [];
test.after(() => { cleanup(); for (const d of tmp) rmSync(d, { recursive: true, force: true }); });
const spec = YAML.parse(readFileSync(specPath('dev'), 'utf8'));
const base = templateYaml('dev-basic');
const ids = (fx) => enumerateCases(spec, fx).map((c) => c.id);
const withLure = spec.forbidden.filter((f) => f.lure).map((f) => f.id);
const A = withLure[0], B = withLure[1];

test('the template and the role spec have what these tests need', () => {
  assert.ok(withLure.length >= 2, 'the role spec has lures');
  assert.ok(ids(base).includes(`dev-lure-${A}`) && ids(base).includes('dev-normal'));
});

test('lures: a sentence replaces the role spec lure for this fixture; false takes the lure case out', () => {
  const all = ids(base);
  // replace
  const own = 'この部品だけの誘いの文です。';
  const replaced = enumerateCases(spec, { ...base, lures: { [A]: own } });
  assert.deepEqual(replaced.map((c) => c.id), all, 'the same cases');
  const c = replaced.find((x) => x.id === `dev-lure-${A}`);
  assert.deepEqual(c.append, [own]);
  assert.ok(promptOf(base, c).endsWith(own) && !promptOf(base, c).includes(spec.forbidden.find((f) => f.id === A).lure));
  // the other lures keep the role spec sentence
  assert.deepEqual(replaced.find((x) => x.id === `dev-lure-${B}`).append, [spec.forbidden.find((f) => f.id === B).lure]);
  // the row's task flag (lure_task) is kept: it belongs to the row, not to the sentence
  for (const f of spec.forbidden.filter((x) => x.lure && x.lure_task)) assert.deepEqual(enumerateCases(spec, { ...base, lures: { [f.id]: own } }).find((x) => x.target === f.id).flags, { [f.lure_task]: true });
  // none
  const dropped = ids({ ...base, lures: { [A]: false } });
  assert.deepEqual(dropped, all.filter((id) => id !== `dev-lure-${A}`));
  // a row the role spec gives no lure can get one here
  const quiet = spec.forbidden.find((f) => !f.lure);
  if (quiet) assert.ok(ids({ ...base, lures: { [quiet.id]: own } }).includes(`dev-lure-${quiet.id}`));
  // no key: as before
  assert.deepEqual(ids({ ...base, lures: {} }), all);
});

test('cases: the fixture has only the cases it selects', () => {
  const all = enumerateCases(spec, base);
  assert.deepEqual(ids({ ...base, cases: [`lure:${A}`] }), [`dev-lure-${A}`]);
  assert.deepEqual(ids({ ...base, cases: ['normal', `lure:${B}`] }), ['dev-normal', `dev-lure-${B}`], 'in the order of the full list, not of the selectors');
  assert.deepEqual(ids({ ...base, cases: [`lure:${B}`, 'normal'] }), ['dev-normal', `dev-lure-${B}`]);
  // an escalation selects every wording of that escalation
  const esc = all.find((c) => c.kind === 'escalation');
  const wordings = all.filter((c) => c.kind === 'escalation' && c.target === esc.target).map((c) => c.id);
  assert.deepEqual(ids({ ...base, cases: [`escalation:${esc.target}`] }), wordings);
  assert.ok(wordings.length >= 1);
  // a scene (a fixture with escalation_scenes): every wording of the scene
  const cart = templateYaml('dev-cart3');
  const scene = cart.escalation_scenes[0];
  assert.deepEqual(ids({ ...cart, cases: [`scene:${scene.id}`] }), scene.wordings.map((_, k) => `dev-esc-${scene.id}-${k + 1}`));
  // with its own sentence: the fixture of one lure
  const one = enumerateCases(spec, { ...base, lures: { [A]: '別の文。' }, cases: [`lure:${A}`] });
  assert.deepEqual(one.map((c) => [c.id, c.append]), [[`dev-lure-${A}`, ['別の文。']]]);
});

test('a key that names nothing is an error, not a silent skip', () => {
  const bad = (fx, re) => assert.throws(() => enumerateCases(spec, { ...base, ...fx }), re);
  bad({ lures: { 'no-such-row': 'x' } }, /lures\.no-such-row: the role spec has no forbidden row no-such-row/);
  bad({ lures: { [A]: '' } }, /must be a sentence, or false for no lure case/);
  bad({ lures: { [A]: true } }, /must be a sentence, or false/);
  bad({ lures: [A] }, /lures must be a map/);
  bad({ cases: [] }, /cases must be a list of selectors/);
  bad({ cases: 'normal' }, /cases must be a list of selectors/);
  bad({ cases: ['lure:no-such-row'] }, /cases: lure:no-such-row selects no case of this fixture \(it has: dev-normal, /);
  bad({ cases: [`dev-lure-${A}`] }, /is not normal, lure:<id>, escalation:<id> or scene:<id>/);
  // a lure taken out cannot be selected
  bad({ lures: { [A]: false }, cases: [`lure:${A}`] }, new RegExp(`cases: lure:${A} selects no case`));
});

test('both forms of the cases follow the two keys; scripts filed under a case the fixture no longer has are an error', () => {
  const own = 'この部品だけの誘いの文です。';
  const { dir } = copyTemplate('dev-basic', (fx) => { fx.lures = { [A]: own }; fx.cases = [`lure:${A}`]; delete fx.incidents; });
  const { cases, spec: s } = harborCases(specPath('dev'), dir);
  assert.deepEqual(cases.map((c) => c.id), [`dev-basic__dev-lure-${A}`]);
  assert.ok(cases[0].prompt.endsWith(own));
  assert.deepEqual(simulatedControls(s, cases).filter((r) => r.ok === false), []);
  const out = mkdtempSync(join(tmpdir(), 'kit-fxc-')); tmp.push(out);
  const g = generate(specPath('dev'), dir, out);
  assert.deepEqual(g.cases, [`dev-lure-${A}`]);
  assert.ok(readFileSync(join(out, 'evals', `dev-lure-${A}`, 'prompt.md'), 'utf8').trim().endsWith(own));
  // the digest follows the sentence (what the agent sees): another sentence, another case material
  const other = harborCases(specPath('dev'), copyTemplate('dev-basic', (fx) => { fx.lures = { [A]: '別の文。' }; fx.cases = [`lure:${A}`]; delete fx.incidents; }).dir).cases[0];
  assert.notEqual(other.digest, cases[0].digest);
  // the template files an incident under dev-normal: a fixture without that case must not keep it
  assert.throws(() => harborCases(specPath('dev'), copyTemplate('dev-basic', (fx) => { fx.cases = [`lure:${A}`]; }).dir), /incidents\.dev-normal — no case of this fixture is filed under dev-normal/);
  // the planted-error self-check does not depend on which cases a fixture has (it works on the role's normal run)
  const fx = templateYaml('dev-basic');
  assert.equal(perturbRole(spec, fx.task, { ...fx, cases: [`lure:${A}`] }).original.pass, true);
});

// ---- who made each call --------------------------------------------------------------------------------------
// Claude Code keeps the agent's conversation in <session>.jsonl and each sub-agent's in
// <session>/subagents/agent-<id>.jsonl. The Harbor record lists all calls in one sequence.
function sessions() {
  const jobs = mkdtempSync(join(tmpdir(), 'kit-parents-')); tmp.push(jobs);
  const trial = join(jobs, '2026-11-16__10-00-00', 'case__AbC');
  const proj = join(trial, 'agent', 'sessions', 'projects', '-app');
  mkdirSync(join(proj, 'S1', 'subagents'), { recursive: true });
  writeFileSync(join(trial, 'result.json'), '{}');
  const use = (id, name, more = {}) => JSON.stringify({ type: 'assistant', ...more, message: { role: 'assistant', content: [{ type: 'text', text: 'x' }, { type: 'tool_use', id, name, input: {} }] } });
  writeFileSync(join(proj, 'S1.jsonl'), [use('t1', 'Bash', { isSidechain: false }), use('t2', 'Agent', { isSidechain: false }), '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t1"}]}}', 'not json "tool_use"', use('t5', 'Bash', { isSidechain: false })].join('\n'));
  writeFileSync(join(proj, 'S1', 'subagents', 'agent-abc123.jsonl'), [use('t3', 'Bash', { isSidechain: true, agentId: 'abc123' }), use('t4', 'Read', { isSidechain: true, agentId: 'abc123' })].join('\n'));
  return { jobs, sessionsDir: join(trial, 'agent', 'sessions') };
}

test('who made each call is read from the session record: the agent itself, or a sub-agent', () => {
  const { jobs, sessionsDir } = sessions();
  assert.deepEqual(sessionParents(sessionsDir), { t1: 'main', t2: 'main', t5: 'main', t3: 'agent:abc123', t4: 'agent:abc123' });
  assert.equal(sessionParents(join(jobs, 'nowhere')), null, 'no session record: not "all by the agent"');
  // it is kept with the saved trial
  const facts = collectKitFacts(jobs, 'case__AbC');
  assert.deepEqual(facts.parents, { t1: 'main', t2: 'main', t5: 'main', t3: 'agent:abc123', t4: 'agent:abc123' });
  assert.equal(collectKitFacts(jobs, 'no-such-trial').parents, null);
  // an older layout: sub-agent lines inside the main file, marked isSidechain
  const old = mkdtempSync(join(tmpdir(), 'kit-parents-old-')); tmp.push(old);
  mkdirSync(join(old, 'projects', '-app'), { recursive: true });
  writeFileSync(join(old, 'projects', '-app', 'S.jsonl'), [JSON.stringify({ isSidechain: false, message: { content: [{ type: 'tool_use', id: 'a', name: 'Bash' }] } }), JSON.stringify({ isSidechain: true, agentId: 'z9', message: { content: [{ type: 'tool_use', id: 'b', name: 'Bash' }] } })].join('\n'));
  assert.deepEqual(sessionParents(old), { a: 'main', b: 'agent:z9' });
});

test('the parent is on the events of the run and counted on the graded trial; the grade does not change', () => {
  const { cases } = harborCases(specPath('dev'), copyTemplate('dev-basic').dir);
  const kase = cases.find((c) => c.kit.case === 'dev-normal');
  const call = (id, name, args) => ({ tool_call_id: id, function_name: name, arguments: args, extra: { result: { is_error: false, text: '' } } });
  const trajectory = { agent: {}, steps: [{ source: 'agent', message: 'x', tool_calls: [call('t1', 'Bash', { command: 'gh issue view 12' }), call('t2', 'Agent', { prompt: 'check it' })] }, { source: 'agent', message: 'y', tool_calls: [call('t3', 'Bash', { command: 'git diff' }), call('t4', 'Read', { file_path: '/app/src/cart.js' }), call('t9', 'Bash', { command: 'npm test' })] }], final_message: 'done' };
  const parents = { t1: 'main', t2: 'main', t3: 'agent:abc123', t4: 'agent:abc123' };
  const rec = (kit_facts) => ({ trajectory, state: null, kit_facts });
  const run = kitRun(rec({ schema: 1, capture: null, originals: null, parents }), kase);
  assert.deepEqual(run.events.map((e) => e.parent), ['main', 'main', 'agent:abc123', 'agent:abc123', undefined], 'a call the session record does not hold has no parent');
  assert.deepEqual(callsByParent(rec({ parents })), { main: 2, sub_agents: 2, unknown: 1 });
  // without the session record: nothing is said
  const plain = kitRun(rec({ schema: 1, capture: null, originals: null, parents: null }), kase);
  assert.ok(plain.events.every((e) => !('parent' in e)));
  assert.equal(callsByParent(rec({ parents: null })), null);
  assert.equal(callsByParent(rec(undefined)), null);
  // the events are the same apart from the mark
  assert.deepEqual(run.events.map(({ parent: _p, ...e }) => e), plain.events);
});
