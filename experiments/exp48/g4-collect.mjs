#!/usr/bin/env node
// EXP-48 G4: collect the raw results of run-g4.sh (local/exp48-gq/g4-out/*.json) into
// gates/exp48/G4.result.json. Numbers, exit codes and counts only: path lists of the subject's
// failing test files stay in the local files. This file is the INPUT of the G4 verdict; the
// verdict (gates/exp48/G4.json) is written by another role.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const OUT = join(ROOT, 'local/exp48-gq/g4-out');
const read = (n) => (existsSync(join(OUT, n)) ? JSON.parse(readFileSync(join(OUT, n), 'utf8')) : null);
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const samples = readdirSync(join(ROOT, 'experiments/exp48/samples')).filter((n) => n.endsWith('.json')).map((n) => JSON.parse(readFileSync(join(ROOT, 'experiments/exp48/samples', n), 'utf8')));
const harness = JSON.parse(readFileSync(join(ROOT, 'experiments/exp48/harness-files.json'), 'utf8'));

const unitTxt = existsSync(join(OUT, 'unit.txt')) ? readFileSync(join(OUT, 'unit.txt'), 'utf8') : '';
const num = (re) => { const m = unitTxt.match(re); return m ? Number(m[1]) : null; };
const builds = existsSync(join(ROOT, 'local/exp48-gq/build/build-times.tsv')) ? readFileSync(join(ROOT, 'local/exp48-gq/build/build-times.tsv'), 'utf8').trim().split('\n').map((l) => { const [when, image, sec, bytes, rc] = l.split('\t'); return { when, image: image.replace(/:[0-9a-f]{12}$/, ':<lock hash>'), sec: Number(sec), MiB: Math.round(Number(bytes) / (1 << 20)), exit: Number(rc) }; }) : [];

const perSample = samples.map((s) => {
  const mat = existsSync(join(ROOT, 'local/exp48-gq/build', s.id, 'materialised.json')) ? JSON.parse(readFileSync(join(ROOT, 'local/exp48-gq/build', s.id, 'materialised.json'), 'utf8')) : null;
  const removed = new Set(mat?.removed ?? []);
  const checks = Object.fromEntries(['abc', 'd'].map((k) => {
    const c = read(`${s.id}-${k}-checks.json`);
    if (!c) return [k, null];
    return [k, { peakMiB: c.peakMiB, ...Object.fromEntries(Object.entries(c.checks).map(([n, r]) => [n, { exit: r.exit, timedOut: r.timedOut, sec: r.sec, peakMiBSoFar: r.peakMiBSoFar, recordedTools: r.records.length, ...(r.vitest ? { vitest: r.vitest } : {}), ...(r.abort ? { abort: r.abort } : {}), ...(r.summaryLine !== undefined ? { summary: r.summaryLine } : {}), ...(r.errorLines !== undefined ? { errorLines: r.errorLines } : {}), ...(r.problems !== undefined ? { problems: r.problems } : {}) }])) }];
  }));
  // "Already red because of the removal": failing in A/B/C's tree and not in D's.
  const fa = read(`${s.id}-abc-checks.json`)?.checks?.vitest?.failedFilesList ?? null;
  const fd = read(`${s.id}-d-checks.json`)?.checks?.vitest?.failedFilesList ?? null;
  const va = read(`${s.id}-abc-checks.json`)?.checks?.vitest?.vitest ?? null, vd = read(`${s.id}-d-checks.json`)?.checks?.vitest?.vitest ?? null;
  const alreadyRed = fa && { note: va?.skippedFiles === undefined ? 'this run listed every file that did not pass (failed or skipped) together' : 'failed files only; skipped files are counted apart', failedTests: { abc: va?.failed ?? null, d: vd?.failed ?? null }, failedAtCollection: { abc: va?.failedAtCollection ?? null, d: vd?.failedAtCollection ?? null }, skippedFiles: { abc: va?.skippedFiles ?? null, d: vd?.skippedFiles ?? null }, abcFailedFiles: fa.length, dFailedFiles: fd ? fd.length : null, onlyInAbc: fd ? fa.filter((f) => !fd.includes(f)).length : null, onlyInD: fd ? fd.filter((f) => !fa.includes(f)).length : null, byTopDir: fd ? Object.fromEntries(Object.entries(fa.filter((f) => !fd.includes(f)).reduce((m, f) => { const d = f.split('/').slice(0, 3).join('/'); m[d] = (m[d] ?? 0) + 1; return m; }, {})).sort()) : null };
  const hid = (k, p) => { const r = read(`${s.id}-${k}-${p}.json`); return r && { applied: r.applied ?? null, verifierSec: r.verifier.sec, verifierExit: r.verifier.exit, reward: r.verifier.reward, hidden: r.hidden?.hidden ?? null, siblings: r.hidden?.siblings ?? null, run: r.hidden?.run ?? null, collisions: r.hidden?.collisions ?? null, q4: r.hidden?.q4 ?? null, failedSiblings: r.failedSiblings?.length ?? null, stateBytes: r.stateBytes, peakMiB: r.peakMiB }; };
  const rec = read(`${s.id}-abc-recorder.json`);
  const cap = read(`${s.id}-abc-capture.json`)?.capture ?? null;
  return {
    id: s.id, pr: s.pr, prefix_commit: s.prefix_commit, reference_commit: s.reference_commit,
    pointer: { hiddenChecks: s.hidden_checks.length, hiddenNew: s.hidden_new?.length ?? null, siblingTests: s.sibling_tests.length, implFiles: s.impl_files.length },
    tree: mat && { paths: mat.treePaths, removedForABC: removed.size, nodeVersion: mat.nodeVersion },
    checks, alreadyRed,
    recorder: rec && { sameOutput: rec.sameOutput, formsTried: rec.forms.length, formsRecorded: rec.formsCovered, forms: rec.forms.map((f) => ({ form: f.form, exit: f.exit, recorded: f.recorded, recordExit: f.recordExit, tree: f.hasTree, perTest: f.perTest, sec: f.sec })), timeout: rec.timeout, kill: rec.kill },
    capture: cap && { ...cap, changed: cap.changed.length },
    controls: { abc: { noChange: hid('abc', 'hidden'), reference: hid('abc', 'reference') }, d: { noChange: hid('d', 'hidden'), reference: hid('d', 'reference') } },
    leak: read(`${s.id}-abc-leak.json`)?.leak ?? null,
    dHooks: read(`${s.id}-d-dhooks.json`)?.dhooks ?? null,
    // second round (review §11, owner 2026-11-13): history in every arm, tools, D's hooks run without an agent
    history: { prepared: mat?.history ?? null, abc: read(`${s.id}-abc-history.json`)?.history ?? null, d: read(`${s.id}-d-history.json`)?.history ?? null },
    tools: { prepared: mat?.tools ?? null, ghSnapshot: mat?.ghSnapshotMeta ?? null, abc: (({ tools, gh, graphify } = {}) => (tools ? { tools, gh, graphify } : null))(read(`${s.id}-abc-tools.json`) ?? undefined), d: (({ tools, gh, graphify } = {}) => (tools ? { tools, gh, graphify } : null))(read(`${s.id}-d-tools.json`) ?? undefined) },
    dHooksRun: read(`${s.id}-d-dhooks-run.json`)?.hooksRun ?? null,
    // the two controls through Harbor's oracle agent (oracle-smoke.sh), when run for this sample
    harborOracle: { reference: read(`${s.id}-oracle-reference.json`), noChange: read(`${s.id}-oracle-noop.json`) },
    svelteCheckDiagnosis: ['abc', 'd'].flatMap((k) => (existsSync(join(OUT, `${s.id}-${k}-sveltecheck-diagnosis.jsonl`)) ? readFileSync(join(OUT, `${s.id}-${k}-sveltecheck-diagnosis.jsonl`), 'utf8').trim().split('\n').map((l) => ({ tree: k, ...JSON.parse(l) })) : [])),
    testsDirInImage: existsSync(join(OUT, `${s.id}-tests-in-image.txt`)) ? readFileSync(join(OUT, `${s.id}-tests-in-image.txt`), 'utf8').trim() : null,
  };
});

const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const code = ['packages/pit-wall/shims/realrepo/gh.mjs', 'packages/pit-wall/src/realrepo/gh-snapshot.mjs', 'packages/pit-wall/src/realrepo/items.mjs', 'experiments/exp48/build-history-mirror.sh', 'experiments/quota.sh', 'packages/pit-wall/shims/realrepo/vitest-reporter.mjs', 'experiments/exp48/oracle-smoke.sh', 'experiments/exp48/build-images.sh', 'experiments/exp48/materialise.mjs', 'packages/pit-wall/src/gates.mjs', 'packages/pit-wall/src/realrepo/task.mjs', 'packages/pit-wall/src/realrepo/callers.mjs', 'packages/pit-wall/src/realrepo/gq-content.mjs', 'packages/pit-wall/src/graders/process/judge/jev-audit.mjs', 'packages/pit-wall/shims/realrepo/recorder.mjs', 'packages/pit-wall/shims/realrepo/node-wrapper.sh', 'packages/pit-wall/shims/realrepo/state-capture.mjs', 'packages/pit-wall/shims/realrepo/hidden-run.mjs', 'experiments/exp48/g4-in-image.mjs', 'experiments/exp48/run-g4.sh', 'experiments/exp48/harness-files.json'];
const result = {
  what: 'EXP-48 G4 raw result (machine). Not a verdict. Produced by experiments/exp48/run-g4.sh + g4-collect.mjs; run by the implementer, no model and no Harbor agent involved.',
  date: new Date().toISOString(),
  base_commit: head,
  uncommitted: true,
  inputs: code.filter((f) => existsSync(join(ROOT, f))).map((f) => ({ path: f, sha256: sha(join(ROOT, f)) })),
  subject: { repo: 'Takenori-Kusaka/ganbari-quest', samples: samples.map((s) => ({ id: s.id, pr: s.pr, prefix_commit: s.prefix_commit })) },
  unit: { tests: num(/^ℹ tests (\d+)/m), pass: num(/^ℹ pass (\d+)/m), fail: num(/^ℹ fail (\d+)/m), exit: num(/^exit=(\d+)/m) },
  harnessList: { remove: harness.remove.length, unsure: harness.remove.filter((h) => !h.sure).length },
  builds,
  // which measurements predate the second round (history, gh, graphify, 6,144 MiB): a phase file older than the images was not rerun
  round2: { historyMirror: existsSync(join(ROOT, 'local/exp48-gq/history-mirror.json')) ? JSON.parse(readFileSync(join(ROOT, 'local/exp48-gq/history-mirror.json'), 'utf8')) : null, rerunNeeded: 'every in-image phase: the images changed (history, tools). Blocked 2026-11-13: the host system drive is full and WSL does not start.' },
  samples: perSample,
};
mkdirSync(join(ROOT, 'gates/exp48'), { recursive: true });
writeFileSync(join(ROOT, 'gates/exp48/G4.result.json'), `${JSON.stringify(result, null, 1)}\n`);
process.stdout.write(`gates/exp48/G4.result.json written (${perSample.length} samples, unit ${result.unit.pass}/${result.unit.tests})\n`);
