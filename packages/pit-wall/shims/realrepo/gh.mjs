// gh stand-in for a real-repository task (owner decision 2026-11-13: arm D close to real
// operation). It answers what a developer's workflow READS — issues, pull requests, labels —
// from a frozen snapshot of the repository as of the pre-fix commit (gh-snapshot.mjs), and
// nothing else:
//   - a request the snapshot cannot answer (a number that is not recorded, a field that is not
//     recorded, comments, checks, diffs, runs, search, any write) FAILS with exit 1 and a line
//     on stderr that says so. Nothing is made up. (process v2 G4: "記録に無い形には答えを作らず、
//     明示の失敗を返して数える")
//   - a number beyond the last one that existed at the snapshot date gets gh's own
//     "Could not resolve" error: that issue did not exist yet.
//   - --json filters the fields here (no dependence on a tool being in the image); --jq is passed
//     to `jq` when the image has it, and fails as not supported otherwise.
// Earlier stand-in (shims/gh) defects this one does not have (qm-grader-audit.md): field
// filtering needed node, unknown PR numbers got a fabricated PR, the backing files were in the
// work tree. Here the snapshot is $PITWALL_GH_SNAPSHOT (default /opt/pitwall/gh/snapshot.json),
// outside the work tree. The agent runs as root and could still read that file: it holds only
// what the stand-in would answer anyway.
// Every call is logged to $PITWALL_GH_LOG_DIR (default /var/pitwall/gh): calls.jsonl with
// { ts, argv, exit, answered: 'snapshot' | 'not-recorded' | 'unresolved' | 'refused' | 'usage', what }.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ISSUE_FIELDS = ['number', 'title', 'body', 'state', 'createdAt', 'closedAt', 'author', 'labels', 'url'];
const PR_FIELDS = ['number', 'title', 'body', 'state', 'createdAt', 'mergedAt', 'author', 'labels', 'url', 'baseRefName', 'headRefName', 'additions', 'deletions', 'changedFiles'];
const VALUE_FLAGS = new Set(['-R', '--repo', '--json', '-q', '--jq', '-t', '--template', '-s', '--state', '-l', '--label', '-L', '--limit', '-S', '--search', '-B', '--base', '-H', '--head', '-a', '--assignee', '-A', '--author', '--method', '-X', '-f', '-F', '--field', '--raw-field', '-m', '--milestone', '--mention', '--app', '--hostname', '-b', '--body', '--body-file', '--title', '--add-label', '--remove-label', '--input', '--paginate-limit']);
const READ_SUBS = { issue: ['view', 'list', 'status'], pr: ['view', 'list', 'status'], label: ['list'], repo: ['view'], api: null, auth: ['status'] };

export function parse(argv) {
  const pos = [], flags = {};
  for (let i = 0; i !== argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--') && a.includes('=')) { const k = a.slice(0, a.indexOf('=')); (flags[k] ??= []).push(a.slice(a.indexOf('=') + 1)); }
    else if (VALUE_FLAGS.has(a)) { (flags[a] ??= []).push(argv[++i] ?? ''); }
    else if (a.startsWith('-') && a !== '-') { (flags[a] ??= []).push(true); }
    else pos.push(a);
  }
  const get = (...names) => { for (const n of names) if (flags[n]) return flags[n].at(-1); return undefined; };
  const all = (...names) => names.flatMap((n) => flags[n] ?? []).flatMap((v) => (typeof v === 'string' ? v.split(',') : [])).map((s) => s.trim()).filter(Boolean);
  return { pos, flags, get, all };
}

const numberOf = (ref) => { const m = String(ref ?? '').match(/^#?(\d+)$|\/(?:issues|pull|pulls)\/(\d+)(?:[/#?].*)?$|#(\d+)$/); return m ? Number(m[1] ?? m[2] ?? m[3]) : null; };
const out = (text, answered, what) => ({ exit: 0, stdout: text.endsWith('\n') ? text : `${text}\n`, stderr: '', answered, what });
const fail = (answered, what, msg) => ({ exit: 1, stdout: '', stderr: `${msg}\n`, answered, what });
const notRecorded = (what) => fail('not-recorded', what, `gh (pit-wall stand-in): not recorded in this environment's snapshot: ${what}`);
const refused = (what) => fail('refused', what, `gh (pit-wall stand-in): this environment has no GitHub connection; ${what} is not available`);

function pick(obj, fields, allowed, kind) {
  const bad = fields.filter((f) => !allowed.includes(f));
  if (bad.length) return { error: notRecorded(`${kind} field ${bad.join(',')}`) };
  const missing = fields.filter((f) => obj[f] === undefined);
  if (missing.length) return { error: notRecorded(`${kind} #${obj.number} field ${missing.join(',')}`) };
  return { value: Object.fromEntries(fields.map((f) => [f, obj[f]])) };
}
function emitJson(value, p, jq) {
  const expr = p.get('-q', '--jq');
  if (p.get('-t', '--template') !== undefined) return notRecorded('--template output');
  if (expr === undefined) return out(JSON.stringify(value), 'snapshot', 'json');
  const r = jq(expr, JSON.stringify(value));
  if (!r) return fail('not-recorded', '--jq', 'gh (pit-wall stand-in): --jq is not supported in this environment (no jq); use --json and filter the output');
  return r.status === 0 ? out(r.stdout, 'snapshot', 'json+jq') : { exit: 1, stdout: '', stderr: r.stderr, answered: 'usage', what: 'jq expression' };
}
const human = (kind, o) => [`title:\t${o.title}`, `state:\t${o.state ?? ''}`, `author:\t${o.author?.login ?? ''}`, `labels:\t${(o.labels ?? []).map((l) => l.name).join(', ')}`, `number:\t${o.number}`, ...(kind === 'pr' ? [`base:\t${o.baseRefName ?? ''}`] : []), '--', o.body ?? ''].join('\n');

function one(snap, kind, ref, p, jq) {
  const n = numberOf(ref);
  if (n == null) return { exit: 1, stdout: '', stderr: `invalid ${kind === 'pr' ? 'pull request' : 'issue'} format: ${JSON.stringify(ref ?? '')}\n`, answered: 'usage', what: `${kind} view` };
  // Issues and pull requests share one number space; `gh issue view` of a PR number shows the PR.
  const o = snap[kind === 'pr' ? 'prs' : 'issues'][n] ?? (kind === 'issue' ? snap.prs[n] : null);
  const isPr = !!o && !!snap.prs[n] && o === snap.prs[n];
  if (!o) {
    if (n > snap.lastNumber || snap.absent?.includes(n)) return fail('unresolved', `${kind} #${n}`, `GraphQL: Could not resolve to ${kind === 'pr' ? 'a PullRequest' : 'an issue or pull request'} with the number of ${n}. (repository.${kind === 'pr' ? 'pullRequest' : 'issue'})`);
    return notRecorded(`${kind} #${n}`);
  }
  if (p.flags['--comments'] || p.flags['-c']) return notRecorded(`comments of #${n}`);
  if (p.flags['--web'] || p.flags['-w']) return refused('opening a browser');
  const fields = p.all('--json');
  if (!fields.length) return p.get('-q', '--jq') !== undefined ? { exit: 1, stdout: '', stderr: 'cannot use `--jq` without specifying `--json`\n', answered: 'usage', what: 'jq without json' } : out(human(isPr ? 'pr' : 'issue', o), 'snapshot', `${kind} #${n}`);
  const r = pick(o, fields, isPr ? PR_FIELDS : ISSUE_FIELDS, isPr ? 'pr' : 'issue');
  return r.error ?? { ...emitJson(r.value, p, jq), what: `${kind} #${n} json` };
}

function list(snap, kind, p, jq) {
  if (p.get('-S', '--search') !== undefined) return notRecorded(`${kind} search`);
  for (const f of ['-a', '--assignee', '--mention', '-m', '--milestone', '--app']) if (p.get(f) !== undefined) return notRecorded(`${kind} list ${f}`);
  const state = String(p.get('-s', '--state') ?? 'open').toLowerCase();
  const labels = p.all('-l', '--label');
  const limit = Number(p.get('-L', '--limit') ?? 30);
  const author = p.get('-A', '--author');
  let rows = Object.values(snap[kind === 'pr' ? 'prs' : 'issues']).sort((a, b) => b.number - a.number);
  // A pull request whose state at the snapshot date is not recorded cannot be listed by state.
  if (rows.some((r) => r.state === undefined) && state !== 'all') rows = rows.filter((r) => r.state !== undefined);
  if (state !== 'all') rows = rows.filter((r) => (state === 'open' ? r.state === 'OPEN' : state === 'merged' ? r.state === 'MERGED' : state === 'closed' ? r.state === 'CLOSED' || r.state === 'MERGED' : false));
  if (labels.length) rows = rows.filter((r) => labels.every((l) => (r.labels ?? []).some((x) => x.name === l)));
  if (author) rows = rows.filter((r) => r.author?.login === author);
  if (kind === 'pr' && p.get('-B', '--base')) rows = rows.filter((r) => r.baseRefName === p.get('-B', '--base'));
  if (kind === 'pr' && p.get('-H', '--head')) rows = rows.filter((r) => r.headRefName === p.get('-H', '--head'));
  rows = rows.slice(0, limit);
  // The snapshot holds the issues that were collected, not every issue of the repository: say so once.
  const partial = kind === 'issue' && !snap.issuesComplete;
  const fields = p.all('--json');
  let res;
  if (fields.length) {
    const picked = [];
    for (const r of rows) { const x = pick(r, fields, kind === 'pr' ? PR_FIELDS : ISSUE_FIELDS, kind); if (x.error) return x.error; picked.push(x.value); }
    res = emitJson(picked, p, jq);
  } else res = out(rows.map((r) => [r.number, r.state ?? '', r.title, (r.labels ?? []).map((l) => l.name).join(', '), r.createdAt].join('\t')).join('\n'), 'snapshot', `${kind} list`);
  return { ...res, what: `${kind} list`, stderr: `${res.stderr}${partial && res.exit === 0 ? 'gh (pit-wall stand-in): the issue list of this environment is partial (only collected issues are recorded)\n' : ''}`, partial };
}

function api(snap, p, jq) {
  const method = String(p.get('--method', '-X') ?? 'GET').toUpperCase();
  if (method !== 'GET' || p.get('-f') !== undefined || p.get('-F') !== undefined || p.get('--field') !== undefined || p.get('--input') !== undefined) return refused(`gh api ${method} (write)`);
  const path = String(p.pos[1] ?? '').replace(/^\//, '').replace(/^repos\/(?:[^/]+\/[^/]+|\{owner\}\/\{repo\}|:owner\/:repo)\//, '');
  const m = path.match(/^(issues|pulls)\/(\d+)$/);
  if (!m) return notRecorded(`gh api ${p.pos[1] ?? ''}`);
  const r = one(snap, m[1] === 'pulls' ? 'pr' : 'issue', m[2], { ...p, flags: {}, all: () => [], get: () => undefined }, jq);
  if (r.exit !== 0) return r.answered === 'unresolved' ? fail('unresolved', r.what, 'gh: Not Found (HTTP 404)') : r;
  const o = snap[m[1] === 'pulls' ? 'prs' : 'issues'][Number(m[2])] ?? snap.prs[Number(m[2])];
  // REST names for the same recorded facts; nothing beyond them.
  const rest = { number: o.number, title: o.title, body: o.body, state: o.state === undefined ? undefined : o.state === 'OPEN' ? 'open' : 'closed', created_at: o.createdAt, user: o.author ? { login: o.author.login } : undefined, labels: (o.labels ?? []).map((l) => ({ name: l.name })), html_url: o.url, ...(o.baseRefName ? { base: { ref: o.baseRefName }, head: { ref: o.headRefName }, merged: o.state === 'MERGED' } : {}) };
  return { ...emitJson(rest, p, jq), what: `api ${m[1]}/${m[2]}` };
}

// One call: { exit, stdout, stderr, answered, what }.
export function answer(argv, snap, { jq = () => null } = {}) {
  const p = parse(argv);
  const [cmd, sub] = p.pos;
  if (!cmd || p.flags['--version'] || cmd === 'version') return out('gh version 2.81.0 (pit-wall stand-in)', 'snapshot', 'version');
  if (p.flags['--help'] || p.flags['-h'] || cmd === 'help') return out('gh (pit-wall stand-in): reads issues, pull requests and labels of this repository from a snapshot.\nSupported: gh issue view|list, gh pr view|list, gh label list, gh repo view, gh api repos/OWNER/REPO/issues|pulls/N', 'snapshot', 'help');
  if (!(cmd in READ_SUBS)) return refused(`gh ${cmd}`);
  if (cmd === 'api') return api(snap, p, jq);
  if (cmd === 'auth') return sub === 'status' ? fail('refused', 'auth status', 'You are not logged into any GitHub hosts. This environment has no GitHub connection (pit-wall stand-in).') : refused(`gh auth ${sub ?? ''}`);
  if (!READ_SUBS[cmd].includes(sub)) return (['create', 'edit', 'close', 'reopen', 'comment', 'merge', 'review', 'ready', 'delete', 'lock', 'pin', 'transfer', 'develop', 'checkout'].includes(sub) ? refused : notRecorded)(`gh ${cmd} ${sub ?? ''}`.trim());
  if (cmd === 'repo') { const f = p.all('--json'); const o = { name: snap.repo.split('/')[1], nameWithOwner: snap.repo, owner: { login: snap.repo.split('/')[0] }, url: `https://github.com/${snap.repo}`, defaultBranchRef: snap.defaultBranch ? { name: snap.defaultBranch } : undefined }; if (!f.length) return out(`name:\t${snap.repo}`, 'snapshot', 'repo view'); const r = pick(o, f, Object.keys(o), 'repo'); return r.error ?? emitJson(r.value, p, jq); }
  if (cmd === 'label') { const f = p.all('--json'); const rows = snap.labels.map((name) => ({ name })); if (!f.length) return out(rows.map((r) => r.name).join('\n'), 'snapshot', 'label list'); if (f.some((x) => x !== 'name')) return notRecorded(`label field ${f.filter((x) => x !== 'name').join(',')}`); return emitJson(rows, p, jq); }
  if (sub === 'status') return notRecorded(`gh ${cmd} status`);
  if (sub === 'view') return one(snap, cmd, p.pos[2], p, jq);
  return list(snap, cmd, p, jq);
}

export function main(argv) {
  const file = process.env.PITWALL_GH_SNAPSHOT ?? '/opt/pitwall/gh/snapshot.json';
  const dir = process.env.PITWALL_GH_LOG_DIR ?? '/var/pitwall/gh';
  let r;
  if (!existsSync(file)) r = fail('refused', 'no snapshot', 'gh (pit-wall stand-in): no snapshot in this environment');
  else {
    const jq = (expr, input) => { const x = spawnSync('jq', ['-r', expr], { input, encoding: 'utf8' }); return x.error ? null : x; };
    try { r = answer(argv, JSON.parse(readFileSync(file, 'utf8')), { jq }); } catch (e) { r = fail('usage', 'internal', `gh (pit-wall stand-in): could not answer: ${String(e.message).slice(0, 120)}`); }
  }
  try { mkdirSync(dir, { recursive: true }); appendFileSync(join(dir, 'calls.jsonl'), `${JSON.stringify({ ts: new Date().toISOString(), argv, exit: r.exit, answered: r.answered, what: r.what, partial: r.partial || undefined })}\n`); } catch { /* logging never changes the answer */ }
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exitCode = r.exit;
}

// Counts for the end-state capture and for G4: how many calls, how many the snapshot could not answer.
export function summarize(dir) {
  const f = join(dir, 'calls.jsonl');
  if (!existsSync(f)) return { calls: 0, byAnswer: {}, notRecorded: [] };
  const rows = readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const byAnswer = {};
  for (const r of rows) byAnswer[r.answered] = (byAnswer[r.answered] ?? 0) + 1;
  return { calls: rows.length, byAnswer, notRecorded: rows.filter((r) => r.answered === 'not-recorded' || r.answered === 'refused').map((r) => r.what), rows };
}

let self = false;
try { self = !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { /* imported */ }
if (self) main(process.argv.slice(2));
