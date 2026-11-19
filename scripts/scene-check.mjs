#!/usr/bin/env node
// The docker check of the scene staging (kit/results/dev/infra-scenes.md §6): the scripted controls of the two
// template fixtures (packages/pit-wall/test/fixtures/kit/dev-scene, dev-layer) in docker (Harbor), and five answers.
// NOT a gate run: no contract table, no ledger, no model, no harness, no token.
//
//   node scripts/scene-check.mjs --plan                 what would run (no docker; any machine)
//   node scripts/scene-check.mjs [--only scene|layer] [--out <dir>] [--min-free-gib <n>]      (Linux / WSL, from the repository root)
//
// One container at a time. Before each trial the available memory is read as the gate does (gate-run.mjs guard,
// default 6 GiB); the 7-day quota is not asked, because nothing here uses a model.
// The base image of dev-layer is built here, small: the agent image + the template's stand-in base tree as one
// commit in /app (no dependency is installed).
// Output: <out> (default runs/scene-check/<UTC time>/): result.json, result.md, plan.json, trials/ (the saved
// records), and raw/, arms/ (Harbor's own files; git-ignored).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliArgs } from '../packages/pit-wall/src/kit/cli-args.mjs';
import { PROBE, plan, render, verdicts } from '../packages/pit-wall/src/kit/scene-check.mjs';
import { scrubHome } from '../packages/pit-wall/src/kit/scrub-home.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USAGE = 'usage: node scripts/scene-check.mjs [--plan] [--only scene|layer] [--out <dir>] [--min-free-gib <n>]\n  Runs the scripted controls of the template fixtures dev-scene and dev-layer in docker and answers the five\n  checks of kit/results/dev/infra-scenes.md §6. No model. --plan prints the trials and runs nothing.';
const { flags, options } = cliArgs(process.argv.slice(2), { flags: ['plan'], options: ['only', 'out', 'min-free-gib'], max: 0, usage: USAGE });
if (options.only !== undefined && !['scene', 'layer'].includes(options.only)) { process.stderr.write(`--only is scene or layer\n${USAGE}\nNothing was run.\n`); process.exit(2); }
const minGiB = Number(options['min-free-gib'] ?? 6);
if (!(minGiB > 0)) { process.stderr.write(`--min-free-gib needs a number\n${USAGE}\nNothing was run.\n`); process.exit(2); }
const say = (s) => process.stdout.write(`${s}\n`);
const TPL = 'packages/pit-wall/test/fixtures/kit';
const todo = plan({ only: options.only ?? null });

if (flags.plan) {
  say(`scene-check — plan (nothing is run). ${todo.length} trials, one container at a time, no model.`);
  for (const t of todo) say(`  ${t.phase.padEnd(10)} ${t.fixture.padEnd(9)} ${t.arm.padEnd(16)} ${t.what}`);
  say(`before each: available memory >= ${minGiB} GiB (the gate's reading). Fixtures: ${TPL}/dev-scene, ${TPL}/dev-layer.`);
  if (todo.some((t) => t.fixture === 'dev-layer')) say('first: a small base image for dev-layer is built (agent image + the stand-in base tree as one commit).');
  say('output: runs/scene-check/<UTC time>/ — result.md, result.json, plan.json, trials/ (raw/ and arms/ are git-ignored).');
  process.exit(0);
}
if (process.platform !== 'linux') { process.stderr.write('scene-check runs its trials in docker on Linux / WSL. Use --plan to see what it would run.\nNothing was run.\n'); process.exit(2); }

const { harborCases, controlAsExpected } = await import('../packages/pit-wall/src/kit/harbor-cases.mjs');
const { guard, gradeTrial, runTrial } = await import('../packages/pit-wall/src/kit/gate-run.mjs');
const { runLocal } = await import('../packages/pit-wall/src/kit/capture-local.mjs');
const { resolveImage } = await import('../packages/pit-wall/src/images.mjs');

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const runDir = resolve(ROOT, options.out ?? join('runs', 'scene-check', stamp));
mkdirSync(runDir, { recursive: true });
const notes = [];
const load = (name) => { const r = harborCases(join(ROOT, 'kit/roles/dev.yaml'), join(ROOT, TPL, name)); return { spec: r.spec, kase: r.cases.find((c) => c.kit.case === 'dev-normal') }; };
const spec = load('dev-scene').spec;
const cases = {};
const local = { layer_head: null };
let baseline = null;

if (todo.some((t) => t.fixture === 'dev-scene')) {
  const k = load('dev-scene').kase;
  k.scripts = { ...k.scripts, probe: PROBE };
  cases['dev-scene'] = k;
  // the start facts, replayed without a container: what the verifier is given as its own copy (item 4)
  try {
    const f = runLocal(k, { bash: 'bash' }).local.start_facts;
    baseline = Object.fromEntries(['git-refs-before', 'branch-before', 'head-before', 'remote-refs-before', 'gh-snapshot-sha'].filter((n) => typeof f[n] === 'string').map((n) => [n, f[n]]));
  } catch (e) { notes.push(`the start facts could not be replayed without a container (${String(e.message).slice(0, 160)}): item 4 runs without a verifier copy`); }
}
if (todo.some((t) => t.fixture === 'dev-layer')) {
  const k = load('dev-layer').kase;
  // the small base image: the agent image + the stand-in base tree, committed as the replay without a container commits it
  const agent = resolveImage('claude-code').ref, tag = `pitwall/scene-check-base:${stamp.toLowerCase()}`;
  const ctx = mkdtempSync(join(tmpdir(), 'scene-base-'));
  cpSync(k.layer.localBase, join(ctx, 'base'), { recursive: true });
  const d = '2026-01-05T10:00:00+00:00';
  writeFileSync(join(ctx, 'Dockerfile'), `FROM ${agent}\nCOPY base/ /app/\nRUN cd /app && find . -type f -exec chmod 644 {} + && git init -q . && git config core.autocrlf false && git add -A && GIT_AUTHOR_DATE='${d}' GIT_COMMITTER_DATE='${d}' git -c user.name=base -c user.email=base@example.com commit -q -m base\nWORKDIR /app\n`);
  const b = spawnSync('docker', ['build', '-q', '-t', tag, ctx], { encoding: 'utf8' });
  rmSync(ctx, { recursive: true, force: true });
  if (b.status !== 0) { process.stderr.write(`the base image for dev-layer could not be built: ${String(b.stderr).slice(-600)}\n`); process.exit(1); }
  const h = spawnSync('docker', ['run', '--rm', tag, 'git', '-C', '/app', '-c', 'safe.directory=*', 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const baseHead = /^[0-9a-f]{40}$/.test(h.stdout.trim()) ? h.stdout.trim() : null;
  if (!baseHead) notes.push('the HEAD of the base image could not be read: dev-layer runs without base_head');
  try {
    const rec = runLocal(k, { bash: 'bash' });
    local.layer_head = rec.kit_facts.capture?.git?.head_before ?? null;
    const localBase = rec.kit_facts.capture?.git?.refs_before?.['refs/remotes/origin/release/next'] ?? null;     // the template puts this branch at the base commit
    if (baseHead && localBase && baseHead !== localBase) notes.push(`the base commit in the image (${baseHead}) is not the one replayed without a container (${localBase}): the staged heads are then not comparable`);
  } catch (e) { notes.push(`dev-layer could not be replayed without a container (${String(e.message).slice(0, 160)})`); }
  cases['dev-layer'] = { ...k, baseImage: tag, layer: { ...k.layer, image: tag, ...(baseHead ? { base_head: baseHead } : {}) } };
  cases['dev-layer/wrong-base'] = { ...cases['dev-layer'], layer: { ...cases['dev-layer'].layer, base_head: 'f'.repeat(40) } };
  notes.push(`base image of dev-layer: ${tag} (built from ${agent}; remove it with \`docker rmi ${tag}\`)`);
}
// what is written carries no local home path (scrub-home.mjs); the trial records are written by runTrial, which scrubs too
const put = (name, text) => writeFileSync(join(runDir, name), scrubHome(text));
put('plan.json', `${JSON.stringify({ stamp, min_free_gib: minGiB, trials: todo }, null, 1)}\n`);

const rows = [];
let stopped = null;
for (const t of todo) {
  const kase = cases[t.phase === 'wrong-base' ? 'dev-layer/wrong-base' : t.fixture];
  const g = guard(ROOT, { minMiB: minGiB * 1024, quota: { ok: true, reading: 'not asked (no model)', text: 'not asked' } });
  if (!g.ok) { stopped = g.why; break; }
  say(`[${new Date().toISOString().slice(11, 16)}] ${t.phase} ${t.fixture} ${t.arm} (available ${g.mem} MiB)`);
  const saved = await runTrial({ root: ROOT, runDir, kase, t: { phase: t.phase, arm: t.arm, case: kase.id, trial: 1 }, before: g, baseline: t.phase === 'baseline' ? baseline : null });
  const script = t.arm.slice(7);
  let as_built = null, why = null;
  if (kase.controls[script]?.events && saved.record?.state && !saved.infra_error) {
    try { const gr = gradeTrial(spec, kase, saved); as_built = gr.infra ? null : controlAsExpected(kase.controls[script].expect, gr.grade); why = gr.infra ? gr.infra_error : `built for ${kase.controls[script].expect}, graded ${gr.outcome}${gr.forbidden.length ? ` (${gr.forbidden.join(', ')})` : ''}${gr.undecided.length ? `; not decided: ${gr.undecided.join(', ')}` : ''}`; } catch (e) { why = String(e.message).slice(0, 200); }
  }
  rows.push({ phase: t.phase, fixture: t.fixture, script, saved, as_built, why });
  say(`    ${saved.infra_error ? `infra: ${saved.infra_error.slice(0, 160)}` : as_built === null ? 'recorded' : as_built ? 'as built' : `NOT as built: ${why}`} (${saved.wall_seconds} s)`);
}
if (stopped) notes.push(`stopped before the end: ${stopped}. The trials that did not run are "cannot be confirmed".`);
const out = verdicts(rows, local);
put('result.json', `${JSON.stringify({ stamp, not_a_gate_run: true, answers: out, notes, local, trials: rows.map((r) => ({ phase: r.phase, fixture: r.fixture, script: r.script, as_built: r.as_built, why: r.why, infra_error: r.saved.infra_error ?? null, wall_seconds: r.saved.wall_seconds })) }, null, 1)}\n`);
const md = scrubHome(render(out, { stamp, notes }));
put('result.md', md);
say(`\n${md}\nwritten: ${runDir}`);
process.exit(Object.values(out).every((a) => a.status === 'confirmed') ? 0 : 1);
