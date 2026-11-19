// A kit case run WITHOUT a container (W4 #98): the same scripts a Harbor task gets — the runner's
// state-capture.sh, the kit's kit-setup.sh and kit-capture.sh, the gh stand-in, pitwall-mark-run — with their
// container paths (/app, /etc/pitwall, /logs/verifier, /tests, /tmp/pitwall-*) replaced by paths under one
// temporary directory, and bash, git and the host's own tools in place of the image. No docker, no model.
//
// It is for the pipeline's own tests and for the scripted controls. What it does NOT exercise: the image build
// (Dockerfile, the node runtime copied into the image, wrappers replacing a command in place), Harbor (task
// name, oracle agent, verifier upload, the job tree), another user than the one that built the repository, and
// a model's transcript. See experiments/w0c/prep-report.md §4.
//
// The result is a record shaped like the Harbor runner's: { case, trajectory, state, kit_facts, error }.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fixtureState, writeFixture } from '../fixture.mjs';
import { readState } from '../runners/harbor.mjs';
import { FACTS_FILE, KIT_CAPTURE, kitConf, patchTestSh, readKitFacts } from './capture.mjs';

const src = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fwd = (p) => p.replace(/\\/g, '/');
// the container's absolute paths -> the same places under T
export const localize = (text, T) => text
  .replace(/\/tmp\/pitwall-/g, `${T}/tmp/pitwall-`).replace(/\/logs\/verifier/g, `${T}/logs/verifier`).replace(/\/etc\/pitwall/g, `${T}/etc/pitwall`)
  .replace(/\/tests\//g, `${T}/tests/`).replace(/(?<=[\s(])\/app(?![\w.-])/g, `${T}/app`);
// the same lines runners/harbor.mjs writes as tests/checks.sh
const checksScript = (checks) => ['#!/bin/bash', ...Object.entries(checks).map(([n, cmd]) =>
  `echo ${Buffer.from(cmd).toString('base64')} | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\\t%s\\n' '${n}' "$?"`)].join('\n') + '\n';

// opts: bash (path of a POSIX bash), script (a control's name) or steps (a shell script text) or neither (nothing
//       is done), keep (leave the directory; its path is in the result), after (a function called with the paths
//       after the script and before the capture — a test's way to act as another user would)
//       baseline (true: the verifier keeps its own copy of the start facts, tests/kit-baseline — or the facts to
//       put there, { name: text })
export function runLocal(kase, { bash = 'bash', script = null, steps = null, keep = false, baseline = null } = {}) {
  const T = fwd(mkdtempSync(join(tmpdir(), 'kit-local-')));
  if (/\s/.test(T)) throw new Error(`the temporary directory has a space in its path: ${T}`);
  const P = { app: `${T}/app`, etc: `${T}/etc/pitwall`, kit: `${T}/etc/pitwall/kit`, logs: `${T}/logs/verifier`, tests: `${T}/tests`, bin: `${T}/bin`, kitbin: `${T}/kitbin`, tmp: `${T}/tmp`, conf: `${T}/conf`, remote: `${T}/srv/git/origin.git`, snapshot: `${T}/opt/pitwall/kit-gh` };
  for (const d of Object.values(P)) if (d !== P.remote && d !== P.snapshot) mkdirSync(d, { recursive: true });
  const put = (p, text, mode) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text, mode ? { mode } : undefined); };
  const { NODE_TEST_CONTEXT: _c, ...env0 } = process.env;   // with it, a nested `node --test` exits 0 whatever its tests do
  const sep = process.platform === 'win32' ? ';' : ':';
  const env = { ...env0, PATH: `${P.kitbin}${sep}${P.bin}${sep}${process.env.PATH}`, PITWALL_GH_STATE: `${P.tmp}/pitwall-gh-state.json`, PITWALL_RUNS_LOG: `${P.tmp}/pitwall-runs.log`,
    KIT_APP: P.app, KIT_ETC: P.kit, KIT_CONF: P.conf, KIT_REMOTE: P.remote, KIT_BIN: P.kitbin, KIT_OUT: `${P.logs}/${FACTS_FILE}`, KIT_LOCAL: '1',
    KIT_GH_SNAPSHOT: P.snapshot, PITWALL_GH_SNAPSHOT_DIR: P.snapshot, KIT_PATHS: `${P.tmp}/pitwall-kit-paths.z`, KIT_BASELINE: `${P.tests}/kit-baseline`,
    GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'agent', GIT_AUTHOR_EMAIL: 'agent@example.com', GIT_COMMITTER_NAME: 'agent', GIT_COMMITTER_EMAIL: 'agent@example.com' };
  const sh = (cwd, text) => spawnSync(bash, ['-c', text], { cwd, encoding: 'utf8', env, maxBuffer: 64 << 20 });
  try {
    // the image: stand-ins, the fixture repository (one commit, fixed date), the kit's setup
    put(`${P.bin}/gh`, localize(src('../../shims/gh'), T), 0o755);
    put(`${P.bin}/pitwall-mark-run`, localize(src('../../shims/mark-run.sh'), T), 0o755);
    put(`${P.bin}/pitwall-ran-on-final`, localize(src('../../shims/ran-on-final.sh'), T), 0o755);
    const d = '2026-01-05T10:00:00+00:00';
    let r;
    if (kase.history?.length || kase.layer) {
      // A staged history or a layer: the repository is built by the SAME build script the image runs (fixture.mjs
      // writeFixture: every commit replayed with its fixed author and date), so the commit ids are the image's.
      // A layer builds on the fixture's stand-in base tree (layer.localBase), committed here as the base image has it.
      const build = { ...env, GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'false', GIT_CONFIG_KEY_1: 'core.fileMode', GIT_CONFIG_VALUE_1: 'false' };
      for (const k of ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_NAME', 'GIT_COMMITTER_EMAIL']) delete build[k];
      const bsh = (cwd, text) => spawnSync(bash, ['-c', text], { cwd, encoding: 'utf8', env: build, maxBuffer: 64 << 20 });
      if (kase.layer) {
        if (!kase.layer.localBase) throw new Error(`${kase.id}: a layer case is run locally only with a stand-in base tree (fixture layer.local_base)`);
        cpSync(kase.layer.localBase, P.app, { recursive: true });
        r = bsh(P.app, `git init -q . && git add -A && GIT_AUTHOR_DATE='${d}' GIT_COMMITTER_DATE='${d}' git -c user.name=base -c user.email=base@example.com commit -q -m base`);
        if (r.status !== 0) throw new Error(`stand-in base tree: ${r.stderr}`);
      }
      writeFixture(`${T}/ctx`, kase);
      const script = localize(readFileSync(`${T}/ctx/fixture/build.sh`, 'utf8'), T).replace(/\/fixture\//g, `${T}/ctx/fixture/`);
      put(`${T}/ctx/build-local.sh`, script, 0o755);
      r = bsh(T, `bash '${T}/ctx/build-local.sh'`);
      if (r.status !== 0) throw new Error(`fixture build: ${r.stderr}`);
      r = sh(P.app, 'git config core.autocrlf false && git config core.fileMode false');
    } else {
      for (const [p, f] of Object.entries(fixtureState(kase))) put(`${P.app}/${p}`, f.text);
      r = sh(P.app, `git init -q . && git config core.autocrlf false && git config core.fileMode false && git add -A && GIT_AUTHOR_DATE='${d}' GIT_COMMITTER_DATE='${d}' git -c user.name=fixture -c user.email=fixture@example.com commit -q -m initial && git rev-parse HEAD > '${P.etc}/fixture-head'`);
    }
    if (r.status !== 0) throw new Error(`fixture repository: ${r.stderr}`);
    for (const [name, text] of Object.entries(kitConf(kase))) put(`${P.conf}/${name}`, text, 0o755);
    r = sh(P.app, `bash '${P.conf}/setup.sh'`);
    if (r.status !== 0) throw new Error(`kit-setup.sh: ${r.stderr}`);
    // the start facts, as kit-setup.sh left them. `baseline`: the verifier keeps its own copy (tests/kit-baseline),
    // as scaffoldTask({ baseline }) writes it for a Harbor task
    const startFacts = Object.fromEntries(readdirSync(P.kit, { withFileTypes: true }).filter((e) => e.isFile() && /-before$|-sha$/.test(e.name)).map((e) => [e.name, readFileSync(`${P.kit}/${e.name}`, 'utf8')]));
    if (baseline) for (const [name, text] of Object.entries(baseline === true ? startFacts : baseline)) put(`${P.tests}/kit-baseline/${name}`, text);
    // the agent's part
    const text = steps ?? (script ? kase.scripts?.[script] : null);
    if (script && text === undefined) throw new Error(`${kase.id}: no script ${script}`);
    const run = text ? sh(P.app, `set -u\n${localize(text, T)}\n`) : null;
    // the verifier: the task's tests/test.sh as scaffoldTask() leaves it, its checks, the kit's capture
    put(`${P.tests}/test.sh`, localize(patchTestSh(src('../runners/state-capture.sh'), { layer: !!kase.layer }), T), 0o755);
    put(`${P.tests}/kit-capture.sh`, KIT_CAPTURE, 0o755);
    if (kase.checks) put(`${P.tests}/checks.sh`, localize(checksScript(kase.checks), T), 0o755);
    const v = sh(T, `bash '${P.tests}/test.sh'`);
    const state = readState(`${P.logs}/state.json`);
    const capture = readKitFacts(`${P.logs}/${FACTS_FILE}`);
    return {
      case: kase.id, trial: 1, error: null, native: {}, state, harborTrial: 'local',
      trajectory: script || steps || !text ? { steps: [], final_message: '', agent: { name: `script:${script ?? 'local'}`, version: null }, extra: { pitwall: {} } } : null,
      kit_facts: { schema: 1, capture, originals: null, originals_dropped: [], final_result: null, trial_dir_found: true },
      local: { dir: keep ? T : null, paths: keep ? P : null, start_facts: startFacts, script_exit: run?.status ?? null, script_stdout: (run?.stdout ?? '').slice(-8000), script_stderr: (run?.stderr ?? '').slice(-2000), verifier_exit: v.status, verifier_stderr: (v.stderr ?? '').slice(-2000) },
    };
  } finally { if (!keep) rmSync(T, { recursive: true, force: true }); }
}
