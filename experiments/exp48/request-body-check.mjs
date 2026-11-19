#!/usr/bin/env node
// EXP-48, G4.partial open item (condition "gh-stand-in", review 12.3 e2): machine check, for every
// task, that the request body equals what the gh stand-in answers for the task's issue. No model,
// no docker: the stand-in is the copy in the task's build context (the file the image gets), asked
// in this process with the context's snapshot.
//   node experiments/exp48/request-body-check.mjs [--out <tracked json>] [id ...]
// Compared, per task:
//   cache      the author's issue cache (local/exp48-gq/cache/issues.json): title and body
//   copy       the author's issue copy (local/exp48-gq/issues/<issue>.md: "# <title>", blank line, body)
//   stand-in   `gh issue view <issue> --json title,body` and the plain `gh issue view <issue>`,
//              answered by <context>/pitwall-gh/gh.mjs from <context>/pitwall-gh/snapshot.json, for
//              the A/B/C tree and the D tree
//   request    local/exp48-gq/tasks/<id>/instruction.md (written by the task author): must contain
//              the body as one contiguous text. While that file does not exist the task is
//              "request not written" and the check does NOT pass (exit 1): nothing was compared.
// Equality is on the text with CRLF read as LF and trailing white space at the very end dropped;
// byte equality is reported next to it. Tracked output: ids, numbers, booleans, hashes. No text.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url'; // (order: the usual one is also a line of the subject)

export const norm = (s) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/\s+$/, '');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// The author's copy: first line "# <title>", then the body.
export function splitCopy(text) {
  const t = String(text).replace(/\r\n?/g, '\n');
  const nl = t.indexOf('\n');
  const first = nl === -1 ? t : t.slice(0, nl);
  if (!first.startsWith('# ')) return { title: null, body: t };
  return { title: first.slice(2), body: t.slice(nl + 1).replace(/^\n+/, '') };
}

// One task. cache: { title, body } | null; copy: text | null; standIn: { abc, d } each
// { json: { exit, title, body } | null, plain: { exit, stdout } | null } | null; instruction: text | null.
export function compareTask({ cache, copy, standIn, instruction }) {
  const row = { cache: !!cache, bodyChars: null, bodySha256: null, titleSha256: null, copy: null, standIn: {}, request: null, ok: false, why: [] };
  if (!cache) { row.why.push('the issue is not in the cache'); return row; }
  const body = norm(cache.body), title = norm(cache.title);
  row.bodyChars = body.length; row.bodySha256 = sha(body); row.titleSha256 = sha(title);
  if (copy == null) row.copy = { present: false };
  else {
    const c = splitCopy(copy);
    row.copy = { present: true, titleEqual: c.title != null && norm(c.title) === title, bodyEqual: norm(c.body) === body, bodyEqualBytes: c.body === String(cache.body) };
    if (!row.copy.bodyEqual) row.why.push('the issue copy differs from the cache');
  }
  for (const kind of ['abc', 'd']) {
    const s = standIn?.[kind];
    if (!s) { row.standIn[kind] = { present: false }; row.why.push(`no stand-in answer for the ${kind} tree`); continue; }
    const r = { present: true, jsonExit: s.json?.exit ?? null, titleEqual: s.json?.exit === 0 && norm(s.json.title) === title, bodyEqual: s.json?.exit === 0 && norm(s.json.body) === body, bodyEqualBytes: s.json?.exit === 0 && s.json.body === String(cache.body), plainExit: s.plain?.exit ?? null,
      // the plain view prints a header, a line "--", then the body
      plainEndsWithBody: s.plain?.exit === 0 && norm(s.plain.stdout).endsWith(`\n--\n${body}`) };
    row.standIn[kind] = r;
    if (!r.bodyEqual) row.why.push(`the stand-in's body differs on the ${kind} tree`);
    if (!r.titleEqual) row.why.push(`the stand-in's title differs on the ${kind} tree`);
    if (!r.plainEndsWithBody) row.why.push(`the stand-in's plain view does not end with the body on the ${kind} tree`);
  }
  if (instruction == null) { row.request = { written: false }; row.why.push('request not written'); }
  else {
    const t = norm(instruction);
    row.request = { written: true, chars: t.length, sha256: sha(t), containsBody: body.length > 0 && t.includes(body), containsTitle: title.length > 0 && t.includes(title), bodyOccurrences: body.length ? t.split(body).length - 1 : 0 };
    if (!row.request.containsBody) row.why.push('the request does not contain the issue body');
    if (!row.request.containsTitle) row.why.push('the request does not contain the issue title');
  }
  row.ok = row.why.length === 0;
  return row;
}

export function summarise(rows) {
  const n = (f) => rows.filter(f).length;
  return {
    tasks: rows.length,
    standInBodyEqualBothTrees: n((r) => r.standIn.abc?.bodyEqual && r.standIn.d?.bodyEqual),
    standInTitleEqualBothTrees: n((r) => r.standIn.abc?.titleEqual && r.standIn.d?.titleEqual),
    standInPlainEndsWithBodyBothTrees: n((r) => r.standIn.abc?.plainEndsWithBody && r.standIn.d?.plainEndsWithBody),
    copyEqualsCache: n((r) => r.copy?.bodyEqual),
    requestWritten: n((r) => r.request?.written),
    requestContainsBody: n((r) => r.request?.containsBody),
    ok: n((r) => r.ok),
    notOk: rows.filter((r) => !r.ok).map((r) => r.id),
  };
}

const self = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (self) {
  const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
  const L = join(ROOT, 'local/exp48-gq');
  const args = process.argv.slice(2);
  const oi = args.indexOf('--out');
  const outFile = resolve(ROOT, oi === -1 ? 'experiments/exp48/request-body-check.json' : args[oi + 1]);
  const only = args.filter((a, i) => /^v\d+$/.test(a) && i !== oi + 1);
  // Fail closed: without the cache or the task list nothing can be compared.
  const need = [join(L, 'cache/issues.json'), join(L, 'verify/ids.txt')];
  for (const f of need) if (!existsSync(f)) { process.stdout.write(`request-body-check: STOP — input missing: ${f}\n`); process.exit(1); }
  const cacheFile = join(L, 'cache/issues.json');
  const cacheRaw = readFileSync(cacheFile);
  const issues = new Map(JSON.parse(cacheRaw.toString('utf8')).map((i) => [i.number, i]));
  const ids = readFileSync(join(L, 'verify/ids.txt'), 'utf8').split('\n').filter(Boolean).filter((id) => !only.length || only.includes(id));
  const shimFile = join(ROOT, 'packages/pit-wall/shims/realrepo/gh.mjs');
  const shimSha = sha(readFileSync(shimFile));
  const rows = [];
  for (const id of ids) {
    const spec = JSON.parse(readFileSync(join(L, 'verify/specs', `${id}.json`), 'utf8'));
    const standIn = {}, ctx = {};
    for (const kind of ['abc', 'd']) {
      const dir = join(L, 'build', id, `tree-${kind}`, 'pitwall-gh');
      const gh = join(dir, 'gh.mjs'), snapFile = join(dir, 'snapshot.json');
      if (!existsSync(gh) || !existsSync(snapFile)) { standIn[kind] = null; ctx[kind] = { present: false }; continue; }
      const snapRaw = readFileSync(snapFile);
      const snap = JSON.parse(snapRaw.toString('utf8'));
      const { answer } = await import(pathToFileURL(gh).href);
      const j = answer(['issue', 'view', String(spec.issue), '--json', 'title,body'], snap);
      let parsed = null; try { parsed = JSON.parse(j.stdout); } catch { /* not JSON */ }
      const p = answer(['issue', 'view', String(spec.issue)], snap);
      standIn[kind] = { json: { exit: parsed ? j.exit : j.exit || 1, title: parsed?.title, body: parsed?.body }, plain: { exit: p.exit, stdout: p.stdout } };
      ctx[kind] = { present: true, ghSameAsShim: sha(readFileSync(gh)) === shimSha, snapshotSha256: sha(snapRaw), snapshotAsOf: snap.asOf, taskIssueFiledAfterDate: !!snap.meta?.taskIssueFiledAfterDate };
    }
    const copyFile = join(L, 'issues', `${spec.issue}.md`), instrFile = join(L, 'tasks', id, 'instruction.md');
    const c = issues.get(spec.issue);
    const row = compareTask({ cache: c ? { title: c.title, body: c.body ?? '' } : null, copy: existsSync(copyFile) ? readFileSync(copyFile, 'utf8') : null, standIn, instruction: existsSync(instrFile) ? readFileSync(instrFile, 'utf8') : null });
    rows.push({ id, issue: spec.issue, ...row, context: ctx });
  }
  const summary = summarise(rows);
  summary.contextGhSameAsShim = rows.filter((r) => ['abc', 'd'].every((k) => r.context[k]?.ghSameAsShim)).length;
  const doc = {
    what: 'EXP-48: request body == gh stand-in issue body, per task (G4.partial condition "gh-stand-in"). Machine result, no model, no docker. Ids, numbers, booleans and hashes only (sha256 of the normalised title / body / request; the snapshot file). A task whose request file is not written is not ok: nothing was compared.',
    date: new Date().toISOString(),
    inputs: { issueCacheSha256: sha(cacheRaw), ghShimSha256: shimSha, requestPath: 'local/exp48-gq/tasks/<id>/instruction.md', contexts: 'local/exp48-gq/build/<id>/tree-<abc|d>/pitwall-gh/' },
    summary, rows,
  };
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(doc, null, 1)}\n`);
  process.stdout.write(`request-body-check: ${JSON.stringify(summary)}\n`);
  process.stdout.write(summary.ok === summary.tasks ? 'request-body-check: ok\n' : `request-body-check: STOP — ${summary.tasks - summary.ok} of ${summary.tasks} task(s) not ok (${summary.tasks - summary.requestWritten} request(s) not written)\n`);
  process.exit(summary.ok === summary.tasks ? 0 : 1);
}
