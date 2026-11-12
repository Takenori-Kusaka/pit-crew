// Caller registration for item R2 (plan 34 §5, review §10.4), computed mechanically.
//
// The first registration (graders/process/phases.mjs:84-93) takes every source file whose text
// names a changed file. In a real repository that breaks: a labels file is named by hundreds.
// Here the registration is: the implementation files of the PRE-FIX tree that import or
// re-export-and-use a symbol the reference fix changed.
//
//   1. changed symbols  the exported declarations of each changed implementation file whose
//      lines the reference fix touches, plus the exports that use a touched internal
//      declaration (followed inside the file to a fixed point). When a hunk cannot be put in
//      any declaration, every export of the file counts (wide, never narrow).
//   2. importers        files whose import / re-export statements resolve to the changed file
//      and take one of those symbols (a namespace or default import counts when the symbol is
//      used through it; `export *` barrels are followed).
//   3. no cut           the registration is all N importers. The cap is in the level only:
//      level 2 = min(N, cap) or more opened, level 1 = at least one, level 0 = none, and
//      null (not applicable) when N = 0. Reported for cap 3, cap 5 and no cap.
// No type checker and no bundler: the reading is by text and is meant to be checked by a
// second derivation. What it cannot see is listed in `blind`.
import { spawnSync } from 'node:child_process';
import { dirname, posix } from 'node:path';
import { eventTable } from '../graders/process/events.mjs';
import { authoredTexts } from '../graders/process/authored.mjs';
import { seen, visibility } from '../graders/process/visibility.mjs';

export const CAPS = { cap3: 3, cap5: 5, none: Infinity };
const SOURCE = /\.(?:[cm]?[jt]sx?|svelte)$/;
const TEST = /(^|\/)[^/]+\.(test|spec|stories)\.[cm]?[jt]sx?$|(^|\/)(tests?|__tests__|e2e)\//;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const word = (name) => new RegExp(`(^|[^\\w$.])${esc(name)}(?![\\w$])`);

const git = (dir, args, input) => {
  const r = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: dir, maxBuffer: 1 << 30, input });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${String(r.stderr).slice(0, 200)}`);
  return r.stdout;
};

// Top-level declarations of a module: [{ name, exported, from, to }] (1-based lines, inclusive).
// A declaration starts on an unindented line and runs to the line before the next one.
const DECL = /^(export\s+)?(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|abstract\s+class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/;
export function declarations(text) {
  const ls = String(text).split('\n');
  const out = [];
  ls.forEach((l, i) => {
    const m = l.match(DECL);
    if (m) out.push({ name: m[2], exported: !!m[1], from: i + 1, to: ls.length });
    else if (/^export\s+default\b/.test(l)) out.push({ name: 'default', exported: true, from: i + 1, to: ls.length });
  });
  // Leading comments and decorators belong to the declaration below them.
  for (const d of out) { let k = d.from - 1; while (k > 0 && /^(\s*(\/\/|\/\*|\*)|@)/.test(ls[k - 1])) k--; d.from = k + 1; }
  out.forEach((d, i) => { if (out[i + 1]) d.to = out[i + 1].from - 1; });
  // `export { a, b as c }` lists export what is declared without the keyword.
  for (const m of String(text).matchAll(/^export\s*\{([^}]*)\}\s*;?\s*$/gm)) {
    for (const part of m[1].split(',')) { const [local, as] = part.trim().split(/\s+as\s+/); const d = out.find((x) => x.name === local); if (d) { d.exported = true; if (as) d.exportedAs = as.trim(); } }
  }
  return out;
}

// Old-side line ranges of a unified diff with no context: [{ from, to }]; an insertion between
// lines n and n+1 is the range n..n+1.
export function hunkRanges(diff) {
  const out = [];
  for (const m of String(diff).matchAll(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/gm)) {
    const start = Number(m[1]), n = m[2] === undefined ? 1 : Number(m[2]);
    out.push(n === 0 ? { from: start, to: start + 1 } : { from: start, to: start + n - 1 });
  }
  return out;
}

// The exported names of `text` that the hunks touch, directly or through internal declarations.
export function changedSymbols(text, ranges) {
  const decls = declarations(text);
  const ls = String(text).split('\n');
  const body = (d) => ls.slice(d.from - 1, d.to).join('\n');
  const touched = new Set();
  let unplaced = false;
  for (const r of ranges) {
    const hit = decls.filter((d) => d.from <= r.to && d.to >= r.from);
    if (!hit.length) unplaced = true;
    for (const d of hit) touched.add(d);
  }
  // An export that uses a touched internal declaration is changed too.
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of decls) if (!touched.has(d) && [...touched].some((t) => !t.exported && word(t.name).test(body(d)))) { touched.add(d); grew = true; }
  }
  const all = decls.filter((d) => d.exported).map((d) => d.exportedAs ?? d.name);
  // A hunk outside every declaration (imports, top-level statements): take every export.
  const names = unplaced || (touched.size && ![...touched].some((d) => d.exported)) ? all : [...touched].filter((d) => d.exported).map((d) => d.exportedAs ?? d.name);
  return { symbols: [...new Set(names)].sort(), wide: unplaced, exports: all.length };
}

// import / export-from / dynamic import / require statements of a module:
// [{ spec, names: [{ imported, local }], namespace, def, star, reexport, dynamic }]
export function imports(text) {
  const out = [];
  const t = String(text);
  const names = (s) => s.split(',').map((p) => p.trim().replace(/^type\s+/, '')).filter(Boolean).map((p) => { const [a, b] = p.split(/\s+as\s+/); return { imported: a.trim(), local: (b ?? a).trim() }; });
  for (const m of t.matchAll(/\b(import|export)\s+(?:type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
    const [, kw, clause, spec] = m;
    const e = { spec, names: [], namespace: null, def: null, star: false, reexport: kw === 'export', dynamic: false };
    const braces = clause.match(/\{([^}]*)\}/);
    if (braces) e.names = names(braces[1]);
    const ns = clause.match(/\*\s+as\s+([\w$]+)/);
    if (ns) e.namespace = ns[1]; else if (/^\s*\*/.test(clause)) e.star = true;
    const def = clause.replace(/\{[^}]*\}/, '').replace(/\*\s+as\s+[\w$]+/, '').replace(/,/g, '').trim();
    if (def && kw === 'import') e.def = def;
    out.push(e);
  }
  for (const m of t.matchAll(/\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ spec: m[1], names: [], namespace: null, def: null, star: false, reexport: false, dynamic: true });
  return out;
}

// Resolve an import specifier written in `from` to a path of the tree, or null (a package).
export function resolveSpec(spec, from, paths, aliases = { '$lib': 'src/lib' }) {
  let base = null;
  if (spec.startsWith('.')) base = posix.normalize(posix.join(dirname(from).replace(/\\/g, '/'), spec));
  else for (const [a, target] of Object.entries(aliases)) if (spec === a || spec.startsWith(`${a}/`)) base = posix.normalize(target + spec.slice(a.length));
  if (base == null) return null;
  const stem = base.replace(/\.(?:[cm]?js)$/, '');
  for (const c of [base, ...['.ts', '.tsx', '.js', '.mjs', '.cjs', '.svelte', '.svelte.ts'].flatMap((x) => [`${stem}${x}`, `${base}${x}`]), ...['index.ts', 'index.js', 'index.mjs'].map((x) => `${base}/${x}`)]) if (paths.has(c)) return c;
  return null;
}

// files: Map<path, text> of the pre-fix tree's source files. targets: { path: [symbols] }.
// Returns the implementation files that take one of the symbols: { callers: [path], via: { path: [how] } }.
export function importersOf(files, targets, { aliases, isImpl = (p) => !TEST.test(p) } = {}) {
  const paths = new Set(files.keys());
  // path -> Set of names it offers that lead to a changed symbol ('*' = all).
  const offer = new Map(Object.entries(targets).map(([p, s]) => [p, new Set(s)]));
  const parsed = new Map();
  for (const [p, text] of files) parsed.set(p, imports(text).map((i) => ({ ...i, to: resolveSpec(i.spec, p, paths, aliases) })).filter((i) => i.to));
  const users = new Map();
  let grew = true;
  while (grew) {
    grew = false;
    for (const [p, imps] of parsed) {
      if (p in targets) continue;
      for (const i of imps) {
        const offered = offer.get(i.to);
        if (!offered) continue;
        if (i.reexport) {
          // A barrel: it offers the same symbols under the names it re-exports.
          const mine = offer.get(p) ?? new Set();
          const before = mine.size;
          if (i.star) for (const s of offered) mine.add(s);
          for (const n of i.names) if (offered.has(n.imported) || offered.has('*')) mine.add(n.local);
          if (mine.size) offer.set(p, mine);
          if (mine.size !== before) grew = true;
          continue;
        }
        const text = files.get(p);
        const how = [];
        for (const n of i.names) if (offered.has(n.imported) || offered.has('*')) how.push(`named:${n.imported}`);
        if (i.namespace && [...offered].some((s) => s === '*' || new RegExp(`\\b${esc(i.namespace)}\\.${esc(s)}\\b`).test(text))) how.push('namespace');
        if (i.def && (offered.has('default') || offered.has('*'))) how.push('default');
        if (i.dynamic) how.push('dynamic');
        if (how.length && isImpl(p)) users.set(p, [...new Set([...(users.get(p) ?? []), ...how])]);
      }
    }
  }
  const barrels = [...offer.keys()].filter((p) => !(p in targets));
  return { callers: [...users.keys()].sort(), via: Object.fromEntries([...users].sort()), barrels: barrels.sort() };
}

// The registration for one task, from the clone: pre-fix tree, reference fix, implementation files.
export function registerCallers(gitDir, prefix, reference, implFiles, { aliases } = {}) {
  const tree = git(gitDir, ['ls-tree', '-r', '-l', prefix]).toString('utf8').split('\n').map((l) => l.match(/^\d+ blob ([0-9a-f]+)\s+(\d+)\t(.+)$/)).filter((m) => m && SOURCE.test(m[3]) && Number(m[2]) <= (1 << 20) && !m[3].startsWith('node_modules/'));
  const buf = git(gitDir, ['cat-file', '--batch'], `${tree.map((m) => m[1]).join('\n')}\n`);
  const files = new Map();
  let p = 0;
  for (const m of tree) {
    const nl = buf.indexOf(10, p);
    const size = Number(buf.subarray(p, nl).toString('utf8').split(' ')[2]);
    files.set(m[3], buf.subarray(nl + 1, nl + 1 + size).toString('utf8'));
    p = nl + 1 + size + 1;
  }
  const targets = {}, perFile = {};
  for (const f of implFiles.filter((x) => SOURCE.test(x) && files.has(x))) {
    const diff = git(gitDir, ['diff', '-U0', '--no-renames', prefix, reference, '--', f]).toString('utf8');
    const cs = changedSymbols(files.get(f), hunkRanges(diff));
    perFile[f] = { symbols: cs.symbols.length, wide: cs.wide, exports: cs.exports };
    if (cs.symbols.length) targets[f] = cs.symbols;
  }
  const r = importersOf(files, targets, { aliases });
  const callers = r.callers.filter((c) => !implFiles.includes(c));
  return {
    callers, n: callers.length, perFile, barrels: r.barrels.length,
    newFiles: implFiles.filter((x) => !files.has(x)).length,
    blind: ['re-exports through `export default`', 'symbols reached only through types of another module', 'string-built import paths', 'tsconfig paths other than the given aliases', 'usage inside the changed files themselves'],
  };
}

// R2 level for one cap: 0 none opened, 1 some, 2 at least min(N, cap); null when N = 0.
export function r2Level(opened, n, cap = Infinity) {
  if (!n) return null;
  if (opened >= Math.min(n, cap)) return 2;
  return opened > 0 ? 1 : 0;
}

// Grader hook: which registered callers were opened before `cutoff` (the first implementation
// edit), read from the tool-call facts in any form — Read, Grep with content, cat / sed / head
// in Bash, and file text shown by a loop or a pipe (matched by content when `texts` gives the
// callers' pre-fix text). A name in a listing is not "opened".
export function openedCallers(record, callers, { cutoff = Infinity, texts = {} } = {}) {
  const files = { ...Object.fromEntries(Object.entries(texts).map(([p, t]) => [p, { text: t }])), ...(record?.state?.files ?? {}) };
  const rec = { ...record, state: { ...(record?.state ?? {}), files } };
  const table = eventTable(rec);
  const vis = visibility(table, authoredTexts(rec, table));
  const rows = callers.map((p) => { const s = seen(vis, p, cutoff); return { path: p, level: s?.level ?? null, via: s?.via ?? null, pos: s?.pos ?? null, opened: !!s && s.level !== 'M' && s.via !== 'self' }; });
  const opened = rows.filter((r) => r.opened).length;
  return { rows, opened, n: callers.length, levels: Object.fromEntries(Object.entries(CAPS).map(([k, cap]) => [k, r2Level(opened, callers.length, cap)])) };
}
