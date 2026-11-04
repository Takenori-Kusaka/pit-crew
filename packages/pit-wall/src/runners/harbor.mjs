// Runner adapter: Harbor (harbor-framework/harbor, Apache-2.0), Docker sandbox.
// compile(): writes each case as a Harbor task under <armDir>/harbor-tasks/<case>.
// run():     `harbor run` for one arm and case; returns per-run records
//            { case, trial, trajectory, native: {}, error }.
//
// Differences from claude-plugin-eval that matter for fairness are pinned here:
// max turns, permission mode and allowed tools. The Claude Code version is recorded,
// and pinned only on request (PITWALL_PIN_LOCAL_VERSION / PITWALL_CLAUDE_VERSION). The container has no real `gh`, so the
// stand-in cannot be bypassed.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { admit, DEFAULTS as ADMISSION, readHost } from './admission.mjs';
import { acquire } from './heavy-lock.mjs';
import { normalizeAtif } from '../normalize/atif.mjs';
import { preflight } from './claude-plugin-eval.mjs';
import { resolveImage } from '../images.mjs';
import { writeFixture } from '../fixture.mjs';

export const SHIMS = ['gh'];
export const NOISE = [];
export const SCRIPTED = true; // supports script:<name> arms (Harbor's oracle agent)

function taskToml(c) {
  return `schema_version = "1.4"
artifacts = []

[task]
name = "pitwall/${c.id}"
version = "1.0.0"
description = ""
authors = []
keywords = []

[metadata]

[verifier]
timeout_sec = 120.0
environment_mode = "shared"
collect = []

[verifier.env]

[agent]
timeout_sec = 900.0

[environment]
network_mode = "public"
build_timeout_sec = 900.0
os = "linux"
mcp_servers = []

[environment.env]

[solution.env]
`;
}

// Per-task image: the agent image (docker/agent-claude-code) plus the case fixture,
// replayed as a dated git history (fixture.mjs). A git identity is set so that an
// agent's own commit works as in a developer's checkout (without it, `git commit`
// failed with "Author identity unknown" in the 2026-11-01 preflight).
// A harness's agent definitions go where a project keeps them (/app/.claude/agents),
// hidden from git so they are not part of the fixture's history or the agent's diff.
// Harbor only registers skills (--skill); without this, role agents were unavailable
// in the 2026-11-01 v0 runs.
// env: settings for the agent process given by the case (e.g. Claude Code's auto-compact
// window, to make compaction happen in a short task: EXP-19 saw none in 18 runs).
// workspace: files a harness keeps in the project's tree (an arm's `workspace/` directory, e.g.
// the documents a project's skills point to, such as docs/sessions/*). They are copied into /app
// and each file is hidden from git, so they are not part of the fixture's history and other arms
// do not see them (owner 2026-11-03: the GQ harness copied whole into another project).
const dockerfile = (base, agents = false, env = {}, workspace = []) => `FROM ${base}
COPY gh /usr/local/bin/gh
COPY pitwall-mark-run /usr/local/bin/pitwall-mark-run
COPY pitwall-ran-on-final /usr/local/bin/pitwall-ran-on-final
COPY fixture/ /fixture/
RUN chmod 755 /usr/local/bin/gh /usr/local/bin/pitwall-mark-run /usr/local/bin/pitwall-ran-on-final && bash /fixture/build.sh && rm -rf /fixture \\
 && git config --system user.name agent && git config --system user.email agent@example.com
${agents ? 'COPY harness-agents/ /app/.claude/agents/\nRUN echo ".claude/" >> /app/.git/info/exclude\n' : ''}${workspace.length ? `COPY harness-workspace/ /app/\nRUN printf '%s\\n' ${workspace.map((p) => `'${p}'`).join(' ')} >> /app/.git/info/exclude\n` : ''}${Object.entries(env).map(([k, v]) => `ENV ${k}=${JSON.stringify(String(v))}\n`).join('')}WORKDIR /app
`;

// Relative paths (with /) of the files under a directory, sorted.
export const listFiles = (root, rel = '') => readdirSync(join(root, rel), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? listFiles(root, rel ? `${rel}/${e.name}` : e.name) : [rel ? `${rel}/${e.name}` : e.name])).sort();
export { dockerfile };

// Each check runs in /app with a time limit; its command is passed base64-encoded so
// that no quoting in the case can break the script.
const checksScript = (checks) => ['#!/bin/bash', ...Object.entries(checks).map(([n, cmd]) =>
  `echo ${Buffer.from(cmd).toString('base64')} | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\\t%s\\n' '${n}' "$?"`)].join('\n') + '\n';

const STATE_CAPTURE = readFileSync(new URL('./state-capture.sh', import.meta.url), 'utf8');
// Marks runs of a project's documented commands (README "Judge by effects").
const MARK_RUN = readFileSync(new URL('../../shims/mark-run.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
// For checks: did a marked command run, and pass, on the final working tree.
const RAN_ON_FINAL = readFileSync(new URL('../../shims/ran-on-final.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// script: the scripted control to run instead of a model (Harbor's oracle agent runs
// solution/solve.sh). Cases without that script are skipped for the arm.
export function compile(armDir, cases, { appendSystemPrompt, script = null, entry = null } = {}) {
  const image = resolveImage('claude-code');
  const shim = cases.some((c) => c.needsShell) ? preflight() : null;
  const root = join(armDir, 'harbor-tasks');
  rmSync(root, { recursive: true, force: true });
  for (const c of cases) {
    if (script && !c.scripts?.[script]) continue;
    const dir = join(root, c.id);
    mkdirSync(join(dir, 'environment'), { recursive: true });
    mkdirSync(join(dir, 'tests'), { recursive: true });
    writeFileSync(join(dir, 'task.toml'), taskToml(c));
    writeFileSync(join(dir, 'instruction.md'), `${entry ? `${entry} ` : ''}${c.prompt}\n`);
    const agents = join(armDir, 'agents');
    const hasAgents = !script && existsSync(agents) && readdirSync(agents).some((n) => n.endsWith('.md'));
    if (hasAgents) cpSync(agents, join(dir, 'environment', 'harness-agents'), { recursive: true });
    const ws = join(armDir, 'workspace');
    const wsFiles = !script && existsSync(ws) ? listFiles(ws) : [];
    if (wsFiles.length) cpSync(ws, join(dir, 'environment', 'harness-workspace'), { recursive: true });
    writeFileSync(join(dir, 'environment', 'Dockerfile'), dockerfile(image.ref, hasAgents, script ? {} : (c.agentEnv ?? {}), wsFiles));
    writeFileSync(join(dir, 'environment', 'gh'), shim ?? '#!/bin/sh\nexit 127\n', { mode: 0o755 });
    writeFileSync(join(dir, 'environment', 'pitwall-mark-run'), MARK_RUN, { mode: 0o755 });
    writeFileSync(join(dir, 'environment', 'pitwall-ran-on-final'), RAN_ON_FINAL, { mode: 0o755 });
    writeFixture(join(dir, 'environment'), c);
    // pit-wall grades the trajectory and the captured state; the Harbor reward only
    // records that the run ended.
    writeFileSync(join(dir, 'tests', 'test.sh'), STATE_CAPTURE, { mode: 0o755 });
    if (c.checks) writeFileSync(join(dir, 'tests', 'checks.sh'), checksScript(c.checks), { mode: 0o755 });
    if (script) {
      mkdirSync(join(dir, 'solution'), { recursive: true });
      writeFileSync(join(dir, 'solution', 'solve.sh'), `#!/bin/bash\nset -u\ncd /app\n${c.scripts[script]}\n`, { mode: 0o755 });
    }
  }
  writeFileSync(join(root, '.append-system-prompt'), appendSystemPrompt ?? '');
  writeFileSync(join(root, '.agent-image'), JSON.stringify(image));
  writeFileSync(join(root, '.script'), script ?? '');
}

function localClaudeVersion(claude) {
  const r = spawnSync(claude, ['--version'], { encoding: 'utf8' });
  return (r.stdout.match(/\d+\.\d+\.\d+/) ?? [null])[0];
}

// Harbor walks the task directory and writes the job tree for every trial. On a Windows drive
// mounted into WSL (/mnt/<x>) that is slow in proportion to the number of files (job start 19 s
// for 20 files, 230 s for 137; docs/research/research-eval-parallelism.md). So, when the run
// directory is on such a mount, the tasks are copied to the Linux file system, Harbor runs there,
// and the finished job tree is copied back to where the records and analyses expect it.
// PITWALL_STAGE_DIR picks the staging root; PITWALL_STAGE=0 turns staging off.
export function stage(taskRoot, caseGlob, jobs) {
  const off = process.env.PITWALL_STAGE === '0' || !/^\/mnt\/[a-z]\//.test(taskRoot);
  if (off) return { task: join(taskRoot, caseGlob), jobs, finish: () => {} };
  const root = process.env.PITWALL_STAGE_DIR ?? join(homedir(), '.cache', 'pit-wall', 'stage');
  // A run that died midway leaves its staging behind; remove those whose process is gone.
  for (const d of existsSync(root) ? readdirSync(root) : []) {
    const pid = Number(d.split('-')[0]);
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch { /* gone */ }
    if (!alive) rmSync(join(root, d), { recursive: true, force: true });
  }
  const base = join(root, `${process.pid}-${Date.now()}`);
  cpSync(taskRoot, join(base, 'tasks'), { recursive: true });
  return {
    task: join(base, 'tasks', caseGlob),
    jobs: join(base, 'jobs'),
    finish: () => {
      if (existsSync(join(base, 'jobs'))) cpSync(join(base, 'jobs'), jobs, { recursive: true });
      rmSync(base, { recursive: true, force: true });
    },
  };
}

// Harbor's -n. Default (since 2026-11-03, after the A/A checks in experiments/perf): it is
// decided from the host at job start (admission.mjs), each container gets a hard memory limit, and
// a watchdog stops the job if memory stays short. PITWALL_ADMISSION=0 restores the fixed 3 used by
// the runs before that date. PITWALL_HARBOR_CONCURRENCY always wins. Each record keeps runConditions.
export function concurrencyPlan(env = process.env, host = null) {
  if (env.PITWALL_HARBOR_CONCURRENCY) return { n: Number(env.PITWALL_HARBOR_CONCURRENCY), mode: 'fixed' };
  if (env.PITWALL_ADMISSION === '0') return { n: 3, mode: 'default' };
  const a = admit(host ?? readHost());
  if (a.n < 1) throw new Error(`not started: ${a.reason} (available ${a.avail} MiB, reserve ${a.reserve} MiB)`);
  return { ...a, mode: 'admission', limitMiB: Number(env.PITWALL_MEM_LIMIT_MIB ?? ADMISSION.limitMiB) };
}

// A refused start is usually transient (Windows briefly short while the page cache is held): give
// the cache back, wait a minute and ask again, up to PITWALL_ADMISSION_WAIT_MIN minutes (default 10).
// EXP-32 lost a whole cell (10 trials) when one refusal ended the run with no record (2026-11-04).
export function admitWithRetry(env = process.env, { plan = concurrencyPlan, sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms), drop = () => spawnSync('sudo', ['-n', '/usr/local/sbin/pitwall-drop-caches']) } = {}) {
  const tries = Math.max(1, Number(env.PITWALL_ADMISSION_WAIT_MIN ?? 10));
  for (let i = 1; ; i++) {
    try { return plan(env); } catch (e) {
      if (!/^not started/.test(e.message) || i >= tries) throw e;
      process.stderr.write(`${e.message}; dropping the page cache and asking again in 60 s (${i}/${tries})\n`);
      drop();
      sleep(60000);
    }
  }
}

function harbor(args, plan, opts, watchLog) {
  const full = plan.mode === 'admission' ? [...args, '--memory', 'limit', '--override-memory-mb', String(plan.limitMiB)] : args;
  const dog = plan.mode === 'admission'
    ? spawn(process.execPath, [fileURLToPath(new URL('./watchdog.mjs', import.meta.url)), String(plan.reserve), String(process.pid), watchLog], { stdio: 'ignore' })
    : null;
  try {
    const r = spawnSync(process.env.PITWALL_HARBOR ?? 'harbor', full, opts);
    if (watchLog && existsSync(watchLog) && readFileSync(watchLog, 'utf8').includes('STOPPED')) throw new Error(`stopped by the watchdog (memory short), run incomplete: ${watchLog}`);
    return r;
  } finally { dog?.kill(); }
}

// One heavy job per host (heavy-lock.mjs): a Harbor run does not start while a local judge or
// another Harbor run holds the lock.
// Harbor keeps the agent's whole ~/.claude as agent/sessions/. Only the conversation transcripts
// (projects/) are evidence; the rest is Claude Code's own state (.claude.json, policy-limits
// signatures, remote settings, backups, debug logs), which carries account, organisation and machine
// ids (found by the publication check, 2026-11-04). Drop it from every job before it is kept.
export function pruneSessionState(jobsDir) {
  if (!existsSync(jobsDir)) return 0;
  let removed = 0;
  const walkDirs = (d, depth) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = join(d, e.name);
      if (e.name === 'sessions' && d.endsWith('agent')) {
        for (const s of readdirSync(p)) if (s !== 'projects') { rmSync(join(p, s), { recursive: true, force: true }); removed++; }
      } else if (depth < 4) walkDirs(p, depth + 1);
    }
  };
  walkDirs(jobsDir, 0);
  return removed;
}

export function run(armDir, opts) {
  const release = acquire(`harbor ${opts.caseGlob}`);
  try { return runLocked(armDir, opts); } finally { release(); }
}

function runLocked(armDir, { trials, model, outJson, needsShell, caseGlob, maxTurns = 12, writable, shell = 'listed' }) {
  const jobs = `${outJson.replace(/\.json$/, '')}-jobs`;
  const st = stage(join(armDir, 'harbor-tasks'), caseGlob, jobs);
  const task = st.task;
  const claude = process.env.PITWALL_CLAUDE ?? 'claude';
  // Normally the latest version runs and is recorded on each record. Pin only when
  // comparing runners, where the version would otherwise confound the comparison.
  const version = process.env.PITWALL_CLAUDE_VERSION ?? (process.env.PITWALL_PIN_LOCAL_VERSION ? localClaudeVersion(claude) : null);
  const plan = admitWithRetry();
  const concurrency = String(plan.n);
  const watchLog = plan.mode === 'admission' ? `${outJson.replace(/\.json$/, '')}-watchdog.log` : null;
  const conditions = { concurrency: plan.n, concurrencyMode: plan.mode, ...(plan.mode === 'admission' ? { memLimitMiB: plan.limitMiB, availAtStartMiB: plan.avail, reserveMiB: plan.reserve } : {}) };
  const script = readFileSync(join(armDir, 'harbor-tasks', '.script'), 'utf8');
  if (script) {
    // Scripted control: no model, no token. Harbor's oracle agent runs solution/solve.sh.
    if (!existsSync(task)) { st.finish(); return { records: [], claudeVersion: null }; }
    let r;
    try { r = harbor(['run', '-p', task, '-a', 'oracle', '-k', String(trials), '-n', concurrency, '-o', st.jobs], plan, { encoding: 'utf8', maxBuffer: 64 << 20 }, watchLog); } finally { st.finish(); }
    const job = existsSync(jobs) ? readdirSync(jobs).map((d) => join(jobs, d)).sort().pop() : null;
    if (!job) throw new Error(`harbor wrote no job (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
    const res = collect(job, caseGlob, { scripted: script });
    for (const x of res.records) x.runConditions = conditions;
    return res;
  }
  // shell 'open': the agent has a developer's shell and editors. Nothing is prevented;
  // tampering is detected on the end state instead. A listed shell refused ordinary
  // read-only investigation (`grep ... | head`) in the 2026-11-01 pilot, so for state-
  // graded cases the allow-list distorted the measurement rather than guarding it.
  // Web tools: every arm can research the world (owner 2026-11-03: until then no arm could, so a
  // harness's "research first" rule could not show). PITWALL_WEB=0 restores the earlier list; it
  // changes only the permission list: WebFetch could still be called without it (check-web-off).
  const web = process.env.PITWALL_WEB === '0' ? [] : ['WebSearch', 'WebFetch'];
  const tools = shell === 'open' ? ['Read', 'Glob', 'Grep', 'Skill', 'Bash', 'Edit', 'Write', ...web]
    : ['Read', 'Glob', 'Grep', 'Skill', ...(needsShell ? ['Bash(gh *)', 'Bash(git *)', 'Bash(ls *)', 'Bash(cat *)'] : []), ...(writable ?? []).flatMap((g) => [`Edit(${g})`, `Write(${g})`])];
  const args = ['run', '-p', task, '-a', 'claude-code', '-k', String(trials), '-n', concurrency, '-o', st.jobs,
    '--ak', `max_turns=${maxTurns}`, '--ak', 'permission_mode=dontAsk', '--ak', `allowed_tools=${tools.join(',')}`];
  if (model) args.push('-m', `anthropic/${model}`);
  if (version) args.push('--ak', `version=${version}`); // must match the agent image, or Harbor reinstalls
  const skills = join(armDir, 'skills');
  if (existsSync(skills)) args.push('--skill', skills);
  const append = readFileSync(join(armDir, 'harbor-tasks', '.append-system-prompt'), 'utf8');
  if (append) args.push('--ak', `append_system_prompt=${append}`);

  // Subscription OAuth only: the token is read from a 600 file and passed through
  // the environment (never argv), and any API key is removed.
  const tokenFile = process.env.PITWALL_OAUTH_TOKEN_FILE ?? join(homedir(), '.config', 'pit-wall', 'oauth-token');
  const env = { ...process.env, CLAUDE_FORCE_OAUTH: '1', CLAUDE_CODE_OAUTH_TOKEN: readFileSync(tokenFile, 'utf8').trim() };
  delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN;
  let r;
  try { r = harbor(args, plan, { env, encoding: 'utf8', maxBuffer: 64 << 20 }, watchLog); } finally { st.finish(); pruneSessionState(jobs); }
  const job = existsSync(jobs) ? readdirSync(jobs).map((d) => join(jobs, d)).sort().pop() : null;
  if (!job) throw new Error(`harbor wrote no job (exit ${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
  const res = collect(job, caseGlob);
  const image = JSON.parse(readFileSync(join(armDir, 'harbor-tasks', '.agent-image'), 'utf8'));
  // The tool permissions are part of the conditions the run measured under.
  for (const r of res.records) { r.agentImage = image; r.allowedTools = tools; r.runConditions = conditions; }
  return res;
}

// state.json written by state-capture.sh -> { files: {path: {sha256, text}}, git }
export function readState(file) {
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const files = Object.fromEntries(Object.entries(raw.files).map(([p, f]) => [p, { sha256: f.sha256, text: f.b64 ? Buffer.from(f.b64, 'base64').toString('utf8') : null }]));
  const log = Buffer.from(raw.git.log_b64 ?? '', 'base64').toString('utf8').split('\n').filter(Boolean)
    .map((l) => { const [sha, date, ...msg] = l.split(' '); return { sha, date, message: msg.join(' ') }; });
  const gh = Buffer.from(raw.commands?.gh_b64 ?? '', 'base64').toString('utf8').split('\n').filter(Boolean);
  const checks = Object.fromEntries(Buffer.from(raw.checks_b64 ?? '', 'base64').toString('utf8').split('\n').filter(Boolean)
    .map((l) => { const [n, code] = l.split('\t'); return [n, Number(code)]; }));
  const ghs = ghState(raw.commands);
  // Runs of documented commands (shims/mark-run.sh): { name, ts, code, tree }, tree = the
  // working tree's content hash when the run was recorded (null when unavailable, or the log
  // predates trees). runs is null when the capture predates runs.
  const runs = raw.runs_b64 === undefined ? null : lines(raw.runs_b64)
    .map((l) => { const [name, ts, code, tree] = l.split('\t'); return { name, ts, code: Number(code), tree: tree || null }; });
  // The final working tree, hashed the same way (null when unavailable or the capture predates it).
  const finalTree = raw.finalTree || null;
  return { files, git: { head: raw.git.head, fixtureHead: raw.git.fixtureHead, fixtureIntact: raw.git.fixtureIntact, log }, commands: { gh }, gh: ghs.state, ghUnparsed: ghs.unparsed, runs, finalTree, checks, oomKills: raw.oomKills ?? null };
}

// Did the documented command `name` run AFTER the last change, on the final working tree, and
// pass? true: some run of it recorded the final tree with exit 0. false: it never ran, or every
// passing run was on another tree. null: undecidable (final tree unknown, runs not captured, or
// a passing run without a tree). Same answer as shims/ran-on-final.sh. Takes a record or a state.
export function ranOnFinal(record, name) {
  const st = record && 'state' in record ? record.state : record;
  if (!st?.runs || !st.finalTree) return null;
  let unknown = false;
  for (const r of st.runs) {
    if (r.name !== name || r.code !== 0) continue;
    if (r.tree === st.finalTree) return true;
    if (!r.tree) unknown = true;
  }
  return unknown ? null : false;
}

// The gh state a run starts from (no call yet), as shims/gh writes it.
export const EMPTY_GH_STATE = Object.freeze({ items: {}, created: { pullRequests: [], issues: [] } });
const lines = (b64) => Buffer.from(b64 ?? '', 'base64').toString('utf8').split('\n').filter(Boolean);
// Effects of the gh calls (shims/gh). null when the capture predates them or the file is
// unreadable; the empty state when no gh call was made.
function ghState(commands = {}) {
  if (commands.gh_state_b64 === undefined) return { state: null, unparsed: null };
  const unparsed = lines(commands.gh_unparsed_b64).map((l) => { const i = l.indexOf('\t'); return { reason: l.slice(0, i), call: l.slice(i + 1) }; });
  if (!commands.gh_state_b64) return { state: structuredClone(EMPTY_GH_STATE), unparsed };
  try { return { state: JSON.parse(Buffer.from(commands.gh_state_b64, 'base64').toString('utf8')), unparsed }; } catch { return { state: null, unparsed }; }
}

// The agent's own final result event (Claude Code stream-json): why it stopped, so that
// validity can tell an agent limit (max turns, compaction thrash) from a runner failure.
export function agentStop(trialDir) {
  const f = join(trialDir, 'agent', 'claude-code.txt');
  if (!existsSync(f)) return null;
  let last = null;
  for (const l of readFileSync(f, 'utf8').split('\n')) {
    if (!l.includes('"type":"result"')) continue;
    try { const e = JSON.parse(l); if (e.type === 'result') last = { subtype: e.subtype ?? null, text: String(e.result ?? '').slice(0, 200) }; } catch { /* partial line */ }
  }
  return last;
}

// Records stored before agentStop existed: fill it from the trial dirs under a run dir.
export function backfill(records, runDir) {
  const dirs = new Map();
  const walk = (d, depth) => { for (const n of readdirSync(d, { withFileTypes: true })) if (n.isDirectory()) {
    const p = join(d, n.name);
    if (existsSync(join(p, 'result.json')) && existsSync(join(p, 'agent'))) dirs.set(n.name, p); else if (depth < 4) walk(p, depth + 1);
  } };
  walk(runDir, 0);
  return records.map((r) => (r.agentStop === undefined && dirs.has(r.harborTrial) ? { ...r, agentStop: agentStop(dirs.get(r.harborTrial)) } : r));
}

export function collect(jobDir, caseId, { scripted = null } = {}) {
  const trials = readdirSync(jobDir).filter((d) => existsSync(join(jobDir, d, 'result.json'))).sort();
  const records = trials.map((d, i) => {
    const res = JSON.parse(readFileSync(join(jobDir, d, 'result.json'), 'utf8'));
    const tf = join(jobDir, d, 'agent', 'trajectory.json');
    // A scripted control has no model and no trajectory: graded on state alone.
    const trajectory = existsSync(tf) ? normalizeAtif(JSON.parse(readFileSync(tf, 'utf8')))
      : scripted ? { steps: [], final_message: '', agent: { name: `script:${scripted}`, version: null }, extra: { pitwall: {} } } : null;
    const state = readState(join(jobDir, d, 'verifier', 'state.json'));
    const ex = res.exception_info;
    return {
      case: caseId,
      trial: i + 1,
      error: ex ? `${ex.exception_type ?? 'exception'}: ${String(ex.exception_message ?? '').slice(0, 200)}` : null,
      native: {},
      trajectory,
      state,
      costUsd: trajectory?.extra.pitwall.cost_usd ?? null,
      harborTrial: d,
      agentStop: agentStop(join(jobDir, d)),
    };
  });
  const v = records.find((r) => r.trajectory)?.trajectory.agent.version ?? null;
  return { records, claudeVersion: v };
}
