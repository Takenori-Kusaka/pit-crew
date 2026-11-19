// The run side of the end-state facts (W4 #98; the predicates that read them: predicates.mjs, W3 #100).
// Record schema: kit/schema/trial-record.md.
//
// Three places, one module:
//   image      kitConf() / scaffoldTask(): what a Harbor task gets on top of what runners/harbor.mjs compile()
//              wrote — kit-setup.sh as the last image layer (start refs; a logged bare remote when the fixture
//              declares `remote`; run-recording wrappers when it declares `recorded`) and kit-capture.sh, called
//              from tests/test.sh before the checks run.
//   job tree   collectKitFacts(): after a trial, what the saved record gets beside the Harbor record — the
//              captured git / remote facts, the content each Write replaced (Claude Code's own session record),
//              and the whole final result text.
//   grading    gitFacts(): the `git` and `remote` members of the grader's state from those facts.
// Nothing here reads a role spec, a scene or a harness. A fact that was not captured is left out (the
// predicates answer "undecidable"); it is never filled with a default.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { remoteBranchesOf, remoteTsv } from './scene.mjs';

const sh = (name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
export const KIT_SETUP = sh('kit-setup.sh');
export const KIT_CAPTURE = sh('kit-capture.sh');
export const FACTS_FILE = 'kit-facts.json';
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// ---- what a fixture may declare ---------------------------------------------------------------------------
// remote:   true | { branch }       a bare remote `origin` with a push log; the agent starts on `branch` (main)
// recorded: { <name>: [commands] }   runs of these commands are recorded under <name> with the tree they ran on
//                                    (a command = a command word and an argument prefix: `npm test`, `node --test`)
export function remoteOf(fx) {
  if (!fx?.remote) return null;
  const branch = typeof fx.remote === 'object' && fx.remote.branch ? String(fx.remote.branch) : 'main';
  if (!/^[\w./-]+$/.test(branch)) throw new Error(`fixture remote.branch: ${branch} is not a plain branch name`);
  // declared branches, local branches and the start branch (scene.mjs): only then the object has more than `branch`
  const ext = remoteBranchesOf(fx);
  return ext ? { branch, branches: ext.branches, local: ext.local, start: ext.start, unpushed: ext.unpushed } : { branch };
}
export function recordedOf(fx) {
  const out = {};
  for (const [name, cmds] of Object.entries(fx?.recorded ?? {})) {
    if (!/^[\w.-]+$/.test(name)) throw new Error(`fixture recorded: ${name} is not a plain name`);
    out[name] = [].concat(cmds).map((c) => String(c).trim().split(/\s+/));
    for (const words of out[name]) if (!/^[\w.-]+$/.test(words[0])) throw new Error(`fixture recorded.${name}: ${words[0]} is not a command word`);
  }
  return out;
}

// The wrapper for one command word. The real command is beside it (<word>.pitwall-real), or named in
// <word>.pitwall-real-path. A run is recorded once: a recorded command started by another recorded command
// (npm test -> node --test) is not recorded again.
export function wrapperScript(word, rows) {
  const arms = rows.map(({ name, args }) => `    ${q(args.length ? `${args.join(' ')} ` : '')}*) export PITWALL_KIT_MARKED=1; exec pitwall-mark-run ${q(name)} -- "$real" "$@" ;;`);
  return ['#!/bin/bash', `# ${word}: records runs of the project's documented commands (name, exit code, the tree they ran on), then runs the real ${word}.`,
    'real=$(cat -- "$0.pitwall-real-path" 2>/dev/null) || real=$0.pitwall-real',
    'if [ -z "${PITWALL_KIT_MARKED-}" ]; then', '  case "$* " in', ...arms, '  esac', 'fi', 'exec "$real" "$@"', ''].join('\n');
}

// The files of the kit's configuration directory (image: /opt/pitwall-kit, removed after the setup ran).
export function kitConf(kase) {
  const files = { 'setup.sh': KIT_SETUP };
  if (kase.remote) files.remote = `${kase.remote.branch}\n`;
  if (kase.remote?.branches) files['remote.tsv'] = remoteTsv(kase.remote);
  // a layer on a base tree image: the globs whose text the capture records (the file's presence turns the tree capture on)
  if (kase.layer) files.layer = (kase.layer.capture ?? []).map((g) => `${g}\n`).join('');
  for (const [name, text] of Object.entries(kase.ghSnapshot?.files ?? {})) files[`gh-snapshot/${name}`] = text;
  const rows = Object.entries(kase.recorded ?? {}).flatMap(([name, cmds]) => cmds.map(([word, ...args]) => ({ name, word, args })));
  if (rows.length) {
    files['recorded.tsv'] = rows.map((r) => `${r.name}\t${r.word}\t${r.args.join(' ')}\n`).join('');
    for (const w of [...new Set(rows.map((r) => r.word))]) files[`wrap-${w}`] = wrapperScript(w, rows.filter((r) => r.word === w));
  }
  return files;
}

export const DOCKER_LINES = 'COPY pitwall-kit/ /opt/pitwall-kit/\nRUN bash /opt/pitwall-kit/setup.sh; rm -rf /opt/pitwall-kit\n';
const CALL = 'bash /tests/kit-capture.sh >/dev/null 2>&1 || true   # kit: git and remote facts, before the checks run';
// tests/test.sh with the kit's capture as its first command (the runner's own capture is left as it is)
// layer: the task is a layer on a base tree image. The runner's capture walks every file under /app; in a layer
// task it reads its file list from the kit's capture instead (the paths that changed and the declared ones), so the
// record does not hold the whole tree of the base image (dependencies included).
// The start commit is given to the checks as PITWALL_FIXTURE_HEAD (a staged fixture's "start" is not the root commit).
const WALK = 'done < <(find . -path ./.git -prune -o -type f -print0 | sort -z)';
const LISTED = 'done < <(cat /tmp/pitwall-kit-paths.z 2>/dev/null | sort -z)';
const HEAD_ENV = 'export PITWALL_FIXTURE_HEAD=$(cat /etc/pitwall/fixture-head 2>/dev/null)   # kit: the start commit, for the checks';
export function patchTestSh(text, { layer = false } = {}) {
  let out = text;
  if (!out.includes('/tests/kit-capture.sh')) {
    const i = out.indexOf('\n');
    if (!out.startsWith('#!') || i < 0) throw new Error('tests/test.sh does not start with an interpreter line');
    out = `${out.slice(0, i + 1)}${CALL}\n${HEAD_ENV}\n${out.slice(i + 1)}`;
  }
  if (layer && !out.includes(LISTED)) {
    if (!out.includes(WALK)) throw new Error('tests/test.sh: the line that walks the tree was not found (runners/state-capture.sh changed)');
    out = out.replace(WALK, LISTED);
  }
  return out;
}

// Add the kit's part to one compiled Harbor task directory. Idempotent.
// opts.baseline: { <name>: text } the start facts as the verifier keeps them (tests/kit-baseline/<name>; the names
// are those kit-setup.sh writes: git-refs-before, branch-before, origin-url-before, head-before, remote-refs-before,
// gh-snapshot-sha). tests/ is uploaded after the agent ended, so the agent cannot change this copy. The capture
// then reads the start facts from it and says which of the image's copies differ (kit_facts.capture.baseline).
export function scaffoldTask(taskDir, kase, { baseline = null } = {}) {
  const env = join(taskDir, 'environment'), tests = join(taskDir, 'tests');
  const df = join(env, 'Dockerfile');
  if (!existsSync(df) || !existsSync(join(tests, 'test.sh'))) throw new Error(`${taskDir} is not a compiled Harbor task`);
  mkdirSync(join(env, 'pitwall-kit'), { recursive: true });
  for (const [name, text] of Object.entries(kitConf(kase))) { mkdirSync(dirname(join(env, 'pitwall-kit', name)), { recursive: true }); writeFileSync(join(env, 'pitwall-kit', name), text, { mode: 0o755 }); }
  const d = readFileSync(df, 'utf8');
  if (!d.includes(DOCKER_LINES)) writeFileSync(df, `${d.endsWith('\n') ? d : `${d}\n`}${DOCKER_LINES}`);
  writeFileSync(join(tests, 'kit-capture.sh'), KIT_CAPTURE, { mode: 0o755 });
  writeFileSync(join(tests, 'test.sh'), patchTestSh(readFileSync(join(tests, 'test.sh'), 'utf8'), { layer: !!kase.layer }), { mode: 0o755 });
  if (baseline) {
    mkdirSync(join(tests, 'kit-baseline'), { recursive: true });
    for (const [name, text] of Object.entries(baseline)) { if (!/^[\w.-]+$/.test(name)) throw new Error(`baseline: ${name} is not a plain name`); writeFileSync(join(tests, 'kit-baseline', name), text); }
  }
}

// ---- kit-facts.json -> facts ------------------------------------------------------------------------------
const dec = (b) => Buffer.from(b ?? '', 'base64').toString('utf8');
const lines = (b) => dec(b).split('\n').filter(Boolean);
const refMap = (b) => Object.fromEntries(lines(b).map((l) => { const i = l.indexOf(' '); return [l.slice(i + 1), l.slice(0, i)]; }));
const id = (x) => (!x || /^0+$/.test(x) ? null : x);
const tri = (x) => (x === '1' ? true : x === '0' ? false : null);

// The remote's ref updates during the run, from three readings of the same remote:
//   hook    its own log (every accepted push)        reflog  its reflogs (kept when the hook or its log is gone)
//   refs    a ref that differs between the start and the end and that neither log explains: the update is known
//           to have happened; it is a rewrite when the end is not a descendant of the start, unknown otherwise
// undefined when neither log could be read (the predicates then answer "undecidable").
function updatesOf(r) {
  if (r.push_log !== 'present' && r.reflog_b64 === undefined) return undefined;
  const out = [], seen = new Set();
  const add = (u) => { const k = `${u.ref}\n${u.old}\n${u.new}`; if (seen.has(k) && u.source !== 'hook') return; seen.add(k); out.push(u); };
  if (r.push_log === 'present') for (const l of lines(r.push_log_b64)) { const [at, ref, old, nw, f] = l.split('\t'); add({ ref, old: id(old), new: id(nw), ff: tri(f), at, source: 'hook' }); }
  for (const l of lines(r.reflog_b64)) { const [ref, old, nw, f] = l.split('\t'); add({ ref, old: id(old), new: id(nw), ff: tri(f), source: 'reflog' }); }
  for (const l of lines(r.net_b64)) {
    const [ref, old, nw, f] = l.split('\t');
    if (out.some((u) => u.ref === ref && u.new === id(nw))) continue;
    out.push({ ref, old: id(old), new: id(nw), ff: tri(f) === false ? false : null, source: 'refs' });
  }
  // the remote's own log is gone: "no rewrite" cannot be said of any ref (a rewrite seen above still counts)
  if (r.push_log !== 'present') for (const ref of new Set([...Object.keys(r.refs_before_b64 ? refMap(r.refs_before_b64) : {}), ...Object.keys(refMap(r.refs_b64))])) out.push({ ref, old: 'unknown', new: 'unknown', ff: null, source: 'log-missing' });
  return out;
}

// Do the remote's two logs tell the same story? Both can be rewritten by the agent's user (the hook runs as the
// pushing user, so its log must be writable by it; kit-setup.sh), but they are written separately: the hook's
// log by kit-setup.sh's post-receive, the reflogs by git. For each branch, the hook's updates after its last
// deletion (a deletion removes git's reflog of the branch) must be the reflog's entries, in order, and the last
// one must end where the branch ends. A rewrite of one log without the same rewrite of the other shows here.
// { logs_agree: true | false | null (a log could not be read), disagree: [branch] }. Not part of the grader's
// state (gitFacts passes refs and updates only): the grader's role reads it from kit_facts.
export function logsAgree(r) {
  if (!r || r.status !== 'made' || r.present !== true || r.push_log !== 'present' || typeof r.reflog_b64 !== 'string') return { logs_agree: null, disagree: [] };
  const hook = new Map(), reflog = new Map();
  const push = (m, ref, e) => { if (!m.has(ref)) m.set(ref, []); m.get(ref).push(e); };
  for (const l of lines(r.push_log_b64)) { const [, ref, old, nw] = l.split('\t'); if (!ref?.startsWith('refs/heads/')) continue; if (id(nw) === null) hook.set(ref, []); else push(hook, ref, `${id(old)} ${nw}`); }
  for (const l of lines(r.reflog_b64)) { const [ref, old, nw] = l.split('\t'); push(reflog, ref, `${id(old)} ${nw}`); }
  const after = refMap(r.refs_b64), before = r.refs_before_b64 ? refMap(r.refs_before_b64) : {};
  const disagree = [];
  for (const ref of new Set([...hook.keys(), ...reflog.keys(), ...Object.keys(after), ...Object.keys(before)].filter((n) => n.startsWith('refs/heads/')))) {
    const h = hook.get(ref) ?? [], g = reflog.get(ref) ?? [];
    const end = h.length ? h[h.length - 1].split(' ')[1] : hook.has(ref) ? null : (before[ref] ?? null);
    if (h.join('\n') !== g.join('\n') || end !== (after[ref] ?? null)) disagree.push(ref);
  }
  return { logs_agree: disagree.length === 0, disagree: disagree.sort() };
}

export function parseKitFacts(raw) {
  if (!raw || typeof raw !== 'object' || raw.schema !== 1 || !raw.git) return null;
  const gq = raw.git, r = raw.remote;
  const facts = {
    schema: 1,
    git: {
      head: gq.head || null, detached: gq.detached === true, branch: dec(gq.branch_b64).trim() || null, branch_before: dec(gq.branch_before_b64).trim() || null,
      refs_before: gq.refs_before_b64 ? refMap(gq.refs_before_b64) : null, refs_after: refMap(gq.refs_b64),
      uncommitted: lines(gq.status_b64).map((l) => l.slice(3)), origin_url: dec(gq.origin_url_b64).trim() || null, origin_url_before: dec(gq.origin_url_before_b64).trim() || null,
      // the HEAD at the start (absent: a capture made before this fact existed)
      ...(typeof gq.head_before === 'string' ? { head_before: gq.head_before || null } : {}),
      // the commits made during the run, with their whole messages (absent: the capture did not list them)
      ...(typeof gq.commits_b64 === 'string' ? { commits: lines(gq.commits_b64).map((l) => { const i = l.indexOf('\t'); return { id: i < 0 ? l : l.slice(0, i), message: i < 0 ? '' : dec(l.slice(i + 1)).replace(/\s+$/, '') }; }) } : {}),
    },
    recorded: ['installed', 'failed'].includes(raw.recorded) ? raw.recorded : 'none',
    remote: null,
  };
  if (r) {
    const updates = r.status === 'made' ? updatesOf(r) : undefined;
    facts.remote = { status: r.status === 'made' ? 'made' : 'failed', present: r.present === true, push_log: r.push_log === 'present' ? 'present' : 'missing',
      refs_before: r.refs_before_b64 ? refMap(r.refs_before_b64) : null, refs_after: r.present === true ? refMap(r.refs_b64) : {}, ...(updates ? { updates } : {}), ...logsAgree(r) };
  }
  // a layer task: the paths that changed (and the declared ones), with their content at the start and at the end
  if (raw.tree && raw.tree.mode === 'git') facts.tree = parseTree(raw.tree);
  // the seeded gh snapshot: installed, and unchanged at the end?
  if (raw.gh_snapshot) { const s = raw.gh_snapshot; facts.gh_snapshot = { status: s.status === 'made' ? 'made' : 'failed', sha_before: s.sha_before || null, sha_after: s.sha_after || null, intact: s.sha_before && s.sha_after ? s.sha_before === s.sha_after : null }; }
  // where the start facts were read from, and which of the image's copies differ from the verifier's
  if (raw.baseline) facts.baseline = { source: raw.baseline.source === 'verifier' ? 'verifier' : 'image', differs: String(raw.baseline.differs ?? '').split(' ').filter(Boolean) };
  return facts;
}
// tree.files_b64 -> { base, total, truncated, before: { path: { sha256, text } }, after: { ... } }. A file that is
// not there is left out of its side; a text that was not kept is null. null when the capture could not read the tree.
function parseTree(t) {
  if (t.failed === true || !t.base) return null;
  const before = {}, after = {};
  const text = (x) => (x === undefined || x === '!' ? null : dec(x.slice(1)));
  for (const l of lines(t.files_b64)) {
    const [p64, bs, bt, as, at] = l.split('\t');
    const p = dec(p64);
    if (bs && bs !== '-') before[p] = { sha256: bs, text: text(bt) };
    if (as && as !== '-') after[p] = { sha256: as, text: text(at) };
  }
  return { base: t.base, total: Number(t.total) || 0, truncated: t.truncated === true, before, after };
}
export function readKitFacts(file) {
  if (!existsSync(file)) return null;
  try { return parseKitFacts(JSON.parse(readFileSync(file, 'utf8'))); } catch { return null; }
}

// ---- the job tree of one trial ----------------------------------------------------------------------------
const MAX_TEXT = 256 << 10;
const walk = (d, depth, fn) => { for (const e of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) { const p = join(d, e.name); if (e.isDirectory()) { if (fn(p, e, true) !== false && depth > 0) walk(p, depth - 1, fn); } else fn(p, e, false); } };

// The content each Write replaced, by tool call id, from Claude Code's session record (one JSON per line; a
// tool result carries `toolUseResult: { type: create | update, originalFile }`). '' = the file did not exist.
// A content over 256 KiB is not kept (listed in `dropped`).
export function sessionOriginals(sessionsDir) {
  const originals = {}, dropped = [];
  let files = 0;
  walk(sessionsDir, 6, (p, e, dir) => {
    if (dir || !e.name.endsWith('.jsonl')) return;
    files++;
    for (const l of readFileSync(p, 'utf8').split('\n')) {
      if (!l.includes('"toolUseResult"') || !l.includes('"originalFile"')) continue;
      let x; try { x = JSON.parse(l); } catch { continue; }
      const u = x.toolUseResult;
      if (!u || typeof u !== 'object' || !('originalFile' in u) || !('content' in u)) continue;      // Write only (an Edit carries its own old and new text)
      for (const c of Array.isArray(x.message?.content) ? x.message.content : []) {
        if (c.type !== 'tool_result' || !c.tool_use_id) continue;
        const t = u.originalFile === null || u.originalFile === undefined ? (u.type === 'create' ? '' : null) : String(u.originalFile);
        if (t === null) continue;
        if (t.length > MAX_TEXT) dropped.push(c.tool_use_id); else originals[c.tool_use_id] = t;
      }
    }
  });
  return files ? { originals, dropped } : null;
}

// Who made each tool call, by tool call id, from Claude Code's session record: 'main' (the agent itself) or
// 'agent:<id>' (a sub-agent it started). Claude Code keeps the agent's own conversation in <session>.jsonl and each
// sub-agent's in <session>/subagents/agent-<id>.jsonl (their lines also carry isSidechain / agentId). The Harbor
// record (ATIF) lists all the calls in one sequence without their parent.
// Returns { <tool call id>: 'main' | 'agent:<id>' } | null (no session record found).
export function sessionParents(sessionsDir) {
  const parents = {};
  let files = 0;
  walk(sessionsDir, 6, (p, e, dir) => {
    if (dir || !e.name.endsWith('.jsonl')) return;
    files++;
    const named = /[\\/]subagents[\\/]agent-([\w-]+)\.jsonl$/.exec(p);
    for (const l of readFileSync(p, 'utf8').split('\n')) {
      if (!l.includes('"tool_use"')) continue;
      let x; try { x = JSON.parse(l); } catch { continue; }
      const who = named ? `agent:${named[1]}` : x.isSidechain === true ? `agent:${x.agentId ?? 'unknown'}` : 'main';
      for (const c of Array.isArray(x.message?.content) ? x.message.content : []) if (c.type === 'tool_use' && c.id && !(c.id in parents && who === 'main')) parents[c.id] = who;
    }
  });
  return files ? parents : null;
}

// The whole text of the agent's final result event (Claude Code stream-json), or null.
export function finalResult(streamFile) {
  if (!existsSync(streamFile)) return null;
  let last = null;
  for (const l of readFileSync(streamFile, 'utf8').split('\n')) {
    if (!l.includes('"type":"result"')) continue;
    try { const e = JSON.parse(l); if (e.type === 'result') last = e; } catch { /* partial line */ }
  }
  return last && typeof last.result === 'string' ? last.result : null;
}

// What the saved trial keeps beside the Harbor record (record.kit_facts).
//   capture       parseKitFacts() of the trial's verifier/kit-facts.json, or null (not written, unreadable)
//   originals     { <tool call id>: text } | null (no session record found)
//   parents       { <tool call id>: 'main' | 'agent:<id>' } | null (no session record found): who made the call
//   final_result  the whole final result text | null
export function collectKitFacts(jobsDir, harborTrial) {
  let dir = null;
  walk(jobsDir, 3, (p, e, isDir) => { if (isDir && e.name === harborTrial && existsSync(join(p, 'result.json'))) { dir = p; return false; } return undefined; });
  if (!dir) return { schema: 1, capture: null, originals: null, originals_dropped: [], parents: null, final_result: null, trial_dir_found: false };
  const s = sessionOriginals(join(dir, 'agent', 'sessions'));
  return { schema: 1, capture: readKitFacts(join(dir, 'verifier', FACTS_FILE)), originals: s?.originals ?? null, originals_dropped: s?.dropped ?? [],
    parents: sessionParents(join(dir, 'agent', 'sessions')),
    final_result: finalResult(join(dir, 'agent', 'claude-code.txt')), trial_dir_found: true };
}

// ---- facts -> the grader's state --------------------------------------------------------------------------
const heads = (m) => (m ? Object.fromEntries(Object.entries(m).filter(([k]) => k.startsWith('refs/heads/'))) : undefined);

// { git, remote } for predicates.mjs endStateFacts().
//   state   the runner's captured end state (head, fixtureHead) or null       capture  kit_facts.capture or null
//   declared.remote  the case declares a remote. Then a remote that was not captured is passed as {} — "declared,
//                    not recorded" — so that the ref predicates do not fall back to the agent's own repository
//                    and answer from the wrong side.
export function gitFacts(state, capture, declared = {}) {
  const out = {};
  const c = capture?.git;
  if (c) out.git = { branch: c.branch ?? undefined, head: state?.git?.head || c.head || undefined, base_head: state?.git?.fixtureHead || undefined, refs_before: heads(c.refs_before), refs_after: heads(c.refs_after) };
  else if (state?.git) out.git = { head: state.git.head || undefined, base_head: state.git.fixtureHead || undefined };
  if (declared.remote) {
    const r = capture?.remote;
    out.remote = r && r.status === 'made' && r.refs_before ? { refs_before: r.refs_before, refs_after: r.refs_after, ...(Array.isArray(r.updates) ? { updates: r.updates } : {}) } : {};
  }
  return out;
}
