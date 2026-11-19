// EXP-48 (issue #56): the machine checks behind the G4.partial open items that need no model —
// request body == gh stand-in body, the already-red summary, the graphify cause reader.
// Each test shows both directions: the check passes on the good case and stops on the bad one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { compareTask, norm, splitCopy, summarise } from '../../../experiments/exp48/request-body-check.mjs';
import { compareTrees, listText, summariseSuite } from '../../../experiments/exp48/g4-machine-collect.mjs';
import { graphFacts, readTraceback } from '../../../experiments/exp48/graphify-probe.mjs';
import { answer } from '../shims/realrepo/gh.mjs';

const TITLE = 'Member price is rounded the wrong way';
const BODY = 'Steps:\r\n1. open the page\r\n2. see 105 instead of 104\r\n\r\n```ts\nconst x = 1;\n```\n';
const snap = (body = BODY) => ({ repo: 'o/r', lastNumber: 9, issues: { 7: { number: 7, title: TITLE, body, state: 'OPEN', createdAt: '2026-01-01T00:00:00Z', closedAt: null, author: { login: 'a' }, labels: [], url: 'u' } }, prs: {}, labels: [] });
const ask = (s) => { const j = answer(['issue', 'view', '7', '--json', 'title,body'], s), p = answer(['issue', 'view', '7'], s); const o = JSON.parse(j.stdout); return { json: { exit: j.exit, title: o.title, body: o.body }, plain: { exit: p.exit, stdout: p.stdout } }; };
const good = () => ({ cache: { title: TITLE, body: BODY }, copy: `# ${TITLE}\n\n${BODY}`, standIn: { abc: ask(snap()), d: ask(snap()) }, instruction: `# ${TITLE}\n\n${BODY}\n\n## Environment\nnode 22\n` });

test('request body check: equal everywhere passes; line ends and the final blank are not a difference', () => {
  const r = compareTask(good());
  assert.equal(r.ok, true, r.why.join('; '));
  assert.deepEqual([r.standIn.abc.bodyEqual, r.standIn.d.bodyEqual, r.standIn.abc.plainEndsWithBody, r.copy.bodyEqual, r.request.containsBody, r.request.containsTitle], [true, true, true, true, true, true]);
  assert.equal(r.bodySha256, createHash('sha256').update(norm(BODY)).digest('hex'));
  assert.equal(JSON.stringify(r).includes('rounded'), false, 'the row carries hashes and booleans, not text');
  assert.deepEqual(splitCopy(`# t\r\n\r\nb1\r\nb2`), { title: 't', body: 'b1\nb2' });
});

test('request body check: every way of being different stops it', () => {
  const edited = BODY.replace('105', '106');
  const cases = {
    'the stand-in answers another body on one tree': (g) => { g.standIn.d = ask(snap(edited)); },
    'the stand-in does not know the issue': (g) => { const s = snap(); delete s.issues[7]; const j = answer(['issue', 'view', '7', '--json', 'title,body'], s); g.standIn.abc = { json: { exit: j.exit }, plain: { exit: 1, stdout: '' } }; },
    'no build context for a tree': (g) => { g.standIn.abc = null; },
    'the request has an edited body': (g) => { g.instruction = g.instruction.replace('105', '106'); },
    'the request has the body cut in two': (g) => { g.instruction = g.instruction.replace('2. see', '\n(note)\n2. see'); },
    'the request is not written': (g) => { g.instruction = null; },
    'the author copy differs': (g) => { g.copy = `# ${TITLE}\n\n${edited}`; },
    'the issue is not in the cache': (g) => { g.cache = null; },
  };
  for (const [name, change] of Object.entries(cases)) {
    const g = good(); change(g);
    const r = compareTask(g);
    assert.equal(r.ok, false, name);
    assert.ok(r.why.length >= 1, name);
  }
  const rows = [{ id: 'a', ...compareTask(good()) }, { id: 'b', ...compareTask({ ...good(), instruction: null }) }];
  const s = summarise(rows);
  assert.deepEqual([s.tasks, s.ok, s.requestWritten, s.standInBodyEqualBothTrees, s.notOk], [2, 1, 1, 2, ['b']]);
});

const suite = (over = {}) => ({ peakMiB: 4500, checks: { vitest: { exit: 1, signal: null, timedOut: false, sec: 1390, records: ['npm', 'vitest'], vitest: { files: 6, tests: 60, passed: 55, failed: 3, filesReported: 6, failedFiles: 3, skippedFiles: 1, passedFiles: 2, failedAtCollection: 1 }, failedFilesList: ['tests/unit/infra/b.test.ts', 'tests/unit/a/sib.test.ts', 'tests/unit/a/hid.test.ts'], skippedFilesList: ['tests/unit/z.test.ts'], ...over } } });

test('already-red summary: counts and the hash of the sorted list; the list itself is not in the row', () => {
  const { row, red } = summariseSuite(suite(), { hidden_checks: ['tests/unit/a/hid.test.ts'], sibling_tests: ['tests/unit/a/sib.test.ts', 'tests/unit/a/other.test.ts'] });
  assert.deepEqual(red, ['tests/unit/a/hid.test.ts', 'tests/unit/a/sib.test.ts', 'tests/unit/infra/b.test.ts']);
  assert.deepEqual([row.listed, row.failedFiles, row.failedAtCollection, row.skippedFiles, row.redAmongHidden, row.redAmongSiblings], [true, 3, 1, 1, 1, 1]);
  assert.equal(row.redListSha256, createHash('sha256').update('tests/unit/a/hid.test.ts\ntests/unit/a/sib.test.ts\ntests/unit/infra/b.test.ts\n').digest('hex'));
  assert.equal(listText(red), 'tests/unit/a/hid.test.ts\ntests/unit/a/sib.test.ts\ntests/unit/infra/b.test.ts\n');
  assert.deepEqual(row.redByTopDir, { 'tests/unit/a': 2, 'tests/unit/infra': 1 });
  assert.equal(JSON.stringify(row).includes('hid.test'), false);
  assert.deepEqual(compareTrees(red, ['tests/unit/infra/b.test.ts', 'tests/unit/q.test.ts']), { both: 1, onlyInAbc: 2, onlyInD: 1 });
  assert.equal(compareTrees(red, null), null);
});

test('already-red summary: a run without a per-file record has NO list (never an empty one)', () => {
  const killed = summariseSuite(suite({ timedOut: true, exit: null, signal: 'SIGKILL', vitest: undefined, failedFilesList: undefined }));
  assert.deepEqual([killed.row.ran, killed.row.listed, killed.red], [true, false, null]);
  assert.match(killed.row.why, /time limit/);
  const noReporter = summariseSuite(suite({ vitest: undefined, failedFilesList: undefined }));
  assert.deepEqual([noReporter.row.listed, noReporter.red], [false, null]);
  const missing = summariseSuite(null);
  assert.deepEqual([missing.row.ran, missing.row.listed, missing.red], [false, false, null]);
  // a run that hit the limit but had reported files: the partial list is kept and marked as not a full list
  const partial = summariseSuite(suite({ timedOut: true }));
  assert.deepEqual([partial.row.listed, partial.red.length], [false, 3]);
});

test('graphify cause reader: the exception type, its position numbers and package frames; no message text', () => {
  const stderr = ['Traceback (most recent call last):', '  File "/usr/local/lib/python3.12/dist-packages/graphify/paths.py", line 584, in read_graph_json', '    return json.loads(text)', '  File "/usr/lib/python3.12/json/decoder.py", line 353, in raw_decode', '    obj, end = self.scan_once(s, idx)', "json.decoder.JSONDecodeError: Expecting ',' delimiter: line 12 column 7 (char 345)", ''].join('\n');
  const t = readTraceback(stderr);
  assert.deepEqual(t, { traceback: true, exceptionType: 'json.decoder.JSONDecodeError', jsonErrorAt: [12, 7, 345], frames: ['graphify/paths.py:584:read_graph_json', 'json/decoder.py:353:raw_decode'] });
  assert.deepEqual(readTraceback(''), { traceback: false, exceptionType: null, jsonErrorAt: [], frames: [] });
  const ok = graphFacts('{"nodes": [\n {"id": "a"}\n]}\n'), bad = graphFacts('{"nodes": [\n {"id": "a"\n "community": 1}\n]}\n'), merged = graphFacts('{\n<<<<<<< HEAD\n"a": 1\n=======\n"a": 2\n>>>>>>> other\n}\n');
  assert.deepEqual([ok.graphJsonParses, ok.conflictMarkerLines, ok.endsWithClosingBrace], [true, 0, true]);
  assert.deepEqual([bad.graphJsonParses, bad.conflictMarkerLines, typeof bad.parseErrorAtChar], [false, 0, 'number']);
  assert.deepEqual([merged.graphJsonParses, merged.conflictMarkerLines], [false, 3]);
});
