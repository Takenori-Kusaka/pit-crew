// gh stand-in for real-repository tasks: answers from a snapshot frozen at the pre-fix date,
// fails explicitly on everything else, makes nothing up, and logs every call.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, parse, summarize } from '../shims/realrepo/gh.mjs';
import { buildSnapshot } from '../src/realrepo/gh-snapshot.mjs';

const GH = fileURLToPath(new URL('../shims/realrepo/gh.mjs', import.meta.url));
const CACHE = {
  issues: [
    { number: 10, title: 'Old bug', body: 'old body', createdAt: '2026-05-01T00:00:00Z', closedAt: '2026-05-10T00:00:00Z', lastEditedAt: null, author: { login: 'owner' }, labels: { nodes: [{ name: 'type:fix' }] } },
    { number: 20, title: 'The task', body: 'task body', createdAt: '2026-06-01T00:00:00Z', closedAt: '2026-06-20T00:00:00Z', lastEditedAt: '2026-06-19T00:00:00Z', author: { login: 'owner' }, labels: [{ name: 'type:fix' }, { name: 'priority:high' }] },
    { number: 21, title: 'Edited later', body: 'text with hindsight', createdAt: '2026-06-02T00:00:00Z', closedAt: null, lastEditedAt: '2026-07-01T00:00:00Z', author: { login: 'owner' }, labels: [] },
    { number: 40, title: 'From the future', body: 'future', createdAt: '2026-07-01T00:00:00Z', closedAt: null, author: { login: 'owner' }, labels: [] },
  ],
  prs: [
    { number: 11, title: 'Fix old bug', body: 'closes #10', createdAt: '2026-05-05T00:00:00Z', mergedAt: '2026-05-10T00:00:00Z', baseRefName: 'main', headRefName: 'fix/old', author: { login: 'owner' }, labels: [], closingIssuesReferences: { nodes: [{ number: 10 }] } },
    { number: 22, title: 'Fix the task', body: 'THE FIX DESCRIPTION', createdAt: '2026-06-09T00:00:00Z', mergedAt: '2026-06-20T00:00:00Z', baseRefName: 'main', headRefName: 'fix/task', author: { login: 'owner' }, labels: [], closingIssuesReferences: { nodes: [{ number: 20 }] } },
    { number: 23, title: 'Merged later', body: 'b', createdAt: '2026-06-05T00:00:00Z', mergedAt: '2026-06-30T00:00:00Z', baseRefName: 'main', headRefName: 'feat/x', author: { login: 'bot' }, labels: [], closingIssuesReferences: [] },
    { number: 24, title: 'Never merged', body: 'b', createdAt: '2026-06-06T00:00:00Z', mergedAt: null, baseRefName: 'main', headRefName: 'feat/y', author: { login: 'bot' }, labels: [], closingIssuesReferences: [] },
  ],
};
const snap = buildSnapshot(CACHE, { repo: 'o/r', asOf: '2026-06-10T00:00:00Z', taskIssue: 20, fixPr: 22, defaultBranch: 'main' });
const gh = (...argv) => answer(argv, snap);

test('the snapshot is the repository as of the date: nothing later, no fix PR, no text edited later', () => {
  assert.deepEqual(Object.keys(snap.issues), ['10', '20']);
  assert.deepEqual(Object.keys(snap.prs), ['11', '23', '24']);
  assert.deepEqual([snap.issues[10].state, snap.issues[20].state, snap.issues[20].closedAt], ['CLOSED', 'OPEN', null]); // the task's issue is still open
  assert.deepEqual([snap.prs[11].state, snap.prs[23].state, snap.prs[24].state, snap.prs[23].mergedAt], ['MERGED', 'OPEN', undefined, null]);
  assert.equal(snap.lastNumber, 24);
  assert.deepEqual(snap.meta, { issuesLeftOutEditedLater: 1, issuesAfterDate: 1, prsAfterDate: 0, prsLeftOutClosingTheIssue: 1, prsWithoutState: 1, issues: 2, prs: 3 });
  assert.equal(JSON.stringify(snap).includes('THE FIX DESCRIPTION'), false);
  assert.equal(JSON.stringify(snap).includes('hindsight'), false);
  assert.deepEqual(snap.labels, ['priority:high', 'type:fix']);
});

test('reads are answered from the snapshot, in gh\'s forms', () => {
  assert.match(gh('issue', 'view', '20').stdout, /^title:\tThe task\nstate:\tOPEN\n[\s\S]*--\ntask body\n$/);
  assert.deepEqual(JSON.parse(gh('issue', 'view', '#20', '--json', 'number,title,labels').stdout), { number: 20, title: 'The task', labels: [{ name: 'type:fix' }, { name: 'priority:high' }] });
  assert.equal(JSON.parse(gh('issue', 'view', 'https://github.com/o/r/issues/20', '--json=body', '-R', 'o/r').stdout).body, 'task body');
  assert.equal(JSON.parse(gh('pr', 'view', '11', '--json', 'state').stdout).state, 'MERGED');
  assert.equal(JSON.parse(gh('issue', 'view', '11', '--json', 'title').stdout).title, 'Fix old bug'); // one number space
  assert.deepEqual(JSON.parse(gh('issue', 'list', '--json', 'number').stdout), [{ number: 20 }]); // open by default
  assert.deepEqual(JSON.parse(gh('issue', 'list', '--state', 'all', '--label', 'type:fix', '--json', 'number').stdout).map((x) => x.number), [20, 10]);
  assert.deepEqual(JSON.parse(gh('pr', 'list', '--state', 'merged', '--json', 'number,baseRefName').stdout), [{ number: 11, baseRefName: 'main' }]);
  assert.equal(gh('pr', 'list').stdout.split('\n')[0].split('\t')[0], '23');
  assert.equal(gh('label', 'list').stdout, 'priority:high\ntype:fix\n');
  assert.equal(JSON.parse(gh('api', 'repos/o/r/issues/20').stdout).state, 'open');
  assert.equal(JSON.parse(gh('api', '/repos/{owner}/{repo}/pulls/11').stdout).merged, true);
  assert.equal(JSON.parse(gh('repo', 'view', '--json', 'nameWithOwner').stdout).nameWithOwner, 'o/r');
  assert.match(gh('issue', 'list').stderr, /partial/); // the list is not the whole repository, and says so
});

test('what the snapshot cannot answer fails explicitly; nothing is made up', () => {
  const nr = (r) => [r.exit, r.answered, r.stdout];
  assert.deepEqual(nr(gh('issue', 'view', '15')), [1, 'not-recorded', '']); // existed then, not collected
  assert.deepEqual(nr(gh('issue', 'view', '21')), [1, 'not-recorded', '']); // edited later: left out
  assert.deepEqual(nr(gh('pr', 'view', '22')), [1, 'not-recorded', '']); // the fix PR: no fabricated PR
  assert.deepEqual(nr(gh('issue', 'view', '40')), [1, 'unresolved', '']); // did not exist yet
  assert.match(gh('issue', 'view', '40').stderr, /Could not resolve to an issue or pull request with the number of 40/);
  assert.match(gh('api', 'repos/o/r/issues/40').stderr, /Not Found \(HTTP 404\)/);
  assert.deepEqual(nr(gh('issue', 'view', '20', '--comments')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('issue', 'view', '20', '--json', 'title,comments')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('pr', 'view', '24', '--json', 'state')), [1, 'not-recorded', '']); // no closing date in the cache
  assert.deepEqual(nr(gh('issue', 'list', '--search', 'bug')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('pr', 'checks', '11')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('pr', 'diff', '11')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('api', 'repos/o/r/commits')), [1, 'not-recorded', '']);
  assert.deepEqual(nr(gh('run', 'list')), [1, 'refused', '']);
  assert.deepEqual(nr(gh('pr', 'create', '--title', 'x', '--body', 'y')), [1, 'refused', '']);
  assert.deepEqual(nr(gh('issue', 'comment', '20', '--body', 'x')), [1, 'refused', '']);
  assert.deepEqual(nr(gh('api', 'repos/o/r/issues/20/labels', '-X', 'POST', '-f', 'labels[]=x')), [1, 'refused', '']);
  assert.deepEqual(nr(gh('auth', 'status')), [1, 'refused', '']);
  assert.equal(gh('issue', 'view', 'abc').answered, 'usage');
});

test('--json filters without any tool; --jq uses jq when the image has it and fails as unsupported otherwise', () => {
  assert.equal(gh('issue', 'view', '20', '--json', 'title', '--jq', '.title').exit, 1);
  assert.match(gh('issue', 'view', '20', '--json', 'title', '--jq', '.title').stderr, /--jq is not supported/);
  const withJq = answer(['issue', 'view', '20', '--json', 'title', '-q', '.title'], snap, { jq: (expr, input) => ({ status: 0, stdout: `${JSON.parse(input).title}\n`, stderr: '' }) });
  assert.deepEqual([withJq.exit, withJq.stdout], [0, 'The task\n']);
  assert.equal(gh('issue', 'view', '20', '--jq', '.title').answered, 'usage'); // as gh: --jq needs --json
  assert.deepEqual(parse(['issue', 'view', '5', '--json', 'a,b', '--json=c', '-R', 'x/y']).all('--json'), ['a', 'b', 'c']);
});

test('the program: output, exit code and a log of every call outside the work tree', () => {
  const d = mkdtempSync(join(tmpdir(), 'pw-gh-'));
  writeFileSync(join(d, 'snapshot.json'), JSON.stringify(snap));
  const env = { ...process.env, PITWALL_GH_SNAPSHOT: join(d, 'snapshot.json'), PITWALL_GH_LOG_DIR: join(d, 'log') };
  const run = (...a) => spawnSync(process.execPath, [GH, ...a], { encoding: 'utf8', env });
  assert.equal(JSON.parse(run('issue', 'view', '20', '--json', 'number').stdout).number, 20);
  assert.equal(run('pr', 'view', '22').status, 1);
  assert.equal(run('pr', 'create', '--fill').status, 1);
  assert.equal(run('issue', 'view', '99').status, 1);
  const s = summarize(join(d, 'log'));
  assert.deepEqual([s.calls, s.byAnswer], [4, { snapshot: 1, 'not-recorded': 1, refused: 1, unresolved: 1 }]);
  assert.deepEqual(s.notRecorded, ['pr #22', 'gh pr create']);
  const none = spawnSync(process.execPath, [GH, 'issue', 'view', '20'], { encoding: 'utf8', env: { ...env, PITWALL_GH_SNAPSHOT: join(d, 'missing.json') } });
  assert.deepEqual([none.status, none.stdout], [1, '']);
});
