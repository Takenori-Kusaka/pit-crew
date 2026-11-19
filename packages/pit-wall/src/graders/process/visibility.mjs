// What the agent could see, and when (research §3.2 steps 4-7). Shared by the phase checks
// ("was the file opened before the first edit") and the citation checks ("was the cited
// thing visible before it was written").
//
// Two sources, combined:
//   views   from parsed actions: Read with/without offset, cat, sed -n, head/tail, grep hit
//           lines, git show rev:path, diffs, listings.
//   content the text of non-error tool results, searched for the file's distinctive lines.
//           This is the primary test (§3.2 step 5): parsing misses pipes, loops and variables
//           (`for f in bin/*; do cat "$f"; done`), content matching does not.
// Levels: O = opened (the content or the cited range was visible), P = partial (out of
// range, grep hit lines only, a diff, a WebFetch summary, a subagent's relay), M = the name
// only (a listing, or the name mentioned in some output).

import { failedOn, fileRole } from './events.mjs';
import { esc } from './paths.mjs';

const norm = (l) => l.replace(/\s+/g, ' ').trim();
// grep -n / rg output ("bin/price:3:echo ..."), grep -H without -n ("bin/price:echo ..."),
// and context lines ("bin/price-2-...").
const HIT_LINE = /^((?:\.?\/)?[\w@.+-]+(?:\/[\w@.+-]+)*)(?::(\d+):|-(\d+)-|:(?=\S))/;
const READ_PREFIX = /^\s*\d+(?:\t|→)/; // Read tool line numbers

// Split one result text into plain lines (full content) and hit lines (grep / diff form).
export function splitResult(text, via) {
  const plain = [], hits = [], hitFiles = new Set(), diffFiles = new Set();
  let inDiff = false;
  for (const raw of String(text).split('\n')) {
    if (/^diff --git a\/(\S+)/.test(raw)) { inDiff = true; diffFiles.add(raw.match(/^diff --git a\/(\S+)/)[1]); continue; }
    if (/^\+\+\+ b\/(\S+)/.test(raw)) { diffFiles.add(raw.match(/^\+\+\+ b\/(\S+)/)[1]); continue; }
    if (/^(commit [0-9a-f]{7,}|Author:|Date:)/.test(raw)) { inDiff = false; plain.push(norm(raw)); continue; }
    if (inDiff) { if (/^(@@|index |--- |new file|deleted file)/.test(raw)) continue; hits.push(norm(raw.replace(/^[+\- ]/, ''))); continue; }
    const m = raw.match(HIT_LINE);
    if (m && (m[2] || m[3] || /[/.]/.test(m[1]))) { hitFiles.add(m[1].replace(/^\.\//, '')); hits.push(norm(raw.slice(m[0].length))); continue; }
    plain.push(norm(raw.replace(READ_PREFIX, '')));
  }
  if (via === 'hits') { hits.push(...plain); plain.length = 0; }
  return { plain: new Set(plain.filter(Boolean)), hits: new Set(hits.filter(Boolean)), hitFiles, diffFiles };
}

// Lines of a file that identify it: long enough, unique in the file and in the repo, not
// boilerplate. Lines the agent itself wrote anywhere are excluded, so the agent's own echo
// of a line is not taken as having seen the file.
const BOILER = /^(#!.*|fi|done|esac|else|then|do|end|[{}()[\];,]+|"""|'''|\/\*+|\*+\/|\/\/|#|set -[a-z]+|exit \d*|return\b.*|import .*|export \{.*\}|<\/?\w+>)$/;
export function distinctLines(files, agentLines) {
  const count = new Map();
  const per = {};
  for (const [p, t] of Object.entries(files ?? {})) {
    if (t == null) continue;
    const ls = [...new Set(String(t).split('\n').map(norm))].filter((l) => l.length >= 6 && /[A-Za-z0-9]/.test(l) && !BOILER.test(l));
    per[p] = ls;
    for (const l of ls) count.set(l, (count.get(l) ?? 0) + 1);
  }
  return Object.fromEntries(Object.entries(per).map(([p, ls]) => [p, ls.filter((l) => count.get(l) === 1 && !agentLines.has(l))]));
}

// Build the visibility context for one record.
export function visibility(table, authored = []) {
  const files = table.files ?? {};
  const agentLines = new Set(authored.flatMap((a) => String(a.text).split('\n').map(norm)).filter(Boolean));
  // Code the agent wrote (not its prose): used by existsAnywhere, which must not find a cited
  // name only in the very text that cites it.
  const codeLines = new Set();
  for (const e of table.events) for (const a of e.writes) if (a.text) for (const l of String(a.text).split('\n')) {
    agentLines.add(norm(l));
    if (!['notes', 'docs'].includes(fileRole(a.path))) codeLines.add(norm(l));
  }
  const distinct = distinctLines(files, agentLines);
  const lineCount = Object.fromEntries(Object.entries(files).map(([p, t]) => [p, t == null ? null : String(t).replace(/\n$/, '').split('\n').length]));
  const corpus = [];
  const views = [];
  const firstWrite = new Map(), deleted = new Map(), created = new Map();
  const ghViews = [];
  const webViews = [];
  // The instruction was shown before any call: the agent may cite the issue number or a
  // command from it without having opened anything.
  if (table.instruction) corpus.push({ pos: -1, i: -1, via: 'instruction', text: table.instruction, ...splitResult(table.instruction, 'instruction') });
  // Files the agent runtime puts into the context at start (Claude Code loads CLAUDE.md from
  // the working directory), so the agent has seen them without a tool call. The end-state text
  // stands in for the start text.
  for (const p of AUTO_CONTEXT) if (files[p] != null) {
    corpus.push({ pos: -1, i: -1, via: 'instruction', text: files[p], ...splitResult(files[p], 'instruction') });
    views.push({ path: p, pos: -1, range: { kind: 'full' }, version: null, i: -1, auto: true });
  }
  for (const e of table.events) {
    for (const a of e.actions) {
      if (a.type === 'write' && !firstWrite.has(a.path)) firstWrite.set(a.path, a.pos);
      // Whole-file writes with text the agent typed: afterwards the agent knows the content
      // (an in-place sed or an append does not show it the rest of the file).
      if (a.type === 'write' && a.authored && WHOLE.has(a.how) && !created.has(a.path)) created.set(a.path, a.pos);
      if (a.type === 'delete' && !deleted.has(a.path)) deleted.set(a.path, a.pos);
    }
    if (!e.shown) continue;
    const via = e.tool === 'Agent' || e.tool === 'Task' ? 'relay'
      : e.tool === 'WebFetch' ? 'web-summary' : e.tool === 'WebSearch' ? 'web-snippet'
        : e.tool === 'Grep' ? (e.input.output_mode === 'content' ? 'hits' : 'names')
          : e.tool === 'Glob' || e.tool === 'LS' ? 'names' : 'direct';
    const split = splitResult(e.resultText, via);
    corpus.push({ pos: e.pos, i: e.i, via, text: e.resultText, ...split });
    for (const a of e.actions) {
      if (a.type === 'read' && !failedOn(e.resultText, a.path) && e.resultText.trim()) views.push({ path: a.path, pos: a.pos, range: a.range, version: a.version ?? null, i: e.i });
      if (a.type === 'search' && a.mode === 'hits') {
        const single = a.paths.length === 1 && e.resultText.trim();
        for (const p of a.paths) if (split.hitFiles.has(p) || (single && !failedOn(e.resultText, p))) views.push({ path: p, pos: a.pos, range: { kind: 'hits' }, i: e.i });
        for (const p of split.hitFiles) if (!a.paths.includes(p)) views.push({ path: p, pos: a.pos, range: { kind: 'hits' }, i: e.i });
      }
      if (a.type === 'search' && a.mode !== 'hits') for (const p of split.plain) views.push({ path: p, pos: a.pos, range: { kind: 'names' }, i: e.i });
      if (a.type === 'history') for (const p of split.diffFiles) views.push({ path: p, pos: a.pos, range: { kind: a.patch ? 'diff' : 'names' }, i: e.i });
      if (a.type === 'gh' && a.number != null && e.resultText.trim() && !/not found|Could not resolve|no (issue|pull request)/i.test(e.resultText)) ghViews.push({ number: a.number, kind: a.kind, pos: a.pos });
      if (a.type === 'gh' && a.number != null && /not found|Could not resolve|no (issue|pull request)/i.test(e.resultText)) ghViews.push({ number: a.number, kind: a.kind, pos: a.pos, missing: true });
      if (a.type === 'web') webViews.push({ ...a, pos: a.pos, via });
    }
  }
  return { files, distinct, lineCount, corpus, views, firstWrite, created, deleted, ghViews, webViews, agentLines, codeLines, known: table.known, hasState: table.files != null };
}

const WHOLE = new Set(['Write', 'redirect', 'tee']);
export const AUTO_CONTEXT = ['CLAUDE.md', '.claude/CLAUDE.md'];
const RANK = { O: 3, P: 2, M: 1 };
// Results whose text is shown to the agent as is (not a summary, snippet or relay).
const FULL_VIA = new Set(['direct', 'instruction']);
const better = (a, b) => (!a || (b && RANK[b.level] > RANK[a.level]) ? b : a);

// How much of `path` was visible strictly before `before`. Optional `line` / `to` ask about a
// cited line range. Returns { level: 'O'|'P'|'M', via, pos } or null.
export function seen(vis, path, before, { line = null, to = null, minShare = 0.6 } = {}) {
  let best = null;
  const fw = vis.created.get(path);
  if (fw != null && fw < before) best = { level: 'O', via: 'self', pos: fw };
  const n = vis.lineCount[path] ?? null;
  for (const v of vis.views) {
    if (v.path !== path || v.pos >= before) continue;
    const r = v.range;
    let level;
    if (r.kind === 'full') level = 'O';
    else if (r.kind === 'lines') {
      const covers = line != null ? line >= r.from && (to ?? line) <= r.to : n != null && r.from <= 1 && r.to >= n;
      level = covers ? 'O' : 'P';
    } else if (r.kind === 'tail') level = line == null && n != null && r.n >= n ? 'O' : 'P';
    else if (r.kind === 'names') level = 'M';
    else level = 'P'; // filtered, hits, diff
    best = better(best, { level, via: `view:${r.kind}`, pos: v.pos });
    if (best.level === 'O' && best.via !== 'self') break;
  }
  // Content: the file's distinctive lines in an earlier result.
  const lines = vis.distinct[path] ?? [];
  const citedText = line != null && vis.files[path] != null ? String(vis.files[path]).split('\n').slice(line - 1, to ?? line).map(norm).filter(Boolean) : null;
  if (lines.length && (!best || best.level !== 'O')) {
    for (const c of vis.corpus) {
      if (c.pos >= before) break;
      const inPlain = lines.filter((l) => c.plain.has(l)).length;
      const inHits = lines.filter((l) => c.hits.has(l)).length;
      const share = inPlain / lines.length;
      const plainLevel = FULL_VIA.has(c.via) ? 'O' : 'P';
      if (share >= minShare) {
        // A cited line must itself be among what was shown.
        const ok = !citedText || citedText.every((l) => c.plain.has(l));
        best = better(best, { level: ok ? plainLevel : 'P', via: `content:${c.via}`, pos: c.pos });
      } else if (inPlain || inHits) best = better(best, { level: 'P', via: `content:${c.via}`, pos: c.pos });
      if (best?.level === 'O') break;
    }
  }
  if (!best || RANK[best.level] < RANK.M) {
    const base = path.replace(/^.*\//, '');
    const re = new RegExp(`(^|[^\\w.-])${esc(base)}($|[^\\w-])`);
    for (const c of vis.corpus) { if (c.pos >= before) break; if (c.text.includes(path) || re.test(c.text)) { best = better(best, { level: 'M', via: 'name', pos: c.pos }); break; } }
  }
  return best;
}

// Does a text token (identifier, number, quoted string) appear in an earlier result?
// Returns { level, via, pos } (O when in full content shown directly, P for hits / relay /
// web) or null.
export function tokenSeen(vis, token, before, { word = true } = {}) {
  const t = norm(token);
  if (!t) return null;
  const re = word ? new RegExp(`(^|[^\\w])${esc(t)}($|[^\\w])`) : null;
  const has = (set) => { for (const l of set) if (re ? re.test(l) : l.includes(t)) return true; return false; };
  let best = null;
  for (const c of vis.corpus) {
    if (c.pos >= before) break;
    if (has(c.plain)) best = better(best, { level: FULL_VIA.has(c.via) ? 'O' : 'P', via: c.via, pos: c.pos });
    else if (has(c.hits)) best = better(best, { level: 'P', via: `${c.via}:hits`, pos: c.pos });
    if (best?.level === 'O') break;
  }
  return best;
}

// Does the token occur anywhere the record can show: any tool result, any end-state file,
// any code the agent wrote? (Not its prose, which is where the citation itself is.)
export function existsAnywhere(vis, token) {
  const re = new RegExp(`(^|[^\\w])${esc(norm(token))}($|[^\\w])`);
  if (vis.corpus.some((c) => re.test(c.text))) return true;
  // End-state files, except the notes and docs the agent itself wrote: a fabricated path cited in
  // the agent's own report is in that file, which would make every fabrication "exist" (found by
  // the Q2 cells' controls, 2026-11-04: X was unreachable).
  if (Object.entries(vis.files).some(([p, t]) => t != null && !(vis.firstWrite.has(p) && ['notes', 'docs'].includes(fileRole(p))) && re.test(t))) return true;
  for (const l of vis.codeLines) if (re.test(l)) return true;
  return false;
}

export { fileRole };
