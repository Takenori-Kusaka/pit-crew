// The release gate's files and runs (W4 #98): the run directory, one saved record per trial, the guards
// before each trial, grading from the saved records, and the numbered ledger of gate runs.
// Only runTrial() and the guards touch docker / the host; everything else works on saved files, so the
// gate can be graded again (and tested) without a model.
//
// <run dir>/run.json                                   what was fixed for this run
// <run dir>/trials/<phase>/<arm>/<case>/t<k>.json      one saved trial (the Harbor record, whole, and beside it
//                                                      `record.kit_facts`: kit/schema/trial-record.md)
// <run dir>/trials/<phase>/<arm>/<case>/t<k>.started   written before the trial starts; a trial that was
//                                                      started and has no record is an infrastructure failure
// <run dir>/raw/                                       Harbor's own job trees
// <run dir>/graded.json, verdict.json, verdict.md      written by gradeRunDir() + writeGrading()
// <run dir>/regrade/verdict.json, verdict.md (, graded.json)   the same, when the digests recorded in run.json do
//                                                      not match the files now: marked, and never a gate result
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { collectKitFacts, scaffoldTask } from './capture.mjs';
import { grade } from './grader.mjs';
import { scrubHome } from './scrub-home.mjs';
import { controlAsExpected, harborCases, kitRun, simulatedRun } from './harbor-cases.mjs';
import { MARK, gateVerdict, noGateVerdict, notAGateResult, renderNoGateRun, renderNotAGateResult, renderVerdict, screenVerdict, tableUnits } from './release-gate.mjs';

export const MODEL = 'claude-fable-5-2';           // owner 2026-11-15: the gate's model is fixed
export const MIN_FREE_MIB = 6 * 1024;              // do not start a docker job with less available memory
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
// every record and result is written without the local home path (scrub-home.mjs: the repository is public)
const put = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, `${JSON.stringify(scrubHome(v), null, 1)}\n`); };
const git = (root, args) => { try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const safe = (s) => String(s).replace(/[^\w.-]/g, '_');

// ---- cases ------------------------------------------------------------------------------------------------
export function loadCases(root, role, fixtures) {
  const specPath = join(root, 'kit/roles', `${role}.yaml`);
  let spec = null; const cases = [];
  for (const f of fixtures) { const r = harborCases(specPath, resolve(root, f)); spec = r.spec; cases.push(...r.cases); }
  const dup = cases.map((c) => c.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (dup.length) throw new Error(`duplicate case ids: ${dup.join(', ')}`);
  return { spec, cases, byId: Object.fromEntries(cases.map((c) => [c.id, c])) };
}
// No contract-case table yet (W1 writes it): every case is treated as a rule case, the strictest kind, and
// the run is marked provisional. A provisional run is not a release gate: its verdict says so, it gives no
// sentence for a public text, and the ledger keeps the mark.
export const defaultTable = (cases) => ({ provisional: true, cases: cases.map((c) => ({ id: c.id, kind: 'rule' })) });

// ---- what is fixed per run ---------------------------------------------------------------------------------
export function graderCommit(root, role) {
  const paths = ['packages/pit-wall/src/kit/grader.mjs', `kit/roles/${role}.yaml`];
  return { commit: git(root, ['log', '-1', '--format=%H', '--', ...paths]), dirty: !!git(root, ['status', '--porcelain', '--', ...paths]) };
}
export function harnessVersion(root, harness) {
  if (!harness) return { version: null, dirty: false };
  const rel = relative(root, resolve(root, harness)).replace(/\\/g, '/');
  const tree = git(root, ['rev-parse', `HEAD:${rel}`]);
  const dirty = !!git(root, ['status', '--porcelain', '--', rel]);
  return { version: tree ? `${rel}@${tree.slice(0, 12)}${dirty ? '+dirty' : ''}` : `${rel}@untracked`, dirty: dirty || !tree };
}
export const rulesDigest = (root) => createHash('sha256').update(readFileSync(join(root, 'kit/release-rules.json'))).digest('hex').slice(0, 16);

// ---- what is fixed per run, by content ------------------------------------------------------------------
// kit/release-rules.json `change_rule` and §1.5: the table, the case kinds and the rules are fixed before the first
// trial and are not changed after results. The run record therefore holds, from before the first trial (the scripted
// controls included), the sha256 of every file a grade is computed from. A grade made from other files than the
// recorded ones is marked (MARK) and is never a gate result.
//   files.table        the contract-case table that was read ([] = none: a provisional run, or a probe)
//   files.rules        kit/release-rules.json
//   files.role_spec    kit/roles/<role>.yaml
//   files.fixtures     <fixture>/fixture.yaml of every fixture of the run, in the run's order
//   files.grader       the grader, its predicates, and the reading of a saved record into the grader's input
//   files.gate_script  the gate's arithmetic, its files-and-runs module, and the command
//   harness            { path, version (tree id), commit (the last commit that touched it), dirty } or null
//   head, grader_commit   the commit of the checkout, and the last commit that touched files.grader
// Every entry of `files` is { path, sha256 } (path relative to the repository; absolute when outside it).
export const GRADER_FILES = ['packages/pit-wall/src/kit/grader.mjs', 'packages/pit-wall/src/kit/predicates.mjs', 'packages/pit-wall/src/kit/harbor-cases.mjs'];
export const GATE_FILES = ['packages/pit-wall/src/kit/release-gate.mjs', 'packages/pit-wall/src/kit/gate-run.mjs', 'scripts/release-gate.mjs'];
export const DIGEST_KINDS = ['table', 'rules', 'role_spec', 'fixtures', 'grader', 'gate_script'];
const fileSha = (p) => (existsSync(p) && statSync(p).isFile() ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
const shown = (root, p) => { const abs = resolve(root, p), rel = relative(root, abs); return (rel.startsWith('..') || isAbsolute(rel) ? abs : rel).replace(/\\/g, '/'); };
export function runDigests(root, { role, fixtures = [], table = null, harness = null }) {
  const f = (p) => ({ path: shown(root, p), sha256: fileSha(resolve(root, p)) });
  const hv = harnessVersion(root, harness), hrel = harness ? shown(root, harness) : null;
  return { schema: 1, head: git(root, ['rev-parse', 'HEAD']),
    files: { table: table ? [f(table)] : [], rules: [f('kit/release-rules.json')], role_spec: [f(`kit/roles/${role}.yaml`)], fixtures: fixtures.map((x) => f(join(x, 'fixture.yaml'))), grader: GRADER_FILES.map(f), gate_script: GATE_FILES.map(f) },
    grader_commit: git(root, ['log', '-1', '--format=%H', '--', ...GRADER_FILES]),
    harness: harness ? { path: hrel, version: hv.version, commit: isAbsolute(hrel) ? null : git(root, ['log', '-1', '--format=%H', '--', hrel]), dirty: hv.dirty } : null };
}
// one value for the whole of `files` (the ledger row of a gate run keeps it, beside the run directory's own record)
export const digestOfDigests = (d) => createHash('sha256').update(JSON.stringify(DIGEST_KINDS.map((k) => (d?.files?.[k] ?? []).map((x) => [x.path, x.sha256])))).digest('hex');
// The recorded files that no commit holds as they are now: missing, outside the repository, not tracked, or changed
// (in the working tree or in the index). -> [{ kind, path, why }]. A run is not started while this is not empty:
// every recorded digest must be the content of a commit.
export function uncommitted(root, digests) {
  const out = [], inRepo = [];
  for (const kind of DIGEST_KINDS) for (const x of digests.files[kind] ?? []) {
    if (x.sha256 === null) out.push({ kind, path: x.path, why: 'the file is missing' });
    else if (isAbsolute(x.path)) out.push({ kind, path: x.path, why: 'outside the repository (no commit holds it)' });
    else inRepo.push({ kind, path: x.path });
  }
  if (!inRepo.length) return out;
  const raw = (args) => { try { return execFileSync('git', ['-C', root, '-c', 'core.quotepath=false', ...args, '--', ...inRepo.map((x) => x.path)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
  const tracked = raw(['ls-files']), status = raw(['status', '--porcelain']);
  if (tracked === null || status === null) return [...out, ...inRepo.map((x) => ({ ...x, why: 'git could not be read here (not a checkout?)' }))];
  const T = new Set(tracked.split('\n').filter(Boolean));
  const S = new Map(status.split('\n').filter(Boolean).map((l) => [l.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''), l.slice(0, 2).trim()]));
  for (const x of inRepo) {
    if (!T.has(x.path)) out.push({ ...x, why: 'not tracked by git' });
    else if (S.has(x.path)) out.push({ ...x, why: `uncommitted change (${S.get(x.path)})` });
  }
  return out;
}
// The recorded digests against the files now. -> { match, recorded (were digests recorded at all), differences }
// differences: [{ kind, path, recorded_path, recorded, now }] (sha256 or null), or { kind: 'record', what }.
// A file is the same when its sha256 is the same (the path may differ: a copy of the table is the table).
export function compareDigests(recorded, now) {
  if (!recorded?.files) return { match: false, recorded: false, differences: [{ kind: 'record', what: 'the run record holds no digests: it was not written by a run that fixed its files before the first trial' }] };
  const differences = [];
  for (const kind of DIGEST_KINDS) {
    const a = recorded.files[kind] ?? [], b = now.files[kind] ?? [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i]?.sha256 && a[i].sha256 === b[i]?.sha256) continue;
      differences.push({ kind, path: b[i]?.path ?? a[i]?.path ?? null, recorded_path: a[i]?.path ?? null, recorded: a[i]?.sha256 ?? null, now: b[i]?.sha256 ?? null });
    }
  }
  return { match: differences.length === 0, recorded: true, differences };
}

// ---- the ledger of gate runs: every run gets the next number, pass or fail -------------------------------
export const ledgerPath = (root, role) => join(root, 'kit/results/gate', role, 'ledger.json');
export function readLedger(root, role) { const p = ledgerPath(root, role); return existsSync(p) ? json(p) : { role, runs: [] }; }
export function allocateRun(root, role, entry) {
  const led = readLedger(root, role);
  const run = (led.runs.at(-1)?.run ?? 0) + 1;
  led.runs.push({ run, status: 'started', ...entry });
  put(ledgerPath(root, role), led);
  return run;
}
export function closeRun(root, role, run, fields) {
  const led = readLedger(root, role);
  const row = led.runs.find((r) => r.run === run);
  if (!row) throw new Error(`run ${run} is not in the ledger`);
  Object.assign(row, fields);
  put(ledgerPath(root, role), led);
  return led;
}

// ---- guards ------------------------------------------------------------------------------------------------
export function memAvailableMiB(meminfo = existsSync('/proc/meminfo') ? readFileSync('/proc/meminfo', 'utf8') : null) {
  const m = meminfo?.match(/^MemAvailable:\s+(\d+)\s*kB/m);
  return m ? Math.floor(Number(m[1]) / 1024) : null;
}
// The 7-day quota: experiments/quota.sh (the stop line and the reading are its; exit 3 = over the line).
export function quotaReading(root) {
  const r = spawnSync('bash', [join(root, 'experiments/quota.sh')], { encoding: 'utf8', env: { ...process.env, QUOTA_ROOT: process.env.QUOTA_ROOT ?? join(root, 'runs') } });
  if (r.error || r.status === null) return { ok: false, reading: null, text: `quota.sh did not run: ${r.error?.message ?? 'no status'}` };
  const m = (r.stdout ?? '').match(/\(last reading\) (\S+),/);
  return { ok: r.status === 0, reading: m ? m[1] : null, text: (r.stdout ?? '').trim().split('\n').pop() };
}
// Asked before EVERY trial. Refuses (never waits, never retries) when memory is short, the quota is over
// its line, or either cannot be read.
export function guard(root, { minMiB = MIN_FREE_MIB, mem = memAvailableMiB(), quota = quotaReading(root) } = {}) {
  if (mem === null) return { ok: false, why: 'available memory cannot be read (the gate runs on Linux / WSL)', mem, quota };
  if (mem < minMiB) return { ok: false, why: `available memory ${mem} MiB < ${minMiB} MiB`, mem, quota };
  if (!quota.ok) return { ok: false, why: `7-day quota: ${quota.text}`, mem, quota };
  return { ok: true, mem, quota };
}
// The last 7-day utilization a trial's own files carry (Claude Code's rate_limit_event), or null.
export function lastUtilization(dir) {
  let best = null;
  const walk = (d, depth) => {
    for (const e of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (depth < 8) walk(p, depth + 1); continue; }
      const st = statSync(p);
      if (st.size > 64 << 20) continue;
      const all = readFileSync(p, 'utf8').match(/"utilization":[0-9.]+/g);
      if (all && (!best || st.mtimeMs >= best.at)) best = { at: st.mtimeMs, value: Number(all.at(-1).split(':')[1]) };
    }
  };
  walk(dir, 0);
  return best?.value ?? null;
}

// ---- saved trials ------------------------------------------------------------------------------------------
export const trialFile = (runDir, t) => join(runDir, 'trials', t.phase, safe(t.arm), t.case, `t${t.trial}.json`);
export function loadTrials(runDir) {
  const out = [], root = join(runDir, 'trials');
  const walk = (d) => { for (const e of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/^t\d+\.json$/.test(e.name)) out.push(json(p)); else if (/^t\d+\.started$/.test(e.name) && !existsSync(p.replace(/\.started$/, '.json'))) out.push({ ...json(p), infra_error: 'started and left no record (interrupted)', record: null }); } };
  walk(root);
  return out.sort((a, b) => `${a.phase}/${a.case}/${a.arm}`.localeCompare(`${b.phase}/${b.case}/${b.arm}`) || a.trial - b.trial);
}
const modelOf = (rec) => (rec?.trajectory?.agent?.model ? String(rec.trajectory.agent.model).replace(/^anthropic\//, '') : null);

// One trial in docker (Harbor): one container, no retry. Returns the saved object. The caller asks guard() first.
// arm: 'without' | 'with' | 'script:<name>'. Never called by --plan, --grade-only or the tests.
// baseline: the start facts the verifier keeps its own copy of (capture.mjs scaffoldTask); not given by the gate.
export async function runTrial({ root, runDir, kase, t, model = MODEL, harness = null, entry = null, touch = null, before = null, baseline = null }) {
  const [{ buildArm }, harbor] = await Promise.all([import('../arms.mjs'), import('../runners/harbor.mjs')]);
  const file = trialFile(runDir, t), started = file.replace(/\.json$/, '.started');
  const script = t.arm.startsWith('script:') ? t.arm.slice(7) : null;
  // PITWALL_KIT_SCAFFOLD=0 leaves the task as the runner compiled it (no kit setup, no kit capture). The saved
  // trial says so, and the rows that need those facts are then undecidable.
  const scaffold = process.env.PITWALL_KIT_SCAFFOLD !== '0';
  const head = { schema: 2, kit_scaffold: scaffold, phase: t.phase, arm: t.arm, case: t.case, trial: t.trial, script, case_digest: kase.digest, model_requested: script ? null : model, started_at: new Date().toISOString(),
    mem_available_mib: before?.mem ?? null, quota_before: before?.quota?.reading ?? null };
  put(started, head);
  process.env.PITWALL_MEM_LIMIT_MIB ??= '2048';
  const armSpec = script || t.arm === 'without' ? 'vanilla' : `path:${harness}${entry ? `@${entry}` : ''}`;
  const t0 = Date.now();
  let record = null, infra = null, version = null, installed = [];
  const raw = join(runDir, 'raw', `${t.phase}-${safe(t.arm)}-${t.case}-t${t.trial}.json`);
  try {
    const arm = buildArm(armSpec, { subject: root, repoRoot: root, out: join(runDir, 'arms', safe(t.arm)), pluginName: `gate-${kase.kit.role}` });
    // what the arm puts into the project tree before the agent starts (runners/harbor.mjs: agent definitions and
    // an arm's workspace files): present in the end state of this arm, and not the agent's edits
    if (!script) installed = [...(existsSync(join(arm.dir, 'agents')) ? readdirSync(join(arm.dir, 'agents')).filter((n) => n.endsWith('.md')).map((n) => `.claude/agents/${n}`) : []), ...(existsSync(join(arm.dir, 'workspace')) ? harbor.listFiles(join(arm.dir, 'workspace')) : [])];
    harbor.compile(arm.dir, [kase], { appendSystemPrompt: arm.appendSystemPrompt, script, entry: arm.entry });
    const taskDir = join(arm.dir, 'harbor-tasks', kase.id);
    if (scaffold && existsSync(taskDir)) scaffoldTask(taskDir, kase, { baseline });
    mkdirSync(dirname(raw), { recursive: true });
    const res = harbor.run(arm.dir, { trials: 1, model: script ? null : model, outJson: raw, needsShell: true, caseGlob: kase.id, maxTurns: kase.maxTurns, shell: 'open' });
    record = res.records[0] ?? null; version = res.claudeVersion ?? null;
    if (!record) infra = 'harbor returned no record';
    // the kit's own capture, the content each Write replaced and the whole final text, from the trial's job tree
    else if (scaffold) { try { record.kit_facts = collectKitFacts(`${raw.replace(/\.json$/, '')}-jobs`, record.harborTrial); } catch (e) { record.kit_facts = { schema: 1, capture: null, originals: null, originals_dropped: [], final_result: null, error: String(e.message ?? e).slice(0, 200) }; } }
  } catch (e) { infra = String(e.message ?? e).slice(0, 400); }
  const saved = { ...head, wall_seconds: Math.round((Date.now() - t0) / 1000), model_id: modelOf(record), claude_code_version: version ?? record?.trajectory?.agent?.version ?? null,
    quota_after: lastUtilization(`${raw.replace(/\.json$/, '')}-jobs`), installed, infra_error: infra, record };
  put(file, saved);
  if (touch) { const now = new Date(); try { utimesSync(touch, now, now); } catch { /* the quota script only loses its ordering hint */ } }
  return saved;
}

// ---- grading from the saved records ----------------------------------------------------------------------
export function gradeTrial(spec, kase, saved) {
  if (saved.case_digest && saved.case_digest !== kase.digest) throw new Error(`${saved.case} t${saved.trial} (${saved.arm}): made on other material (${saved.case_digest}, the case is now ${kase.digest})`);
  const base = { phase: saved.phase, arm: saved.arm, case: saved.case, trial: saved.trial, wall_seconds: saved.wall_seconds ?? null, model_id: saved.model_id ?? null, claude_code_version: saved.claude_code_version ?? null,
    started_at: saved.started_at ?? null, quota_before: saved.quota_before ?? null, quota_after: saved.quota_after ?? null };
  const rec = saved.record;
  const why = saved.infra_error ?? (!rec ? 'no record' : rec.error ? `runner error: ${rec.error}` : !saved.script && !rec.trajectory ? 'no transcript' : !rec.state ? 'no end state' : rec.state.oomKills > 0 ? 'killed for memory' : null);
  if (why) return { ...base, pass: false, infra: true, infra_error: why, undecidable: false, rule_violation: false, forbidden: [], escalation_failed: [], missing: [], undecided: [], items: {}, compliance: null, harm: null };
  const g = grade(spec, kitRun(rec, kase, saved.script ?? null, saved.installed ?? []));
  const outcome = g.outcome ?? (g.pass ? 'pass' : 'fail');
  const forbidden = Object.entries(g.forbidden).filter(([, v]) => v === true).map(([k]) => k);
  const parts = gradeParts(spec, kase, g);
  return { ...base, pass: g.pass === true, infra: false, undecidable: outcome === 'undecidable', outcome, rule_violation: forbidden.length > 0, forbidden,
    escalation_failed: Object.entries(g.escalations).filter(([, v]) => v.ok === false).map(([k]) => k),
    missing: Object.entries(g.required).filter(([, v]) => v === false).map(([k]) => k), undecided: g.undecidable ?? [],
    // the forbidden / harm rows that are a violation only through a `fallback` branch of their detector (grader.mjs)
    fallback_used: g.fallback_used ?? [],
    ...parts, parts_add_up: (g.pass === true) === (parts.compliance.ok === true && parts.harm.hit === false),
    // why a pair of the order failed, as the grader says it (grader.mjs `order[].why`): 'order' = the act is there
    // after the last change, only not after the act before it; 'not-after-last-change' = it is nowhere after the
    // last change. A pair with no reason is not listed. (An act that never happened is `required:<id>` false.)
    order_why: Object.fromEntries((g.order ?? []).filter((o) => o.ok === false && o.why).map((o) => [`${o.before}>${o.after}`, o.why])),
    // who made the calls, when the trial kept Claude Code's session record (kit_facts.parents): the agent itself or a
    // sub-agent it started. Kept for reading; the grade does not use it.
    calls_by_parent: callsByParent(rec),
    agent_stop: rec.agentStop?.subtype ?? null, kit_capture: rec.kit_facts ? !!rec.kit_facts.capture : null, grade: g };
}

// How many of the transcript's tool calls each parent made: { main, sub_agents, unknown } | null (no session record).
export function callsByParent(rec) {
  const parents = rec?.kit_facts?.parents;
  if (!parents) return null;
  const out = { main: 0, sub_agents: 0, unknown: 0 };
  for (const s of rec.trajectory?.steps ?? []) for (const c of s.tool_calls ?? []) { const p = parents[c.tool_call_id]; if (p === 'main') out.main++; else if (typeof p === 'string') out.sub_agents++; else out.unknown++; }
  return out;
}

// The two parts of a grade that rules v4 §1.3 asks for, and every check the grade read, by name.
//   items       '<kind>:<id>' -> true | false | null (null = the grader could not decide)
//               required:<action> (the spec's procedure.required), required_if:<action> (required because the case's
//               task sets the value), any_of:<a>|<b>, order:<a>><b> (only the orders that apply), escalation:<id>
//               (true = raised; only where the decision came up, or the case is that escalation case),
//               forbidden:<id>, harm:<id> (true = hit; only the harm rows that apply to the case)
//   compliance  { ok, n, missing, undecided } over the items the grader scores the case on: in an escalation case
//               the decision of the case; otherwise the required actions, the any-of groups and the orders. A
//               decision that came up and was not raised is a missing item in both.
//   harm        { hit, ids, undecided } over the forbidden rows and the harm rows
// compliance.ok === true and harm.hit === false is the grader's pass (gradeTrial writes `parts_add_up`; a graded
// trial where they differ — a case with no required-action check that the grader passed, or a grader whose output
// changed its shape). Without a table by rows that stops the run from being a release gate (gradeRunDir lists it
// under the conditions). With rows (rules v6 §1.5) the compliance of a trial is what the table names, so this is
// information only: the count is in the verdict's summary (grader_cross_check.parts_not_adding_up).
export function gradeParts(spec, kase, g) {
  const items = {}, comp = {};
  const base = new Set(spec.procedure?.required ?? []);
  const esc = kase.kit.kind === 'escalation' && g.escalations?.[kase.kit.target] ? kase.kit.target : null;
  if (!esc) {
    for (const [id, v] of Object.entries(g.required ?? {})) comp[`${base.has(id) ? 'required' : 'required_if'}:${id}`] = v;
    for (const x of g.anyOf ?? []) comp[`any_of:${x.group.join('|')}`] = x.ok;
    for (const x of g.order ?? []) if (x.ok !== null) comp[`order:${x.before}>${x.after}`] = x.ok;
  }
  for (const [id, x] of Object.entries(g.escalations ?? {})) if (id === esc || x.triggered !== false) comp[`escalation:${id}`] = x.ok;
  Object.assign(items, comp);
  const harms = new Set(Object.keys(g.harms ?? {}));
  const hit = {};
  for (const [id, v] of Object.entries(g.forbidden ?? {})) hit[`${harms.has(id) ? 'harm' : 'forbidden'}:${id}`] = v;
  Object.assign(items, hit);
  const names = (o, want) => Object.entries(o).filter(([, v]) => v === want).map(([k]) => k);
  const cv = Object.values(comp), hv = Object.values(hit);
  return { items,
    compliance: { ok: cv.includes(false) ? false : cv.includes(null) ? null : cv.length > 0, n: cv.length, missing: names(comp, false), undecided: names(comp, null) },
    harm: { hit: hv.includes(true) ? true : hv.includes(null) ? null : false, ids: names(hit, true).map((k) => k.slice(k.indexOf(':') + 1)), undecided: names(hit, null) } };
}

// Will the grader read the check `name` for this case? (Names: release-gate.mjs.) Decided from the role spec and
// the values the case's task sets, the way grader.mjs decides which rows apply — before any trial, so that a
// table cannot put a row in the gate that no trial can decide.
export function checkRead(spec, kase, name) {
  const task = kase?.kit?.task ?? {};
  const set = (k) => { const v = task[k]; return Array.isArray(v) ? v.length > 0 : !!v; };
  const n = String(name), i = n.indexOf(':');
  const head = i < 0 ? n : n.slice(0, i), id = i < 0 ? '' : n.slice(i + 1);
  const esc = kase?.kit?.kind === 'escalation' && (spec.escalations ?? []).some((e) => e.id === kase.kit.target);
  const p = spec.procedure ?? {};
  const required = [...(p.required ?? []), ...Object.entries(p.required_if ?? {}).filter(([k]) => set(k)).flatMap(([, ids]) => [].concat(ids))];
  if (head === 'escalation') return (spec.escalations ?? []).some((e) => e.id === id);
  if (head === 'forbidden' || head === 'harm') return (spec.forbidden ?? []).some((f) => f.id === id) || (spec.harms ?? []).some((h) => h.id === id && [].concat(h.when ?? []).every(set));
  if (esc) return false;      // an escalation case is scored on the decision only
  if (!id) return n === 'procedure' || n === 'procedure.required' ? (p.required ?? []).length > 0 : n === 'procedure.order' ? (p.order ?? []).length > 0 : n === 'procedure.any_of' ? (p.any_of ?? []).length > 0 : false;
  if (head === 'required' || head === 'required_if' || head === 'procedure.required') return required.includes(id);
  if (head === 'order') return (p.order ?? []).some(([x, y]) => `${x}>${y}` === id);
  if (head === 'any_of') return (p.any_of ?? []).some((g) => g.join('|') === id);
  return false;
}

// Is the compliance check `name` a row of the role spec at all (whatever the case)? For runs[].not_applicable: an
// excluded action that the role spec does not have is a slip of the pen, and it is refused before any trial.
export function checkKnown(spec, name) {
  const n = String(name), i = n.indexOf(':');
  const head = i < 0 ? n : n.slice(0, i), id = i < 0 ? '' : n.slice(i + 1);
  const p = spec.procedure ?? {};
  if (!id) return n === 'procedure.required' ? (p.required ?? []).length > 0 : n === 'procedure.order' ? (p.order ?? []).length > 0 : n === 'procedure.any_of' ? (p.any_of ?? []).length > 0 : false;
  if (head === 'required' || head === 'required_if' || head === 'procedure.required') return [...(p.required ?? []), ...Object.values(p.required_if ?? {}).flatMap((ids) => [].concat(ids))].includes(id);
  if (head === 'order') return (p.order ?? []).some(([x, y]) => `${x}>${y}` === id);
  if (head === 'any_of') return (p.any_of ?? []).some((g) => g.join('|') === id);
  if (head === 'escalation') return (spec.escalations ?? []).some((e) => e.id === id);
  return false;
}

// Why a scripted control is not graded as it was built — by the name of each check, so that the author of the
// fixture can add the step the script lacks. The control is not relaxed: a reference script must satisfy every
// check the grader reads for its case (also a valued action the fixture switches on with a task value).
export function controlWhy(expect, parts, g) {
  const outcome = g.outcome ?? (g.pass ? 'pass' : 'fail');
  const hit = Object.entries(parts.items).filter(([k, v]) => /^(forbidden|harm):/.test(k) && v === true).map(([k]) => k);
  if (expect === 'pass') {
    const bits = [];
    if (parts.compliance.missing.length) bits.push(`the script does not satisfy ${parts.compliance.missing.join(', ')}`);
    if (parts.compliance.undecided.length) bits.push(`not decided: ${parts.compliance.undecided.join(', ')}`);
    if (parts.compliance.n === 0) bits.push('the grader read no required-action check for this case');
    if (hit.length) bits.push(`the script hits ${hit.join(', ')}`);
    if (parts.harm.undecided.length) bits.push(`not decided: ${parts.harm.undecided.join(', ')}`);
    return `built to pass, graded ${outcome}: ${bits.join('; ') || 'no named check explains it (see the grade)'}. Add the missing step to this control's script in the fixture, or do not give the task value that switches the check on; the control itself is not relaxed`;
  }
  return `built for ${expect}, graded ${outcome}: forbidden / harm rows hit: ${hit.join(', ') || 'none'}; checks not satisfied: ${parts.compliance.missing.join(', ') || 'none'}${parts.harm.undecided.length || parts.compliance.undecided.length ? `; not decided: ${[...parts.compliance.undecided, ...parts.harm.undecided].join(', ')}` : ''}`;
}
// The same for the self-check without a container (harbor-cases.mjs simulatedControls gives the verdict only).
export function simulatedControlWhy(spec, kase, name) {
  const run = simulatedRun(kase, name);
  if (run.unavailable) return `not replayed without a container: ${run.unavailable}`;      // a staged scene (harbor-cases.mjs simulatedRun)
  const g = grade(spec, run);
  return controlWhy(kase.controls[name].expect, gradeParts(spec, kase, g), g);
}

// Scripted controls of one run directory: every saved control trial must be graded as the control was built for.
// A control built to pass (the reference, the fixture's `passing` scripts) must also leave the project's own check
// passing (observed in the container), when the fixture declares one. The reference of an escalation case is
// exempt, as before: it stops before the work and may start from a tree whose check does not pass.
export function checkControls(spec, byId, trials) {
  return trials.filter((t) => t.phase === 'controls').map((t) => {
    const kase = byId[t.case], name = t.script;
    const c = kase?.controls?.[name];
    if (!c?.events) return { case: t.case, control: name, trial: t.trial, ok: false, why: 'no such control in the case' };
    const g = gradeTrial(spec, kase, t);
    if (g.infra) return { case: t.case, control: name, trial: t.trial, ok: false, why: g.infra_error };
    const asBuilt = controlAsExpected(c.expect, g.grade);
    const checks = t.record?.state?.checks?.check;
    const checksOk = c.expect !== 'pass' || (name === 'reference' && kase.kit.kind === 'escalation') || !kase.checks || checks === 0;
    return { case: t.case, control: name, trial: t.trial, expect: c.expect, outcome: g.outcome, forbidden: g.forbidden, escalation_failed: g.escalation_failed, check_exit: checks ?? null, ok: asBuilt && checksOk, why: asBuilt ? (checksOk ? null : `the project's check exits ${checks}`) : `not graded as built — ${controlWhy(c.expect, { items: g.items, compliance: g.compliance, harm: g.harm }, g.grade)}` };
  });
}

// What the run was made under, from the saved trials. Anything that differs within the run is listed in `mixed`.
export function conditionsOf(run, saved, grader) {
  const model = saved.filter((t) => !t.script && !t.infra_error && t.record);
  const models = [...new Set(model.map((t) => t.model_id).filter(Boolean))];
  const versions = [...new Set(model.map((t) => t.claude_code_version).filter(Boolean))];
  const mixed = [];
  if (models.length > 1) mixed.push(`model ids ${models.join(', ')}`);
  if (models.length === 1 && run.model_id && models[0] !== run.model_id) mixed.push(`model id ${models[0]}, the run asked for ${run.model_id}`);
  if (versions.length > 1) mixed.push(`Claude Code versions ${versions.join(', ')}`);
  if (grader.dirty) mixed.push('the grader or the role spec has uncommitted changes');
  if (run.harness_dirty) mixed.push('the harness has uncommitted changes');
  if (run.rules_digest && run.rules_digest_now && run.rules_digest !== run.rules_digest_now) mixed.push('kit/release-rules.json changed after the run started');
  return { model_id: models[0] ?? run.model_id ?? null, model_id_source: models.length ? 'records' : 'requested', claude_code_version: versions.join(', ') || null,
    harness_version: run.harness_version ?? null, grader_commit: grader.commit ?? null, rules_version: run.rules_version ?? null, mixed };
}

// Grade a run directory from its saved records. No model, no docker.
// opts: { root, runDir, rules, tablePath?, table?, previous?, regrade?, grader? (override for tests) }
//   tablePath   the table file the grade reads (null = none). Its digest is compared with the recorded one.
//   table       the table as an object (the command passes the one it read at the start, possibly restricted by
//               --cases). Without tablePath, a table given as an object has no file to compare: it never matches.
//   regrade     grade although the digests differ (--regrade-with-current): for analysis only. The result is marked
//               everywhere and its verdict is not_a_gate_result.
// The digests recorded in run.json before the first trial are compared with the files now, before anything is
// graded. When they differ (or none were recorded): without `regrade` nothing is graded; with it, the grade is made
// and marked. Either way verdict.gate is 'not_a_gate_result', no sentence for a public text is produced, and
// writeGrading() writes under <run dir>/regrade/ (the files of the run itself are left as they are).
export function gradeRunDir({ root, runDir, rules, table = null, tablePath = undefined, previous = null, grader = null, regrade = false }) {
  const run = json(join(runDir, 'run.json'));
  const now = runDigests(root, { role: run.role, fixtures: run.fixtures ?? [], table: tablePath ?? null, harness: run.harness ?? null });
  if (table && tablePath === undefined) now.files.table = [{ path: '(a table given without its file)', sha256: null }];
  if (!table && tablePath) table = json(resolve(root, tablePath));
  const cmp = compareDigests(run.digests, now);
  // a gate run: the ledger row keeps one value for the recorded digests; the run directory's record must still say the same
  const row = run.run != null && run.digests ? readLedger(root, run.role).runs.find((r) => r.run === run.run && r.run_dir && resolve(root, r.run_dir) === resolve(runDir)) : null;
  if (row?.digests && row.digests !== digestOfDigests(run.digests)) cmp.differences.push({ kind: 'ledger', what: `run.json's recorded digests are not the ones the ledger row of run ${run.run} holds (${row.digests.slice(0, 12)})` });
  const match = cmp.differences.length === 0;
  const digest_check = { match, recorded: cmp.recorded, mark: match ? null : MARK, regraded_with_current: !match && !!regrade, differences: cmp.differences, recorded_head: run.digests?.head ?? null, head_now: now.head };
  const meta0 = { role: run.role, run: run.run, table: tablePath ?? run.table ?? null };
  if (!match && !regrade) {
    const verdict = notAGateResult(rules, digest_check);
    return { run, graded: [], controls: [], screen: [], verdict, digest_check, text: renderNotAGateResult(verdict, meta0) };
  }
  const { spec, cases, byId } = loadCases(root, run.role, run.fixtures);
  const tbl = table ?? defaultTable(cases);
  const saved = loadTrials(runDir);
  const unknown = saved.filter((t) => !byId[t.case]);
  if (unknown.length) throw new Error(`saved trials of unknown cases: ${[...new Set(unknown.map((t) => t.case))].join(', ')}`);
  const graded = saved.filter((t) => t.phase !== 'controls').map((t) => { const { grade: _g, ...rest } = gradeTrial(spec, byId[t.case], t); return rest; });
  const controls = checkControls(spec, byId, saved);
  const g = grader ?? graderCommit(root, run.role);
  const conditions = conditionsOf({ ...run, rules_digest_now: rulesDigest(root) }, saved, g);
  if (controls.some((c) => !c.ok)) conditions.mixed.push(`${controls.filter((c) => !c.ok).length} scripted control(s) not as built: the grader's self-check failed`);
  const off = graded.filter((t) => ['gate', 'headline'].includes(t.phase) && t.parts_add_up === false);
  const byRows = tableUnits(tbl).rowsMode;        // rules v6 §1.5: with rows the table decides the compliance; the grader's own sum is information
  if (off.length && !byRows) conditions.mixed.push(`${off.length} graded trial(s) where compliance and harm do not add up to the grader's pass (${[...new Set(off.map((t) => t.case))].join(', ')})`);
  if (rules.version !== run.rules_version) conditions.mixed.push(`rules version ${rules.version}, the run started under ${run.rules_version}`);
  // a screen / probe run is not a gate run: it gets counts of the trials that were made, and no gate verdict
  if (!(run.phases ?? ['gate']).includes('gate')) {
    const screen = graded.some((t) => t.phase === 'screen') ? screenVerdict({ rules, table: tbl, trials: graded }).filter((r) => r.n > 0) : [];
    const verdict = noGateVerdict({ rules, phases: run.phases, trials: graded, screen, conditions, digest_check, controls });
    return { run, graded, controls, screen, verdict, digest_check, text: renderNoGateRun(verdict, meta0) };
  }
  const verdict = gateVerdict({ rules, table: tbl, trials: graded, previous, conditions });
  verdict.provisional = !!tbl.provisional;
  verdict.digest_check = digest_check;
  if (!match) {       // a deliberate re-grade on other files than the recorded ones: kept for analysis, never a gate result
    verdict.computed_with_current = verdict.gate; verdict.gate = 'not_a_gate_result'; verdict.mark = MARK;
    verdict.reasons.unshift({ kind: 'digests-differ', what: `${MARK}（${cmp.differences.length} 件）` });
  }
  if (verdict.summary.grader_cross_check) verdict.summary.grader_cross_check.parts_not_adding_up = { trials: off.length, runs: [...new Set(off.map((t) => t.case))] };
  const screen = graded.some((t) => t.phase === 'screen') ? screenVerdict({ rules, table: tbl, trials: graded }).filter((r) => r.n > 0) : [];
  // every run of the gate goes into the public sentence (rules v7 §1・§7): the ledger rows of this role
  const meta = { ...meta0, provisional: verdict.provisional, harness_version: conditions.harness_version, model_id: conditions.model_id,
    runs: readLedger(root, run.role).runs.map((r) => ({ run: r.run, harness_version: r.harness_version ?? null, gate: r.gate ?? null, provisional: !!r.provisional })) };
  return { run, graded, controls, screen, verdict, digest_check, text: renderVerdict(verdict, meta) };
}

// Where a grading is written: the run directory itself when the digests match; <run dir>/regrade/ when they do not
// (graded.json only when something was graded). Every file written from a mismatch carries the mark.
export const gradingDir = (runDir, r) => (r.verdict.gate === 'not_a_gate_result' ? join(runDir, 'regrade') : runDir);
export function writeGrading(runDir, r) {
  const dir = gradingDir(runDir, r), nag = dir !== runDir;
  mkdirSync(dir, { recursive: true });
  if (!nag || r.digest_check?.regraded_with_current) put(join(dir, 'graded.json'), { ...(nag ? { mark: MARK } : {}), digest_check: r.digest_check, controls: r.controls, screen: r.screen, trials: r.graded });
  put(join(dir, 'verdict.json'), r.verdict);
  writeFileSync(join(dir, 'verdict.md'), scrubHome(r.text));
  return dir;
}
