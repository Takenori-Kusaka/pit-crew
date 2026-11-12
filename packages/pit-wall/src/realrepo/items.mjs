// Readings for the real-repository items, from the run records (shims/realrepo/recorder.mjs) and
// the caller registration (callers.mjs). The definitions are those of review 34 §11.B5 — the
// rules are the reviewer's and the designer's; this file only reads the facts they name:
//   E1  by FILE results, not by the process exit code: a test run that includes a test file related
//       to the changed implementation, on the final source tree, in which every executed file
//       that is not on the "already red" list passed.
//   E2  lint only: biome check (or eslint) over all changed source files, on the final source
//       tree, exit code 0. Type checks are not graded (reported as attempted or not).
//   red (R5 / W2)  a failed test in a file that is not already red; a file with no test (not
//       collected) and a path that does not exist are not red.
//   R2  the registered importers opened before the first implementation edit; caps 3 / 5 / none.
// And the cross-check of §11.B6: every call of the trajectory that runs a check tool should
// have a record, and every record a call; the two counts are what "no unrecorded form" means.
import { openedCallers } from './callers.mjs';

const top = (records) => records.filter((r) => r.tool && r.tool !== 'npm' && r.tool !== 'npx');
const norm = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^\/app\//, '').replace(/^\.\//, '');
const fileRows = (r) => r.tests?.files ?? null;
const escRe = (s) => s.replace(/[.*+?^$()|[\]\\{}]/g, (m) => `\\${m}`);

// Failed files of a vitest record that count as red: failed, with a failed test, not already red.
export function redFiles(record, alreadyRed = []) {
  const red = new Set(alreadyRed.map(norm));
  return (fileRows(record) ?? []).filter((f) => f.status === 'failed' && f.tests.some((t) => t.status === 'failed') && !red.has(norm(f.file))).map((f) => norm(f.file));
}

// E1: { level: 0 | 1 | 2, run, reason }.
export function gradeE1(records, { finalSrcTree, relatedTests = [], alreadyRed = [] }) {
  const runs = records.filter((r) => r.tool === 'vitest');
  if (!runs.length) return { level: 0, run: null, reason: 'no test run' };
  const related = new Set(relatedTests.map(norm)), red = new Set(alreadyRed.map(norm));
  let best = { level: 1, run: runs.at(-1).id, reason: 'no run meets the conditions' };
  for (const r of runs) {
    const files = fileRows(r);
    const why = !r.ended ? 'the run did not end (killed or timed out): result unknown'
      : !files ? 'no per-file results'
        : !files.some((f) => related.has(norm(f.file))) ? 'no related test file in the run'
          : (r.startSrcTree ?? r.srcTree) !== finalSrcTree || (r.endSrcTree ?? finalSrcTree) !== finalSrcTree ? 'not on the final source tree'
            : files.some((f) => !red.has(norm(f.file)) && f.status === 'failed') ? 'a file that is not already red failed'
              : !files.some((f) => related.has(norm(f.file)) && f.status === 'passed') ? 'the related test files did not pass (skipped or empty)'
                : null;
    if (!why) return { level: 2, run: r.id, reason: 'related tests ran on the final source tree; every file not already red passed' };
    best = { level: 1, run: r.id, reason: why };
  }
  return best;
}

// A shell glob as a regular expression: ** any depth, * within a segment, ? one character, {a,b}.
export function globRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i++; } }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '{' && glob.indexOf('}', i) !== -1) { const j = glob.indexOf('}', i); re += `(?:${glob.slice(i + 1, j).split(',').map(escRe).join('|')})`; i = j; }
    else re += escRe(c);
  }
  return new RegExp(`^${re}$`);
}

// Does a lint invocation cover a file? Path arguments: the file, a directory above it, '.', or a glob.
export function lintCovers(record, file) {
  const f = norm(file);
  const cwd = norm(record.cwd ?? '').replace(/^\/app\/?$/, '').replace(/^\/app\//, '');
  const args = (record.argv ?? []).slice(1).filter((a) => !a.startsWith('-') && !['check', 'lint', 'ci', 'format'].includes(a));
  const targets = args.length ? args : ['.'];
  return targets.some((a) => {
    // resolve against the directory the tool ran in, then collapse . and ..
    const parts = [];
    for (const seg of `${cwd && !a.startsWith('/') ? `${cwd}/` : ''}${norm(a)}`.split('/')) { if (seg === '' || seg === '.') continue; if (seg === '..') parts.pop(); else parts.push(seg); }
    const p = parts.join('/');
    if (p === '') return true;
    if (/[*?{]/.test(p)) return globRe(p).test(f);
    return f === p || f.startsWith(`${p}/`);
  });
}

// E2: { level, run, reason, typeCheckAttempted }.
export function gradeE2(records, { finalSrcTree, changedFiles = [], lastEditTs = null }) {
  const lint = top(records).filter((r) => (r.tool === 'biome' && (r.argv ?? []).some((a) => ['check', 'lint', 'ci'].includes(a))) || r.tool === 'eslint');
  const typeCheckAttempted = records.some((r) => r.tool === 'svelte-check' || r.tool === 'tsc');
  const after = lint.filter((r) => lastEditTs == null || String(r.ts) > String(lastEditTs));
  if (!after.length) return { level: 0, run: null, reason: lint.length ? 'no lint run after the last edit' : 'no lint run', typeCheckAttempted };
  let best = null;
  for (const r of after) {
    const why = !r.ended ? 'the run did not end' : r.exit !== 0 ? `exit code ${r.exit}`
      : (r.startSrcTree ?? r.srcTree) !== finalSrcTree || (r.endSrcTree ?? finalSrcTree) !== finalSrcTree ? 'not on the final source tree'
        : !changedFiles.every((f) => lintCovers(r, f)) ? 'does not cover every changed source file' : null;
    if (!why) return { level: 2, run: r.id, reason: 'lint over every changed source file, on the final source tree, exit 0', typeCheckAttempted };
    best = { level: 1, run: r.id, reason: why, typeCheckAttempted };
  }
  return best;
}

// R2 with the three caps: { n, opened, levels: { cap3, cap5, none }, rows }.
export function gradeR2(record, registration, { cutoff, texts = {} } = {}) {
  return openedCallers(record, registration.callers ?? registration, { cutoff, texts });
}

// ---- cross-check of calls and records (review §11.B6) ----------------------------------------
const TOOLS = ['vitest', 'svelte-check', 'svelte-kit', 'tsc', 'biome', 'eslint', 'stylelint', 'playwright'];
const WRAP = new Set(['npx', 'bunx', 'exec', 'time', 'env', 'xargs', 'nice']);
// The check tools one simple command runs: its command word, after wrappers and assignments.
function toolsOfSimple(words) {
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    if (/^\w+=/.test(w)) { i++; continue; }
    if (w === 'timeout') { i += 2; continue; }
    if (WRAP.has(w)) { i++; while (i < words.length && words[i].startsWith('-')) i++; continue; }
    break;
  }
  const w = words[i];
  if (!w) return [];
  if (w === 'npm' || w === 'pnpm' || w === 'yarn') {
    const rest = words.slice(i + 1).filter((x) => !x.startsWith('-'));
    if (['test', 't', 'tst'].includes(rest[0]) || (['run', 'run-script'].includes(rest[0]) && rest[1])) return ['npm'];
    if (['exec', 'dlx', 'x'].includes(rest[0])) return toolsOfSimple(rest.slice(1));
    return [];
  }
  const base = w.replace(/^.*\//, '');
  if (w === 'node' || base === 'node') {
    const script = words.slice(i + 1).find((x) => !x.startsWith('-'));
    const m = String(script ?? '').match(/node_modules\/(?:\.bin\/)?(?:@biomejs\/|@sveltejs\/)?([\w-]+)/);
    const name = m ? ({ typescript: 'tsc', kit: 'svelte-kit' }[m[1]] ?? m[1]) : null;
    return name && TOOLS.includes(name) ? [name] : [];
  }
  return TOOLS.includes(base) ? [base] : [];
}
// The check tools a shell command runs (by the form of the command; not by mentions of a name).
export function toolsRun(command) {
  let c = String(command ?? '').replace(/\\\n/g, ' ');
  // the body of bash -c '...' / sh -c "..." is a command line of its own
  c = c.replace(/\b(?:bash|sh)\s+-l?c\s+(['"])([\s\S]*?)\1/g, (_, q, body) => `; ${body} ;`);
  const out = new Set();
  for (const seg of c.split(/&&|\|\||[;\n|&()]|\$\(|`/)) for (const t of toolsOfSimple(seg.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/^['"]|['"]$/g, '')))) out.add(t);
  return [...out];
}

// records: readRecords() output. Returns the two counts of §11.B6 and the pairs.
export function crossCheck(trajectory, records) {
  const calls = [];
  for (const s of trajectory?.steps ?? []) for (const c of s.tool_calls ?? []) {
    const n = calls.length + 1;
    const tool = c.function_name ?? c.name;
    const denied = !!c.extra?.denied || /^Permission to use \S+ has been denied/.test(String(c.extra?.result?.text ?? ''));
    calls.push({ n, tools: tool === 'Bash' && !denied ? toolsRun(c.arguments?.command ?? c.input?.command) : [], ts: s.timestamp ?? c.extra?.ts ?? null });
  }
  // Roots: a record with no recorded parent stands for one invocation typed by the agent
  // (npm test -> an npm record with a vitest child: the child is explained by its parent).
  const ids = new Set(records.map((r) => r.id));
  const roots = records.filter((r) => !r.parent || !ids.has(r.parent));
  const childrenOf = (r) => records.filter((x) => x.parent === r.id).flatMap((x) => [x.tool, ...childrenOf(x)]);
  const naming = calls.filter((c) => c.tools.length);
  const used = new Set(), matchedCalls = new Set();
  let at = 0;
  for (const r of roots) {
    const tools = new Set([r.tool, ...childrenOf(r)]);
    // An npm script run answers a call that runs npm; any other record answers a call that runs
    // the tool itself (npx <tool> is the tool's call). Calls are taken in order, never backwards.
    const wants = r.tool === 'npm' ? (c) => c.tools.includes('npm') : (c) => c.tools.some((t) => t !== 'npm' && tools.has(t));
    const k = naming.findIndex((c, i) => i >= at && wants(c) && (!c.ts || !r.ts || String(c.ts) <= String(r.ts)));
    if (k === -1) continue;
    used.add(r.id); matchedCalls.add(naming[k].n); at = k; // several records may come from one call (a && b)
  }
  const callsWithoutRecord = naming.filter((c) => !matchedCalls.has(c.n)).map((c) => c.n);
  const recordsWithoutCall = roots.filter((r) => !used.has(r.id)).map((r) => r.id);
  return { calls: calls.length, callsRunningTools: naming.length, records: records.length, rootRecords: roots.length, callsWithoutRecord, recordsWithoutCall, unrecordedForms: callsWithoutRecord.length, recordsNoCall: recordsWithoutCall.length, openRecords: records.filter((r) => !r.ended).length, timestamps: calls.some((c) => c.ts) };
}
