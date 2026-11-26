// What a fixture may declare to stage a scene (kit/schema/role-spec.md, the fixture table): staged history, a
// remote with several branches, a seeded snapshot for the gh stand-in, and a layer on an existing tree image.
// This module only READS a fixture's declarations and turns them into what the builders take (fixture.mjs,
// capture.mjs `kitConf`, shims/gh). It knows no role, no scene and no project: every text comes from the fixture
// directory (or from a path the fixture names — material that is not tracked is given that way).
//
//   stage         [{ message, files?, files_dir?, remove?, date?, author? }]  commits on top of the base tree
//   remote        true | { branch, branches?, local?, start?, unpushed?, ahead? } (capture.mjs remoteOf: the simple form)
//   gh_snapshot   { file?, add?, drop?, refuse?, repo? }
//   layer         { image, base_head?, capture?, local_base? }
import { createHash } from 'node:crypto';
import { readFileSync, existsSync as exists, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { listFiles } from './gen-cases.mjs';

const lf = (t) => String(t).replace(/\r\n/g, '\n');
const strip = (t) => lf(t).replace(/\n$/, '');
const plainPath = (p) => typeof p === 'string' && p !== '' && !p.startsWith('/') && !p.split('/').includes('..') && !/[\n\t\\]/.test(p);
const at = (dir, p) => (isAbsolute(p) ? p : join(dir, p));
const BASE_DATE = Date.parse('2026-01-05T10:00:00Z');
const DATE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d)$/;
const stamp = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, '+00:00');

// ---- staged history ---------------------------------------------------------------------------------------------
// Each entry is one commit made before the agent starts, in order, with a fixed author and a fixed date (entry k:
// the fixture's date + k days, unless `date` is given) — the same ids on every build.
//   files      { path: text | null }   null removes the file          files_dir  a directory of the fixture whose files
//   remove     [paths]                                                 are written (path = the path under it)
export function stageOf(fx, fixtureDir) {
  if (fx?.stage === undefined || fx.stage === null) return [];
  if (!Array.isArray(fx.stage) || !fx.stage.length) throw new Error('fixture stage: a list of commits ({ message, files })');
  return fx.stage.map((s, k) => {
    const where = `fixture stage[${k}]`;
    if (!s || typeof s !== 'object' || typeof s.message !== 'string' || !s.message.trim()) throw new Error(`${where}: a commit needs a message`);
    const files = {};
    if (s.files_dir !== undefined) {
      const root = at(fixtureDir, String(s.files_dir));
      if (!exists(root) || !statSync(root).isDirectory()) throw new Error(`${where}: files_dir ${s.files_dir} is not a directory`);
      for (const rel of listFiles(root)) files[rel] = strip(readFileSync(join(root, rel), 'utf8'));
    }
    for (const [p, t] of Object.entries(s.files ?? {})) files[p] = t === null ? null : strip(String(t));
    for (const p of s.remove ?? []) files[p] = null;
    for (const p of Object.keys(files)) if (!plainPath(p) || /'/.test(p)) throw new Error(`${where}: ${JSON.stringify(p)} is not a plain relative path`);
    const date = s.date === undefined ? stamp(BASE_DATE + (k + 1) * 86400e3) : String(s.date);
    if (!DATE.test(date)) throw new Error(`${where}: date ${date} is not YYYY-MM-DDThh:mm:ss+00:00`);
    if (s.author !== undefined && !/^[\w .-]+$/.test(String(s.author))) throw new Error(`${where}: author ${s.author} is not a plain name`);
    return { date, message: strip(s.message), ...(s.author !== undefined ? { author: String(s.author) } : {}), files };
  });
}

// ---- a remote with declared branches ----------------------------------------------------------------------------
//   branch     the mainline's name (the fixture's own branch is renamed to it), default main
//   branches   { <name>: <revision> }  the branches of the remote; a revision is HEAD or HEAD~<n>, relative to the
//              head the fixture built (after the staged commits). The mainline is at HEAD unless listed.
//   local      { <name>: <remote branch it tracks> | null }  the local branches at the start (default: the start
//              branch, tracking the branch of its own name when the remote has it)
//   start      the branch the agent starts on (default: the mainline). Its revision must be HEAD: the tree the agent
//              starts in is the tree the fixture built.
//   unpushed   [names]  branches that exist locally only at the start (not on the remote)
//   ahead      { <branch>: [{ message, files, author?, date? }] }  commits that exist ON THE REMOTE ONLY at the start: made
//              on top of that remote branch after it is pushed, and not fetched (the local branch and its
//              refs/remotes/origin/<branch> stay where the fixture built them). Another person's work the agent has not
//              seen yet: a push that does not take it in first is a rewrite of the remote (Dev round 2, scene g0026-1).
//              files: { path: text | null } (null removes). Dates default to after every staged commit.
// Returns null (no extended form: capture.mjs remoteOf's { branch } stands), or
//   { branch, branches, local, start, unpushed } with every default filled in.
const BRANCH = /^[\w][\w./-]*$/;
export function remoteBranchesOf(fx) {
  const r = fx?.remote;
  if (!r || typeof r !== 'object' || !['branches', 'local', 'start', 'unpushed', 'ahead'].some((k) => r[k] !== undefined)) return null;
  const branch = r.branch ? String(r.branch) : 'main';
  const name = (n, where) => { if (!BRANCH.test(String(n))) throw new Error(`fixture remote.${where}: ${n} is not a plain branch name`); return String(n); };
  const branches = {};
  for (const [n, rev] of Object.entries(r.branches ?? {})) {
    if (!/^HEAD(?:~\d+)?$/.test(String(rev))) throw new Error(`fixture remote.branches.${n}: ${rev} is not HEAD or HEAD~<n>`);
    branches[name(n, 'branches')] = String(rev);
  }
  if (!(branch in branches)) branches[name(branch, 'branch')] = 'HEAD';
  const start = name(r.start ?? branch, 'start');
  if (!(start in branches)) throw new Error(`fixture remote.start: ${start} is not one of remote.branches`);
  if (branches[start] !== 'HEAD') throw new Error(`fixture remote.start: ${start} is at ${branches[start]}; the start branch is at HEAD (the tree the fixture built)`);
  const unpushed = [].concat(r.unpushed ?? []).map((n) => name(n, 'unpushed'));
  for (const n of unpushed) if (!(n in branches)) throw new Error(`fixture remote.unpushed: ${n} is not one of remote.branches`);
  const onRemote = (n) => n in branches && !unpushed.includes(n);
  const local = {};
  for (const [n, up] of Object.entries(r.local ?? { [start]: onRemote(start) ? start : null })) {
    if (!(name(n, 'local') in branches)) throw new Error(`fixture remote.local: ${n} is not one of remote.branches`);
    if (up !== null && up !== false && !onRemote(String(up))) throw new Error(`fixture remote.local.${n}: ${up} is not a branch of the remote`);
    local[n] = up === null || up === false ? null : String(up);
  }
  if (!(start in local)) throw new Error(`fixture remote.local: the start branch ${start} is not listed`);
  const ahead = [];
  if (r.ahead !== undefined) {
    if (!r.ahead || typeof r.ahead !== 'object' || Array.isArray(r.ahead)) throw new Error('fixture remote.ahead: { <branch>: [commits] }');
    for (const [n, list] of Object.entries(r.ahead)) {
      if (!onRemote(name(n, 'ahead'))) throw new Error(`fixture remote.ahead: ${n} is not a branch of the remote`);
      if (!Array.isArray(list) || !list.length) throw new Error(`fixture remote.ahead.${n}: a list of commits`);
      list.forEach((c, k) => {
        const where = `fixture remote.ahead.${n}[${k}]`;
        if (!c || typeof c.message !== 'string' || !c.message.trim()) throw new Error(`${where}: a commit needs a message`);
        if (!c.files || typeof c.files !== 'object' || !Object.keys(c.files).length) throw new Error(`${where}: a commit needs files`);
        const files = {};
        for (const [p, t] of Object.entries(c.files)) { if (!plainPath(p) || /'/.test(p)) throw new Error(`${where}: ${JSON.stringify(p)} is not a plain relative path`); files[p] = t === null ? null : strip(String(t)); }
        const date = c.date === undefined ? stamp(BASE_DATE + (200 + ahead.length) * 86400e3) : String(c.date);
        if (!DATE.test(date)) throw new Error(`${where}: date ${date} is not YYYY-MM-DDThh:mm:ss+00:00`);
        if (c.author !== undefined && !/^[\w .-]+$/.test(String(c.author))) throw new Error(`${where}: author ${c.author} is not a plain name`);
        ahead.push({ branch: n, message: strip(c.message), author: c.author !== undefined ? String(c.author) : 'fixture', date, files });
      });
    }
  }
  return { branch, branches, local, start, unpushed, ...(ahead.length ? { ahead } : {}) };
}
// The files of the kit's configuration for the remote-only commits (kit-setup.sh reads remote-ahead/<k>/).
export function remoteAheadFiles(ahead) {
  const out = {};
  (ahead ?? []).forEach((c, k) => {
    const d = `remote-ahead/${String(k).padStart(3, '0')}`;
    out[`${d}/branch`] = `${c.branch}\n`; out[`${d}/message`] = `${c.message}\n`; out[`${d}/author`] = `${c.author}\n`; out[`${d}/date`] = `${c.date}\n`;
    out[`${d}/files.tsv`] = Object.entries(c.files).map(([p, t]) => `${t === null ? 'rm' : 'put'}\t${p}\n`).join('');
    for (const [p, t] of Object.entries(c.files)) if (t !== null) out[`${d}/f/${p}`] = `${t}\n`;
  });
  return out;
}
// The lines of the kit's configuration file `remote.tsv` (kit-setup.sh reads them).
export const remoteTsv = (r) => [
  ...Object.entries(r.branches).map(([n, rev]) => `branch\t${n}\t${rev}`),
  ...r.unpushed.map((n) => `unpushed\t${n}`),
  ...Object.entries(r.local).map(([n, up]) => `local\t${n}\t${up ?? '-'}`),
  `start\t${r.start}`,
].map((l) => `${l}\n`).join('');

// ---- a seeded snapshot for the gh stand-in ----------------------------------------------------------------------
//   file     a JSON file (relative to the fixture directory, or absolute): { repo?, lastNumber?, absent?,
//            issues: { <n>: item }, prs: { <n>: item } }. An item uses gh's own JSON field names: number, title,
//            body, state (OPEN | CLOSED | MERGED), author { login }, labels [{ name }], createdAt, closedAt,
//            mergedAt, url, and for a pull request baseRefName, headRefName, isDraft; comments [{ author, body }].
//   add      [{ kind: issue | pr, number, title, body?, state?, author?, labels?, base?, head?, draft?, comments? }]
//            synthetic items, added after the file (a number that is already there is replaced)
//   drop     [numbers]  left out: the stand-in answers "could not resolve" for them, as for a number that does not exist
//   refuse   ['pr merge', 'pr review', ...]  calls the account has no right to make: they fail and change nothing
//   repo     owner/name used in URLs (default: the file's, else example/repo)
// Returns null, or { files: { <name>: text } (the snapshot directory), seed (what the grader may join on), sha256 }.
const login = (a) => (typeof a === 'string' ? a : a?.login ?? '');
const labelNames = (l) => (Array.isArray(l) ? l : l?.nodes ?? []).map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean);
const flat = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const cell = (s) => { const v = flat(s); return v === '' ? '-' : v; };
const REFUSE = /^(?:issue|pr) [a-z-]+$/;
export function ghSnapshotOf(fx, fixtureDir) {
  const d = fx?.gh_snapshot;
  if (d === undefined || d === null || d === false) return null;
  if (typeof d !== 'object' || Array.isArray(d)) throw new Error('fixture gh_snapshot: { file, add, drop, refuse }');
  let base = { issues: {}, prs: {} };
  if (d.file !== undefined) {
    const f = at(fixtureDir, String(d.file));
    if (!exists(f)) throw new Error(`fixture gh_snapshot.file: ${d.file} does not exist`);
    try { base = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { throw new Error(`fixture gh_snapshot.file: ${d.file} is not JSON (${String(e.message).slice(0, 80)})`); }
  }
  const repo = String(d.repo ?? base.repo ?? 'example/repo');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`fixture gh_snapshot.repo: ${repo} is not owner/name`);
  const items = new Map();
  const put = (kind, o, where) => {
    const n = Number(o?.number);
    if (!Number.isInteger(n) || n < 1) throw new Error(`fixture gh_snapshot ${where}: an item needs a number`);
    const state = o.state === undefined || o.state === null ? null : String(o.state).toUpperCase();
    if (state !== null && !['OPEN', 'CLOSED', 'MERGED'].includes(state)) throw new Error(`fixture gh_snapshot ${where} #${n}: state ${o.state} is not OPEN, CLOSED or MERGED`);
    const it = { kind, number: n, title: flat(o.title), body: strip(o.body ?? ''), state, author: login(o.author), labels: labelNames(o.labels), createdAt: o.createdAt ?? o.created_at ?? null,
      closedAt: o.closedAt ?? null, mergedAt: o.mergedAt ?? null,
      ...(kind === 'pr' ? { base: o.baseRefName ?? o.base ?? null, head: o.headRefName ?? o.head ?? null, draft: (o.isDraft ?? o.draft) === true } : {}),
      comments: (o.comments ?? []).map((c) => ({ author: login(c.author) || 'someone', body: strip(c.body ?? ''), createdAt: c.createdAt ?? c.created_at ?? null })) };
    items.set(n, it);
  };
  for (const o of Object.values(base.issues ?? {})) put('issue', o, 'file issues');
  for (const o of Object.values(base.prs ?? {})) put('pr', o, 'file prs');
  for (const [k, o] of (d.add ?? []).entries()) {
    if (o?.kind !== 'issue' && o?.kind !== 'pr') throw new Error(`fixture gh_snapshot.add[${k}]: kind is issue or pr`);
    put(o.kind, { state: 'OPEN', ...o }, `add[${k}]`);
  }
  const drop = [].concat(d.drop ?? []).map(Number);
  for (const n of drop) { if (!Number.isInteger(n)) throw new Error('fixture gh_snapshot.drop: a list of numbers'); items.delete(n); }
  const absent = [...new Set([...(base.absent ?? []).map(Number), ...drop])].filter((n) => !items.has(n)).sort((a, b) => a - b);
  const refuse = [].concat(d.refuse ?? []).map(String);
  for (const r of refuse) if (!REFUSE.test(r)) throw new Error(`fixture gh_snapshot.refuse: ${r} is not "<issue|pr> <command>"`);
  const last = Math.max(Number(base.lastNumber) || 0, ...items.keys(), ...absent, 0);
  const sorted = [...items.values()].sort((a, b) => b.number - a.number);
  const url = (it) => `https://github.com/${repo}/${it.kind === 'pr' ? 'pull' : 'issues'}/${it.number}`;
  const files = {
    'index.tsv': sorted.map((it) => [it.number, it.kind, it.state ?? '-', it.kind === 'pr' ? String(it.draft) : '-', cell(it.base), cell(it.head), cell(it.author), cell(it.labels.map((l) => l.replace(/,/g, ' ')).join(',')), cell(it.createdAt), flat(it.title)].join('\t')).map((l) => `${l}\n`).join(''),
    last: `${last}\n`, repo: `${repo}\n`,
    ...(absent.length ? { absent: absent.map((n) => `${n}\n`).join('') } : {}),
    ...(refuse.length ? { refuse: refuse.map((r) => `${r}\n`).join('') } : {}),
  };
  for (const it of sorted) {
    files[`body-${it.number}.md`] = `${it.body}\n`;
    if (it.comments.length) files[`comments-${it.number}.txt`] = it.comments.map((c) => `${c.author}${c.createdAt ? ` (${c.createdAt})` : ''}:\n${c.body}\n--\n`).join('');
    files[`item-${it.number}.json`] = `${JSON.stringify({ number: it.number, title: it.title, body: it.body, ...(it.state ? { state: it.state } : {}), author: { login: it.author }, labels: it.labels.map((name) => ({ name })),
      ...(it.createdAt ? { createdAt: it.createdAt } : {}), ...(it.kind === 'issue' ? { closedAt: it.closedAt } : { mergedAt: it.mergedAt, isDraft: it.draft, baseRefName: it.base ?? '', headRefName: it.head ?? '' }),
      url: url(it), comments: it.comments.map((c) => ({ author: { login: c.author }, body: c.body, ...(c.createdAt ? { createdAt: c.createdAt } : {}) })) })}\n`;
  }
  // what the grader may join on: the pull requests and the synthetic items by number (the issues of a large
  // snapshot are counted, not listed), the numbers left out, the refused calls
  const added = new Set((d.add ?? []).map((o) => Number(o.number)));
  const seed = {
    repo, last, issues: sorted.filter((it) => it.kind === 'issue').length, pull_requests: sorted.filter((it) => it.kind === 'pr').length,
    items: Object.fromEntries(sorted.filter((it) => it.kind === 'pr' || added.has(it.number)).sort((a, b) => a.number - b.number)
      .map((it) => [it.number, { kind: it.kind, state: it.state, ...(it.kind === 'pr' ? { draft: it.draft, base: it.base, head: it.head } : {}), author: it.author, added: added.has(it.number) }])),
    absent, refuse,
  };
  const sha256 = createHash('sha256').update(JSON.stringify(Object.entries(files).sort())).digest('hex');
  return { files, seed, sha256 };
}

// ---- a layer on an existing tree image --------------------------------------------------------------------------
//   image       the base image (built elsewhere: the agent image + the project's tree as a git repository in /app,
//               with its dependencies). The task image is FROM it; the base is never rebuilt here.
//   base_head   the HEAD of /app in that image (40 hex). When given, the build fails on another base.
//   capture     globs of paths whose text is recorded at the start and at the end even when they did not change
//               (the paths that changed are always recorded)
//   local_base  a directory (relative to the fixture directory, or absolute) that stands for the base tree when the
//               case is replayed without a container. Not written into any image.
// The fixture's `files_dir`, when the directory exists, holds copies of base files the fixture KNOWS (what a
// scripted control edits): they are not written into the image either; the build checks that they are the base's.
// Returns null, or { image, base_head?, capture, known: { path: text }, localBase: <absolute path> | null }.
export function layerOf(fx, fixtureDir) {
  const d = fx?.layer;
  if (d === undefined || d === null || d === false) return null;
  if (typeof d !== 'object' || typeof d.image !== 'string' || !/^[\w][\w./:@-]*$/.test(d.image)) throw new Error('fixture layer: { image: <image reference> }');
  if (d.base_head !== undefined && !/^[0-9a-f]{40}$/.test(String(d.base_head))) throw new Error('fixture layer.base_head: a 40-hex commit id');
  const capture = [].concat(d.capture ?? []).map(String);
  for (const g of capture) if (!plainPath(g.replace(/\*/g, 'x')) || /\s/.test(g)) throw new Error(`fixture layer.capture: ${g} is not a plain glob`);
  const root = join(fixtureDir, fx.files_dir ?? 'files');
  const known = {};
  if (exists(root)) for (const rel of listFiles(root)) known[rel] = strip(readFileSync(join(root, rel), 'utf8'));
  let localBase = null;
  if (d.local_base !== undefined) {
    localBase = at(fixtureDir, String(d.local_base));
    if (!exists(localBase) || !statSync(localBase).isDirectory()) throw new Error(`fixture layer.local_base: ${d.local_base} is not a directory`);
  }
  return { image: d.image, ...(d.base_head ? { base_head: String(d.base_head) } : {}), capture, known, localBase };
}

// Does the fixture declare any of the things above (beyond the simple `remote: true | { branch }`)?
export const declaresScene = (fx) => !!(fx?.stage || fx?.gh_snapshot || fx?.layer || remoteBranchesOf(fx));
