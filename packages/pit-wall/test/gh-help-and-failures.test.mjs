// The gh stand-in (shims/gh): a help call does nothing, and a call gh itself refuses fails.
// Gate run 1 (2026-11-16, kit/results/dev/verify-gate1.md, 9): in 6 trials `gh pr create --help` CREATED a PR — the
// stand-in ignored the word and answered every call as a success. One agent closed the PR and made another.
// Here every such call is run against a fresh state; the state (json), the journal (facts) and the log of calls
// must be what they were before the call.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRELUDE, shell } from './shell-helpers.mjs';
import { ghEffects, withoutHelpCalls } from '../src/kit/harbor-cases.mjs';

// One scenario: `setup` lines (their output is dropped), then `call`; prints the call's stdout, stderr and exit
// code, and what the call changed: the state json, the journal, the log of calls, the unparsed list.
function run(scenarios) {
  const parts = [PRELUDE, `pw_one() {
  local name=$1 setup=$2 call=$3 d
  d=$(mktemp -d); cd "$d"; mkdir -p .st .github-cache; echo "# an issue" > .github-cache/issue-12.md
  export PITWALL_GH_STATE="$d/.st/s.json" PITWALL_GH_LOG="$d/.st/gh.log"   # its own log: other test files run at the same time
  : > "$PITWALL_GH_LOG"
  bash -c "$setup" >/dev/null 2>&1
  local j0 f0 l0 u0
  # no state file yet is the empty state (the engine writes it on its first call, whatever the call)
  js() { cat .st/s.json 2>/dev/null || echo '{"items":{},"created":{"pullRequests":[],"issues":[]}}'; }
  j0=$(js); f0=$(cat .st/s.facts 2>/dev/null); l0=$(cat "$PITWALL_GH_LOG"); u0=$(cat .st/s.unparsed 2>/dev/null | wc -l)
  bash -c "$call" > .st/out 2> .st/err; local rc=$?
  local same=1
  [ "$j0" = "$(js)" ] && [ "$f0" = "$(cat .st/s.facts 2>/dev/null)" ] && [ "$l0" = "$(cat "$PITWALL_GH_LOG")" ] || same=0
  printf 'PWOUT\\t%s\\t%s\\t%s\\t%s\\t%s\\t%s\\n' "$name" "$rc" "$same" "$(base64 -w0 < .st/out)" "$(base64 -w0 < .st/err)" "$(tail -n +$((u0 + 1)) .st/s.unparsed 2>/dev/null | base64 -w0)"
}
`];
  for (const [name, [setup, call]] of Object.entries(scenarios)) parts.push(`pw_one '${name}' '${setup.replace(/'/g, `'\\''`)}' '${call.replace(/'/g, `'\\''`)}'`);
  const { stdout } = shell(parts.join('\n'));
  const dec = (b) => (b ? Buffer.from(b, 'base64').toString('utf8') : '');
  return Object.fromEntries(stdout.split('\n').filter((l) => l.startsWith('PWOUT\t')).map((l) => {
    const [, name, rc, same, out, err, unparsed] = l.split('\t');
    return [name, { rc: Number(rc), unchanged: same === '1', out: dec(out), err: dec(err), unparsed: dec(unparsed) }];
  }));
}

const MADE = 'gh pr create --title t --body b';          // a PR of this session (number 13: the fixture has issue 12)
const HELP = {
  'gh --help': ['', 'gh --help'],
  'gh': ['', 'gh'],
  'gh help': ['', 'gh help'],
  'gh help pr': ['', 'gh help pr'],
  'gh pr': ['', 'gh pr'],
  'gh pr --help': ['', 'gh pr --help'],
  'gh pr -h': ['', 'gh pr -h'],
  'gh issue --help': ['', 'gh issue --help'],
  'gh pr create --help': ['', 'gh pr create --help'],
  'gh pr create -h': ['', 'gh pr create -h'],
  'gh pr create --title t --body b --help': ['', 'gh pr create --title t --body b --help'],
  'gh pr create --help --fill': ['', 'gh pr create --help --fill'],
  'gh -R acme/shop pr create --help': ['', 'gh pr create -R acme/shop --help'],
  'gh issue create --help': ['', 'gh issue create --help'],
  'gh issue comment --help': ['', 'gh issue comment --help'],
  'gh issue comment 12 --help': ['', 'gh issue comment 12 --body x --help'],
  'gh pr comment --help': [MADE, 'gh pr comment --help'],
  'gh pr merge --help': [MADE, 'gh pr merge --help'],
  'gh pr merge 13 --help': [MADE, 'gh pr merge 13 --squash --help'],
  'gh pr review --help': [MADE, 'gh pr review --approve --help'],
  'gh pr ready -h': [MADE, 'gh pr ready -h'],
  'gh pr close --help': [MADE, 'gh pr close 13 --help'],
  'gh issue close --help': ['', 'gh issue close 12 --help'],
  'gh issue edit --help': ['', 'gh issue edit 12 --add-label x --help'],
  'gh api --help': ['', 'gh api --help'],
  'gh api -X POST … --help': ['', 'gh api -X POST repos/o/r/issues/12/comments -f body=x --help'],
};
const FAIL = {
  // creation: gh cannot ask for what is missing
  'pr create, nothing': ['', 'gh pr create', /must provide `--title` and `--body`/],
  'pr create, title only': ['', 'gh pr create --title t', /must provide `--title` and `--body`/],
  'pr create, body only': ['', 'gh pr create --body b', /must provide `--title` and `--body`/],
  'pr create, draft only': ['', 'gh pr create --draft', /must provide `--title` and `--body`/],
  'issue create, title only': ['', 'gh issue create --title t', /must provide `--title` and `--body` when not running interactively/],
  'issue create, nothing': ['', 'gh issue create', /must provide/],
  'pr create, a stray word': ['', 'gh pr create fix-the-cart --title t --body b', /unknown argument/],
  // unknown words
  'unknown command': ['', 'gh frobnicate', /unknown command "frobnicate" for "gh"/],
  'unknown pr command': ['', 'gh pr creat --title t --body b', /unknown command "creat" for "gh pr"/],
  'unknown issue command': ['', 'gh issue comments 12 -b x', /unknown command "comments" for "gh issue"/],
  'unknown flag': ['', 'gh pr create --title t --body b --no-such-flag', /unknown flag: --no-such-flag/],
  'unknown flag on a comment': ['', 'gh issue comment 12 --body x --notify', /unknown flag: --notify/],
  'a flag without its value': ['', 'gh issue comment 12 --body', /flag needs an argument: --body/],
  // missing parts
  'comment without a body': ['', 'gh issue comment 12', /`--body`, `--body-file` or `--web` required/],
  'issue comment without a number': ['', 'gh issue comment --body x', /accepts 1 arg\(s\), received 0/],
  'issue close without a number': ['', 'gh issue close', /accepts 1 arg\(s\), received 0/],
  'body file that is not there': ['', 'gh issue comment 12 --body-file no-such-file.md', /open no-such-file\.md: no such file/],
  'both a body and a body file': ['', 'echo x > b.md; gh issue comment 12 --body x --body-file b.md', /only one of `--body` or `--body-file`/],
  'not a reference': ['', 'gh issue comment twelve --body x', /invalid issue format: "twelve"/],
  'review without a verdict': [MADE, 'gh pr review 13 --body x', /--approve, --request-changes, or --comment required/],
  'edit the last comment, there is none': ['', 'gh issue comment 12 --edit-last --body x', /no comments found for current user/],
  // the PR of the branch, when this session made none
  'pr comment, no PR of the branch': ['', 'gh pr comment --body x', /no pull requests found for branch/],
  'pr merge, no PR of the branch': ['', 'gh pr merge --squash', /no pull requests found for branch/],
  'pr edit, no PR of the branch': ['', 'gh pr edit --title x', /no pull requests found for branch/],
  'pr ready, no PR of the branch': ['', 'gh pr ready', /no pull requests found for branch/],
};
const WORKS = {
  'pr create': ['', 'gh pr create --title t --body b', /^https:\/\/github\.com\/example\/repo\/pull\/13$/],
  'pr create --fill': ['', 'gh pr create --fill', /\/pull\/13$/],
  'pr create -f (fill)': ['', 'gh pr create -f', /\/pull\/13$/],
  'pr create --fill --draft': ['', 'gh pr create --fill --draft', /\/pull\/13$/],
  'pr create with a body file': ['', 'echo body > b.md; gh pr create -t t -F b.md', /\/pull\/13$/],
  'pr create with the body on stdin': ['', 'echo body | gh pr create -t t -F -', /\/pull\/13$/],
  'issue create': ['', 'gh issue create --title t --body b', /\/issues\/13$/],
  'a body that mentions --help': ['', 'gh issue comment 12 --body "--help"', /\/issues\/12#issuecomment-1$/],
  'a title that is -h': ['', 'gh pr create --title -h --body b', /\/pull\/13$/],
  'pr comment on the PR of the branch': [MADE, 'gh pr comment --body "ready"', /\/pull\/13#issuecomment-1$/],
  'pr merge of the PR of the branch': [MADE, 'gh pr merge --squash', /Merged pull request #13/],
  'pr ready of the PR of the branch': [`${MADE} --draft`, 'gh pr ready', /Pull request #13 is marked as "ready for review"/],
  'auth switch -h is a hostname': ['', 'gh auth switch -h github.com -u bot', /Switched active account/],
  'pr merge with the number last': [MADE, 'gh pr merge --squash --delete-branch 13', /Merged pull request #13/],
  'pr review with the number last': [MADE, 'gh pr review --comment --body "looks fine" 13', /Reviewed pull request #13/],
  'a command the stand-in has no model of': ['', 'gh repo clone example/repo', /^ok$/],
  'a gh api form it cannot represent': ['', 'gh api graphql -f query=x', /^ok$/],
};
const out = run({ ...HELP, ...FAIL, ...WORKS });

for (const [name, [, call]] of Object.entries(HELP)) {
  test(`help: \`${call}\` prints the usage, exits 0, and changes nothing`, () => {
    const r = out[name];
    assert.equal(r.rc, 0, r.err);
    assert.match(r.out, /USAGE\n {2}gh /);
    assert.doesNotMatch(r.out, /^https:\/\/|^✓|^ok$/m, 'not the answer of a call that was done');
    assert.equal(r.err, '');
    assert.equal(r.unchanged, true, 'the state, the journal and the log of calls are what they were');
    // it is on record as a help call, not as an effect
    assert.match(r.unparsed, /^help \(the usage was shown; nothing was done\)\t/);
  });
}

test('help: the usage of `gh pr create` names the flags an agent looks for', () => {
  const u = out['gh pr create --help'].out;
  for (const f of ['--title', '--body', '--body-file', '--draft', '--fill', '--base', '--head']) assert.ok(u.includes(f), f);
  assert.match(u, /^Create a pull request on GitHub\./);
  assert.match(out['gh pr --help'].out, /gh pr <command> \[flags\]/);
  assert.match(out['gh --help'].out, /gh <command> <subcommand> \[flags\]/);
  assert.match(out['gh issue comment --help'].out, /gh issue comment \{<number> \| <url>\}/);
});

for (const [name, [, call, re]] of Object.entries(FAIL)) {
  test(`a call gh refuses fails: ${name} (\`${call}\`)`, () => {
    const r = out[name];
    assert.equal(r.rc, 1, `stdout: ${r.out}`);
    assert.match(r.err, re);
    assert.equal(r.out, '', 'no URL, no ✓: nothing was done');
    assert.equal(r.unchanged, true, 'the state, the journal and the log of calls are what they were');
    assert.notEqual(r.unparsed, '', 'the refused call is listed, with the reason');
  });
}

for (const [name, [, call, re]] of Object.entries(WORKS)) {
  test(`still works: ${name} (\`${call}\`)`, () => {
    const r = out[name];
    assert.equal(r.rc, 0, r.err);
    assert.match(r.out.trim(), re);
    assert.equal(r.err, '');
    if (!/no model of|cannot represent/.test(name)) assert.equal(r.unchanged, false, 'the call was done: it is in the log of calls');
  });
}

test('the effects read from a command text: a help call is no effect; a body that mentions --help still is', () => {
  assert.deepEqual(ghEffects(['gh pr create --help']), []);
  assert.deepEqual(ghEffects(['gh pr create -h']), []);
  assert.deepEqual(ghEffects(['gh pr create --title t --body b --help']), []);
  assert.deepEqual(ghEffects(['gh pr merge 3 --help', 'gh pr review 3 --approve -h', 'gh issue comment 12 --help', 'gh pr ready 3 --help', 'gh issue close 12 -h']), []);
  assert.deepEqual(ghEffects(['gh pr create --help | head -40; gh pr create --title t --body b']), ['pr_create'], 'the call after the help is a creation');
  assert.deepEqual(ghEffects(['gh pr create --help && git status']), []);
  assert.deepEqual(ghEffects(['gh issue comment 12 --body "see --help"']), ['issue_comment']);
  assert.deepEqual(ghEffects(["gh issue comment 12 --body 'run it with -h'"]), ['issue_comment']);
  assert.deepEqual(ghEffects(['gh auth switch -h github.com -u bot && gh pr merge 3']), ['pr_merge'], '-h is --hostname under gh auth');
  assert.deepEqual(ghEffects(['gh pr create --title "fix --help output" --body b']), ['pr_create']);
  assert.equal(withoutHelpCalls('cd /app && gh pr create --help'), 'cd /app && gh-help');
  assert.equal(withoutHelpCalls('git log --help'), 'git log --help', 'only gh');
});
