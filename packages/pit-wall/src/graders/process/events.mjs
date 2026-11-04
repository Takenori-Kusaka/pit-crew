// The event table (research §3.2 step 1): every tool call of a trajectory, in order, with
// what it read, searched, listed, ran and wrote. Input is a pit-wall record (results.json:
// { trajectory, state, ... }) or a bare pit-wall trajectory (normalize/*.mjs output).
//
// Positions: tool call i has position i. An action inside a Bash call sits at
// i + offset/1e6, so `sed -i ... lib/x; bash tests/t.sh` orders the edit before the run.
// A message the agent wrote in the step before call k sits at k - 0.5; the final reply at
// the number of calls.

import { analyzeCommand } from './bash.mjs';
import { normPath, isAbsolute, expand, TEST_RE, NOTES_RE } from './paths.mjs';

const KIND_ORDER = ['edit', 'write', 'run', 'read', 'search', 'list', 'web', 'agent', 'other'];

// Harbor's ATIF results repeat the output after a `[stdout]` marker and append `[metadata]`
// and `[error]` lines; keep the first copy only, so content is not counted twice.
export function cleanResult(text) {
  let t = String(text ?? '');
  const k = t.search(/\n\n?\[stdout\]\n/);
  if (k !== -1) t = t.slice(0, k);
  return t.split('\n').filter((l) => !/^\[(metadata|error)\]( |$)/.test(l)).join('\n');
}

const exitCodeOf = (text) => { const m = String(text).match(/^Exit code (\d+)/); return m ? Number(m[1]) : 0; };

// Error messages naming a path that could not be opened. A Bash call can open some files and
// fail on others, so this is checked per path, not per call.
export function failedOn(text, path) {
  if (!text || path == null) return false;
  const base = path.replace(/^.*\//, '');
  const forms = [...new Set([path, `/app/${path}`, `./${path}`, base])].map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const alt = forms.join('|');
  return new RegExp(`(?:^|[\\s'"])(?:${alt})['"]?: (?:No such file|cannot open|Is a directory|Permission denied)|cannot (?:access|open|stat) ['"]?(?:${alt})['"]?|path ['"]?(?:${alt})['"]? does not exist|(?:${alt})['"]?: not found`, 'm').test(text);
}

// Text the trajectory's state proves about the repo: file list and contents at the end.
export function stateFiles(record) {
  const files = record?.state?.files ?? null;
  if (!files) return null;
  return Object.fromEntries(Object.entries(files).map(([p, f]) => [p, typeof f === 'string' ? f : f?.text ?? null]));
}

function callsOf(traj) {
  const out = [];
  const messages = [];
  for (const s of traj.steps ?? []) {
    if (s.message && String(s.message).trim()) messages.push({ pos: out.length - 0.5, text: String(s.message) });
    for (const c of s.tool_calls ?? []) out.push(c);
  }
  return { calls: out, messages };
}

// Non-Bash tools -> actions in the same shape as bash.mjs produces.
function toolActions(name, input, ctx) {
  const P = (p) => normPath(p, ctx.cwd);
  switch (name) {
    case 'Read': case 'NotebookRead': {
      const p = P(input.file_path ?? input.notebook_path);
      const off = Number(input.offset ?? 0), lim = Number(input.limit ?? 0);
      const range = off || lim ? { kind: 'lines', from: Math.max(1, off || 1), to: lim ? Math.max(1, off || 1) + lim - 1 : Infinity } : { kind: 'full' };
      return [{ type: 'read', path: p, range, tool: 'Read' }];
    }
    case 'Grep': {
      const mode = input.output_mode === 'content' ? 'hits' : input.output_mode === 'count' ? 'count' : 'names';
      const paths = input.path ? expand(input.path, ctx.cwd, ctx.known, { dir: true }) : [ctx.cwd || ''];
      return [{ type: 'search', tool: 'Grep', pattern: String(input.pattern ?? ''), paths, mode, glob: input.glob ?? null }];
    }
    case 'Glob': return [{ type: 'list', tool: 'Glob', paths: [P(input.path ?? '.') ?? ''], pattern: input.pattern ?? null }];
    case 'LS': return [{ type: 'list', tool: 'LS', paths: [P(input.path ?? '.') ?? ''] }];
    case 'Write': return [{ type: 'write', path: P(input.file_path), text: String(input.content ?? ''), authored: true, how: 'Write' }];
    case 'Edit': return [{ type: 'write', path: P(input.file_path), text: String(input.new_string ?? ''), authored: true, how: 'Edit', old: String(input.old_string ?? '') }];
    case 'MultiEdit': return [{ type: 'write', path: P(input.file_path), text: (input.edits ?? []).map((e) => e.new_string ?? '').join('\n'), authored: true, how: 'MultiEdit' }];
    case 'NotebookEdit': return [{ type: 'write', path: P(input.notebook_path), text: String(input.new_source ?? ''), authored: true, how: 'NotebookEdit' }];
    case 'WebFetch': return [{ type: 'web', tool: 'WebFetch', url: String(input.url ?? ''), prompt: input.prompt ?? null }];
    case 'WebSearch': return [{ type: 'web', tool: 'WebSearch', query: String(input.query ?? '') }];
    case 'Agent': case 'Task': return [{ type: 'agent', prompt: String(input.prompt ?? input.description ?? ''), subagent: input.subagent_type ?? null }];
    case 'TodoWrite': return [{ type: 'todo', text: (input.todos ?? []).map((t) => t.content ?? t.activeForm ?? '').join('\n') }];
    case 'Skill': return [{ type: 'skill', skill: String(input.skill ?? input.name ?? '') }];
    default: return [{ type: 'other', name }];
  }
}

const kindOfAction = (a, knownBefore) => {
  switch (a.type) {
    case 'write': return knownBefore.has(a.path) ? 'edit' : 'write';
    case 'delete': return 'edit';
    case 'run': return 'run';
    case 'read': case 'history': case 'gh': return 'read';
    case 'search': return 'search';
    case 'list': return 'list';
    case 'web': return 'web';
    case 'agent': return 'agent';
    default: return 'other';
  }
};

// Build the event table. Returns { events, messages, finalMessage, finalPos, nCalls, files }.
// files: the end state's { path: text } when the record has one (null otherwise).
export function eventTable(record) {
  const traj = record?.trajectory ?? record;
  const files = stateFiles(record);
  const { calls, messages } = callsOf(traj ?? {});
  // Known files for glob expansion: the end state plus anything written so far.
  const known = new Set(files ? Object.keys(files) : []);
  const ctx = { cwd: '', known };
  const events = [];
  calls.forEach((c, i) => {
    const tool = c.function_name ?? c.name;
    const input = c.arguments ?? c.input ?? {};
    const res = c.extra?.result ?? null;
    const resultText = cleanResult(res?.text ?? '');
    const denied = !!c.extra?.denied || /^Permission to use \S+ has been denied/.test(resultText);
    const isError = !!res?.is_error || denied;
    const exitCode = exitCodeOf(res?.text ?? '');
    const knownBefore = new Set(known);
    let actions;
    if (tool === 'Bash' || tool === 'PowerShell') actions = analyzeCommand(String(input.command ?? ''), ctx).actions;
    else actions = toolActions(tool, input, ctx);
    actions = actions.filter((a) => !('path' in a) || a.path != null).map((a) => ({ ...a, pos: i + (a.at ?? 0) / 1e6 }));
    for (const a of actions) if (a.type === 'write' && !isAbsolute(a.path)) known.add(a.path);
    const kinds = [...new Set(actions.map((a) => kindOfAction(a, knownBefore)))];
    const kind = KIND_ORDER.find((k) => kinds.includes(k)) ?? 'other';
    // A non-Bash tool that errored showed nothing; a Bash call that exited non-zero may still
    // have shown output, so its per-path failures are judged by failedOn().
    const shown = !denied && !(isError && tool !== 'Bash' && tool !== 'PowerShell');
    const paths = [...new Set(actions.flatMap((a) => a.path != null ? [a.path] : a.paths ?? []))];
    events.push({
      i, pos: i, tool, input, resultText, isError, denied, exitCode, shown, kind, kinds, actions, paths,
      command: tool === 'Bash' ? String(input.command ?? '') : null,
      writes: actions.filter((a) => a.type === 'write'),
      runs: actions.filter((a) => a.type === 'run'),
      searches: actions.filter((a) => a.type === 'search' || (a.type === 'history' && a.pickaxe)),
    });
  });
  const finalMessage = String(traj?.final_message ?? '');
  // The task instruction (normalize/atif.mjs keeps it; older records may carry it on the record).
  const instruction = record?.instruction ?? traj?.extra?.pitwall?.instruction ?? null;
  return { events, messages, finalMessage, finalPos: calls.length, nCalls: calls.length, files, known, instruction };
}

// File roles. Tests and notes by path; docs and dot-files are neither implementation nor
// tests unless the caller lists them as implementation (e.g. a cell whose task is a README
// typo). /tmp and other absolute paths are scratch.
export function fileRole(path, { implFiles = [] } = {}) {
  if (path == null) return 'unknown';
  if (implFiles.some((f) => path === f || path.endsWith(`/${f}`))) return 'impl';
  if (isAbsolute(path)) return 'scratch';
  if (TEST_RE.test(path)) return 'test';
  if (NOTES_RE.test(path)) return 'notes';
  if (/\.(md|markdown|txt|rst|adoc)$/i.test(path)) return 'docs';
  if (/(^|\/)\.[^/]+$/.test(path) || /(^|\/)\.[^/]+\//.test(path)) return 'dot';
  if (/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(path)) return 'lock';
  return 'impl';
}
