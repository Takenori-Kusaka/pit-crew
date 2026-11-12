// gh state reconstructed from commands: applied vs failed posts, labels, merge, auth switch, PR inference, changed files from a printed diff.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ghStateFromCommands, inferPrNumber, changedFilesFromDiff } from '../src/graders/process/gh-from-commands.mjs';
import { eventTable } from '../src/graders/process/events.mjs';

const call = (id, command, text, extra = {}) => ({ tool_call_id: id, function_name: 'Bash', arguments: { command }, extra: { kind: 'execute', locations: [], denied: false, result: { is_error: false, text }, ...extra } });
const traj = { schema_version: 'x', steps: [{ step_id: 1, source: 'agent', message: '', tool_calls: [
  call('t1', 'gh pr view 52 --json title,body', '{"title":"x"}'),
  call('t2', 'gh pr diff 52', 'diff --git a/src/a.sh b/src/a.sh\n--- a/src/a.sh\n+++ b/src/a.sh\ndiff --git a/spec/a.spec.sh b/spec/a.spec.sh\n'),
  call('t3', 'gh pr review 52 --request-changes -b "no"', 'Exit code 1\ngh: Validation Failed (HTTP 422)'),
  call('t4', 'gh auth switch --user lab', 'switched'),
  call('t5', 'gh pr review 52 --approve -b "ok"', ''),
  call('t6', 'gh pr edit 52 --add-label state:ready-to-merge', ''),
  call('t7', 'gh pr merge 52 --merge', 'merged'),
] }], final_message: '' };

test('applied posts build items; failed posts are recorded but not applied; auth switch sets by', () => {
  const table = eventTable(traj);
  const gh = ghStateFromCommands(traj, { table });
  const it = gh.items['52'];
  assert.deepEqual(it.reviews.map((r) => [r.event, r.by]), [['APPROVE', 'lab']]);
  assert.deepEqual(it.labelsAdded, ['state:ready-to-merge']);
  assert.equal(it.state, 'merged');
  assert.deepEqual(gh.derived.map((d) => [d.verb, d.applied]), [['review', false], ['review', true], ['edit', true], ['merge', true]]);
  assert.equal(inferPrNumber(table), 52);
  assert.deepEqual(changedFilesFromDiff(table, 52), ['src/a.sh', 'spec/a.spec.sh']);
});
