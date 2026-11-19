// The remote for more than one user, and records without the local home path (kit/results/dev/infra-scenes.md §9).
// scene-check 20261116T223040Z item 2: a push by another user than the one that built the image failed. Cause (WSL
// reproduction, §9): the run's first push, as root, created logs/refs/heads/ with mode 755. The remote is now made with
// core.sharedRepository 0666. What can be tested without a container and without a second user is tested here:
// the configuration, the log comparison that detects a rewritten log, and the scrubbing of the home path.
// The part that runs the scripts needs a POSIX bash (on Windows: PITWALL_TEST_BASH).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logsAgree } from '../src/kit/capture.mjs';
import { runLocal } from '../src/kit/capture-local.mjs';
import { homePattern, scrubHome } from '../src/kit/scrub-home.mjs';
import { cleanup, loadTemplate } from './kit-templates.mjs';
import { ROOT } from './kit-templates.mjs';

test.after(cleanup);
const b64 = (s) => Buffer.from(s).toString('base64');
const Z = '0'.repeat(40), A = 'a'.repeat(40), B = 'b'.repeat(40), C = 'c'.repeat(40);

// ---- the home path -------------------------------------------------------------------------------------------
test('scrubHome: the local home becomes ~ in every form it takes; nothing else changes', () => {
  const p = homePattern('/home/alice', 'alice');
  const s = (v) => scrubHome(v, p);
  // the case seen in scene-check: Harbor's message names the staging directory
  assert.equal(s('RuntimeError: Docker compose command failed. Command: docker compose -f /home/alice/.cache/pit-wall/stage/2735381-1794/tasks/x'), 'RuntimeError: Docker compose command failed. Command: docker compose -f ~/.cache/pit-wall/stage/2735381-1794/tasks/x');
  assert.equal(s('/home/alice'), '~');
  assert.equal(s('C:\\Users\\alice\\pit\\x'), '~\\pit\\x');
  assert.equal(s('"C:\\\\Users\\\\alice\\\\pit"'), '"~\\\\pit"', 'a backslash escaped in JSON text');
  assert.equal(s('/mnt/c/Users/alice/x and /c/Users/alice/y'), '~/x and ~/y');
  assert.equal(s('/Users/Alice/x'), '~/x', 'case-insensitive (Windows / macOS)');
  for (const keep of ['/home/alicex/a', '/home/agent/.claude', '/root/.cache', '/app/src', 'alice wrote this', 'path /homes/alice']) assert.equal(s(keep), keep);
  // a value: every string, keys too; other values as they are
  assert.deepEqual(s({ e: ['/home/alice/a', 3, null, true], '/home/alice/k': { n: 1 } }), { e: ['~/a', 3, null, true], '~/k': { n: 1 } });
  // a user name that is not a plain word adds nothing but the home itself
  assert.equal(scrubHome('/home/x y/a /srv/h/a', homePattern('/srv/h', 'x y')), '/home/x y/a ~/a');
  assert.equal(scrubHome('/x', homePattern('', null)), '/x');
});

test('scrubHome by default: the home of this process', () => {
  assert.equal(scrubHome(`${homedir()}/.cache/pit-wall/stage`).startsWith('~'), true);
  assert.equal(JSON.stringify(scrubHome({ a: join(homedir(), 'x') })).includes(homedir()), false);
});

test('the gate scripts and scene-check write records and results through scrubHome', () => {
  // every write of a record or result in these files goes through the scrubbing put; the listed exceptions are not records
  const files = { 'packages/pit-wall/src/kit/gate-run.mjs': [], 'scripts/release-gate.mjs': [], 'scripts/scene-check.mjs': ["join(ctx, 'Dockerfile')"] };
  for (const [f, allowed] of Object.entries(files)) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    assert.match(src, /import \{ scrubHome \} from '[./a-z-]*scrub-home\.mjs'/, f);
    for (const line of src.split('\n').filter((l) => /writeFileSync\(/.test(l) && !/^import /.test(l))) {
      const ok = /scrubHome\(/.test(line) || allowed.some((a) => line.includes(a));
      assert.ok(ok, `${f}: a write that does not scrub the home path: ${line.trim().slice(0, 140)}`);
    }
  }
});

// ---- the two logs of the remote --------------------------------------------------------------------------------
const remote = ({ hook = [], reflog = [], before = {}, after = {}, log = 'present' } = {}) => ({
  status: 'made', present: true, push_log: log,
  push_log_b64: b64(hook.map((l) => `2026-01-01T00:00:00Z\t${l.join('\t')}\t1`).join('\n')),
  reflog_b64: b64(reflog.map((l) => `${l.join('\t')}\t1`).join('\n')),
  refs_before_b64: b64(Object.entries(before).map(([r, i]) => `${i} ${r}`).join('\n')), refs_b64: b64(Object.entries(after).map(([r, i]) => `${i} ${r}`).join('\n')),
});

test('logsAgree: the hook log and the reflogs tell the same story, or the branches that differ are named', () => {
  const W = 'refs/heads/work', M = 'refs/heads/main';
  // nothing happened
  assert.deepEqual(logsAgree(remote({ before: { [M]: A }, after: { [M]: A } })), { logs_agree: true, disagree: [] });
  // a push and a rewrite of a new branch
  const base = { hook: [[W, Z, B], [W, B, C]], reflog: [[W, Z, B], [W, B, C]], before: { [M]: A }, after: { [M]: A, [W]: C } };
  assert.deepEqual(logsAgree(remote(base)), { logs_agree: true, disagree: [] });
  // the rewrite was cut from the hook log (the end still matches, the reflog does not)
  assert.deepEqual(logsAgree(remote({ ...base, hook: [[W, Z, B]] })), { logs_agree: false, disagree: [W] });
  // the reflog was cut instead
  assert.deepEqual(logsAgree(remote({ ...base, reflog: [[W, B, C]] })), { logs_agree: false, disagree: [W] });
  // both logs were emptied, but the branch is there: the end is not explained
  assert.deepEqual(logsAgree(remote({ ...base, hook: [], reflog: [] })), { logs_agree: false, disagree: [W] });
  // the mainline moved without a line in either log
  assert.deepEqual(logsAgree(remote({ before: { [M]: A }, after: { [M]: B } })), { logs_agree: false, disagree: [M] });
  // a deletion removes git's reflog of the branch: only what follows the last deletion is compared
  assert.deepEqual(logsAgree(remote({ hook: [[W, Z, B], [W, B, Z], [W, Z, C]], reflog: [[W, Z, C]], before: {}, after: { [W]: C } })), { logs_agree: true, disagree: [] });
  assert.deepEqual(logsAgree(remote({ hook: [[W, Z, B], [W, B, Z]], reflog: [], before: {}, after: {} })), { logs_agree: true, disagree: [] });
  // a tag is not in the reflogs read by the capture: it is not compared
  assert.deepEqual(logsAgree(remote({ hook: [['refs/tags/v1', Z, A]], before: {}, after: { 'refs/tags/v1': A } })), { logs_agree: true, disagree: [] });
  // a log that could not be read: not decided
  assert.deepEqual(logsAgree(remote({ ...base, log: 'missing' })), { logs_agree: null, disagree: [] });
  assert.deepEqual(logsAgree({ ...remote(base), reflog_b64: undefined }), { logs_agree: null, disagree: [] });
  assert.deepEqual(logsAgree({ ...remote(base), status: 'failed' }), { logs_agree: null, disagree: [] });
});

// ---- the scripts, run without a container -----------------------------------------------------------------------
const BASH = process.platform === 'win32' ? process.env.PITWALL_TEST_BASH : 'bash';
const skip = !BASH && 'no POSIX bash (set PITWALL_TEST_BASH)';
const scene = () => loadTemplate('dev-scene').cases.find((c) => c.kit.case === 'dev-normal');
const section = (text, name) => { const m = new RegExp(`<${name}>\\n([\\s\\S]*?)</${name}>`).exec(text); return m ? m[1] : null; };

test('the remote is made shared (what the run creates is writable by every user), and its two logs agree after pushes', { skip }, () => {
  const steps = ['echo "<shared>"; git --git-dir="$(git config --get remote.origin.url)" config --get core.sharedRepository; echo "</shared>"',
    'echo more >> docs/rounding.md', 'git commit -qam "docs: more"', 'git push -q origin work/discount', 'git push -q origin work/discount:develop',
    'git commit -q --amend -m "docs: reworded"', 'git push -q --force origin work/discount', 'git push -q origin HEAD:refs/heads/tmp', 'git push -q origin :refs/heads/tmp'].join('\n');
  const r = runLocal(scene(), { bash: BASH, steps });
  assert.equal(r.local.script_exit, 0, r.local.script_stderr);
  assert.equal(section(r.local.script_stdout, 'shared'), '0666\n');
  const c = r.kit_facts.capture.remote;
  assert.equal(c.logs_agree, true, JSON.stringify(c.disagree));
  assert.deepEqual(c.disagree, []);
  assert.ok(c.updates.some((u) => u.source === 'hook' && u.ff === false), 'the rewrite is in the updates');
});

test('a rewritten hook log is detected: the line of the rewrite was removed after the push', { skip }, () => {
  const steps = ['echo more >> docs/rounding.md', 'git commit -qam "docs: more"', 'git push -q origin work/discount',
    'git commit -q --amend -m "docs: reworded"', 'git push -q --force origin work/discount',
    'rp=$(git config --get remote.origin.url); grep -v "	0$" "$rp/push-updates.log" > "$rp/x" && cat "$rp/x" > "$rp/push-updates.log" && rm "$rp/x"'].join('\n');
  const r = runLocal(scene(), { bash: BASH, steps });
  assert.equal(r.local.script_exit, 0, r.local.script_stderr);
  const c = r.kit_facts.capture.remote;
  assert.equal(c.logs_agree, false);
  assert.deepEqual(c.disagree, ['refs/heads/work/discount']);
});
