// `gh api` forms in the Bash analyzer: the REST shape of a judgement, a label, a comment and a
// read, read into the same actions as the gh subcommands (both directions).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCommand } from '../src/graders/process/bash.mjs';

const acts = (cmd) => analyzeCommand(cmd, { cwd: '', known: new Set() }).actions;
const one = (cmd) => { const a = acts(cmd); assert.equal(a.length, 1, cmd); return a[0]; };

test('POST pulls/N/reviews is a review post with its event and body', () => {
  const a = one("gh api -X POST repos/o/r/pulls/12/reviews -f event=APPROVE -f body=LGTM");
  assert.equal(a.type, 'post'); assert.equal(a.kind, 'pr'); assert.equal(a.verb, 'review'); assert.equal(a.number, 12);
  assert.equal(a.reviewEvent, 'APPROVE'); assert.equal(a.body, 'LGTM');
  assert.equal(one("gh api repos/o/r/pulls/12/reviews -f event=REQUEST_CHANGES").reviewEvent, 'REQUEST_CHANGES');
  assert.equal(one("gh api --method=POST https://api.github.com/repos/o/r/pulls/12/reviews -F event=COMMENT -F body=x").reviewEvent, 'COMMENT');
});

test('PUT pulls/N/merge, POST issues/N/labels, POST issues/N/comments', () => {
  const m = one('gh api -X PUT repos/o/r/pulls/12/merge -f merge_method=merge');
  assert.equal(m.verb, 'merge'); assert.equal(m.kind, 'pr'); assert.equal(m.number, 12);
  const l = one("gh api repos/o/r/issues/12/labels -f 'labels[]=needs-po' -f 'labels[]=x'");
  assert.equal(l.verb, 'edit'); assert.deepEqual(l.labels, ['needs-po', 'x']); assert.equal(l.kind, 'issue');
  const c = one("gh api repos/o/r/issues/12/comments -f body='routed'");
  assert.equal(c.verb, 'comment'); assert.equal(c.body, 'routed');
});

test('GET forms are reads (gh view), not posts', () => {
  const g = one('gh api repos/o/r/pulls/12');
  assert.equal(g.type, 'gh'); assert.equal(g.op, 'view'); assert.equal(g.kind, 'pr'); assert.equal(g.number, 12);
  assert.equal(one('gh api -X GET /repos/{owner}/{repo}/issues/7/comments').comments, true);
});

test('cp / mv with an unresolvable source or destination does not crash the analyzer (EXP-41 record)', () => {
  assert.doesNotThrow(() => acts('T=$(mktemp -d); git archive fix/x | tar -x -C $T; cd $T; cp "$f" out/; mv $T/a.tsv b.tsv'));
  const a = acts('cp src/a.sh src/b.sh');
  assert.ok(a.some((x) => x.type === 'write' && x.path === 'src/b.sh'));
});

test('other endpoints stay other', () => {
  assert.equal(one("gh api graphql -f query='{ x }'").type, 'other');
  assert.equal(one('gh api repos/o/r/actions/runs').type, 'other');
});
