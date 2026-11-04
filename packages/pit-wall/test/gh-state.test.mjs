// The gh stand-in's normalised state (shims/gh): every equivalent way of doing something
// gives the same state, and different effects give different states. Shell-level: runs
// the real shim in bash (WSL on Windows).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenarios } from './shell-helpers.mjs';

// Equivalence classes: every form in a class must give an identical state (JSON and TSV);
// two classes must never give the same state.
const CLASSES = {
  'label-needs-po-on-12': {
    plain: 'gh issue edit 12 --add-label needs-po',
    'number-last': 'gh issue edit --add-label needs-po 12',
    'flag-equals': 'gh issue edit 12 --add-label=needs-po',
    hash: "gh issue edit '#12' --add-label needs-po -R o/r",
    url: 'gh issue edit https://github.com/o/r/issues/12 --add-label needs-po',
    'owner-repo-ref': 'gh issue edit o/r#12 --repo=o/r --add-label needs-po',
    'repo-first': 'gh issue edit -R o/r 12 --add-label needs-po',
    'pr-edit-same-number': 'gh pr edit 12 --add-label needs-po',
    'pr-url': 'gh pr edit https://github.com/o/r/pull/12/files --add-label needs-po',
    'api-raw-field': "gh api repos/o/r/issues/12/labels -f 'labels[]=needs-po'",
    'api-method-placeholder': "gh api -X POST '/repos/{owner}/{repo}/issues/12/labels' -f 'labels[]=needs-po'",
    'api-full-url-typed': "gh api --method=POST https://api.github.com/repos/o/r/issues/12/labels -F 'labels[]=needs-po'",
    'api-input-stdin': `echo '{"labels":["needs-po"]}' | gh api repos/o/r/issues/12/labels --input -`,
    'api-input-file': `printf '{ "labels" : [ "needs-po" ] }\\n' > l.json; gh api repos/o/r/issues/12/labels --input l.json`,
    'twice': 'gh issue edit 12 --add-label needs-po; gh issue edit 12 --add-label needs-po',
    'with-reads': 'gh issue view 12; gh issue edit 12 --add-label needs-po; gh pr checks 12; gh api repos/o/r/issues/12',
    'with-unknown': 'gh issue edit 12 --add-label needs-po; gh frobnicate 12; gh issue edit 12 --frob x --add-label other',
  },
  'labels-a-b-on-12': {
    comma: 'gh issue edit 12 --add-label a,b',
    'comma-space-reordered': "gh issue edit 12 --add-label 'b, a'",
    repeated: 'gh issue edit 12 --add-label a --add-label b',
    'two-calls': 'gh issue edit 12 --add-label b; gh issue edit 12 --add-label a',
    'api-array': "gh api repos/o/r/issues/12/labels -f 'labels[]=a' -f 'labels[]=b'",
  },
  'comment-on-12': {
    body: `gh issue comment 12 --body $'Needs a PO decision.\\nSee ADR-7.'`,
    'body-short': `gh issue comment 12 -b $'Needs a PO decision.\\nSee ADR-7.'`,
    'body-equals': `gh issue comment 12 --body=$'Needs a PO decision.\\nSee ADR-7.'`,
    'body-file': `printf 'Needs a PO decision.\\nSee ADR-7.\\n' > c.md; gh issue comment 12 --body-file c.md`,
    'body-file-short-crlf': `printf 'Needs a PO decision.\\r\\nSee ADR-7.\\r\\n\\r\\n' > c.md; gh issue comment 12 -F c.md`,
    'body-file-equals': `printf 'Needs a PO decision.\\nSee ADR-7.\\n' > c.md; gh issue comment --body-file=c.md 12`,
    stdin: `printf 'Needs a PO decision.\\nSee ADR-7.\\n' | gh issue comment 12 --body-file -`,
    'stdin-short': `printf 'Needs a PO decision.\\nSee ADR-7.\\n' | gh issue comment 12 -F -`,
    'pr-comment': `gh pr comment 12 -b $'Needs a PO decision.\\nSee ADR-7.'`,
    url: `gh issue comment https://github.com/o/r/issues/12 -b $'Needs a PO decision.\\nSee ADR-7.'`,
    'api-field': `gh api repos/o/r/issues/12/comments -f body=$'Needs a PO decision.\\nSee ADR-7.'`,
    'api-field-file': `printf 'Needs a PO decision.\\nSee ADR-7.\\n' > c.md; gh api repos/o/r/issues/12/comments -F body=@c.md`,
    'api-input': `echo '{"body":"Needs a PO decision.\\nSee ADR-7."}' | gh api -X POST repos/o/r/issues/12/comments --input -`,
  },
  'unicode-comment-on-12': {
    body: "gh issue comment 12 -b 'café 😀'",
    'api-input-escapes': `echo '{"body":"caf\\u00e9 \\ud83d\\ude00"}' | gh api repos/o/r/issues/12/comments --input -`,
  },
  'create-pr': {
    long: 'gh pr create --title "Fix cart" --body "Closes #12" --base main --head fix-cart',
    reordered: 'gh pr create --head fix-cart --base=main --body "Closes #12" --title "Fix cart"',
    short: 'gh pr create -t "Fix cart" -b "Closes #12" -B main -H fix-cart -R o/r',
    'body-file': 'printf "Closes #12\\n" > pr.md; gh pr create -t "Fix cart" -F pr.md -B main -H fix-cart',
    'draft-false': 'gh pr create -t "Fix cart" -b "Closes #12" -B main -H fix-cart --draft=false',
    api: 'gh api repos/o/r/pulls -f title="Fix cart" -f body="Closes #12" -f base=main -f head=fix-cart',
  },
  'create-pr-draft': {
    flag: 'gh pr create -t "Fix cart" -b "Closes #12" -B main -H fix-cart --draft',
    short: 'gh pr create -d -t "Fix cart" -b "Closes #12" -B main -H fix-cart',
    'draft-between': 'gh pr create -t "Fix cart" --draft -b "Closes #12" -B main -H fix-cart',
    api: 'gh api repos/o/r/pulls -f title="Fix cart" -f body="Closes #12" -f base=main -f head=fix-cart -F draft=true',
  },
  'approve-7': {
    long: 'gh pr review 7 --approve --body LGTM',
    short: 'gh pr review 7 -a -b LGTM',
    'body-first': 'gh pr review --body=LGTM 7 --approve',
    'approve-last': 'gh pr review 7 -b LGTM -a',
    url: 'gh pr review https://github.com/o/r/pull/7 --approve -b LGTM',
    'body-file': 'printf "LGTM\\n" > r.md; gh pr review 7 --approve -F r.md',
    api: 'gh api repos/o/r/pulls/7/reviews -f event=APPROVE -f body=LGTM',
  },
  'request-changes-7': {
    long: 'gh pr review 7 --request-changes --body LGTM',
    api: 'gh api repos/o/r/pulls/7/reviews -f event=REQUEST_CHANGES -f body=LGTM',
  },
  'close-12': {
    issue: 'gh issue close 12',
    pr: 'gh pr close 12',
    url: 'gh issue close https://github.com/o/r/issues/12 -R o/r',
    'api-issue': 'gh api -X PATCH repos/o/r/issues/12 -f state=closed',
    'api-pull': 'gh api -X PATCH repos/o/r/pulls/12 -f state=closed',
  },
  'close-12-not-planned': {
    reason: "gh issue close 12 --reason 'not planned'",
    'reason-short': 'gh issue close 12 -r "Not Planned"',
    api: 'gh api -X PATCH repos/o/r/issues/12 -f state=closed -f state_reason=not_planned',
  },
  'close-12-with-comment': {
    flag: 'gh issue close 12 --comment "Done in #7"',
    'two-calls': 'gh issue comment 12 -b "Done in #7"; gh issue close 12',
    api: 'gh api repos/o/r/issues/12/comments -f body="Done in #7"; gh api -X PATCH repos/o/r/issues/12 -f state=closed',
    // The comment made by close --comment is this session's last comment too.
    'close-then-edit-last': 'gh issue close 12 -c old; gh issue comment 12 --edit-last -b "Done in #7"',
    'delete-close-comment': 'gh issue comment 12 -b "Done in #7"; gh issue close 12 -c x; gh issue comment 12 --delete-last',
  },
  'ready-7': {
    plain: 'gh pr ready 7',
    url: 'gh pr ready https://github.com/o/r/pull/7',
    repo: 'gh pr ready -R o/r 7',
  },
  'draft-7': {
    undo: 'gh pr ready 7 --undo',
  },
  'remove-label-x-12': {
    edit: 'gh issue edit 12 --remove-label x',
    api: 'gh api -X DELETE repos/o/r/issues/12/labels/x',
    'add-then-remove': 'gh issue edit 12 --add-label x; gh issue edit 12 --remove-label x',
  },
  'assign-alice-12': {
    edit: 'gh issue edit 12 --add-assignee alice',
    api: "gh api repos/o/r/issues/12/assignees -f 'assignees[]=alice'",
  },
  'label-needs-po-on-13': { plain: 'gh issue edit 13 --add-label needs-po' },
  'label-needs-qm-on-12': { plain: 'gh issue edit 12 --add-label needs-qm' },
  'comment-on-13': { body: `gh issue comment 13 --body $'Needs a PO decision.\\nSee ADR-7.'` },
  // --edit-last replaces this session's last comment: the same state as writing it that way,
  // or deleting the last comment and commenting again. Boolean flags (--edit-last, --yes,
  // --create-if-none) never take or overwrite the body, wherever they stand.
  'other-comment-on-12': {
    body: "gh issue comment 12 --body 'Needs a PO decision.'",
    'edit-last': "gh issue comment 12 -b old; gh issue comment 12 --edit-last --body 'Needs a PO decision.'",
    'edit-last-after-body': "gh issue comment 12 -b old; gh issue comment 12 --body 'Needs a PO decision.' --edit-last",
    'edit-last-before-number': "gh issue comment 12 -b old; gh issue comment --edit-last 12 -b 'Needs a PO decision.'",
    'edit-last-equals': "gh issue comment 12 -b old; gh issue comment 12 --edit-last=true --body='Needs a PO decision.'",
    'edit-last-body-file': "gh issue comment 12 -b old; printf 'Needs a PO decision.\\n' > c.md; gh issue comment 12 -F c.md --edit-last",
    'edit-last-twice': "gh issue comment 12 -b old; gh issue comment 12 --edit-last -b mid; gh issue comment 12 -b 'Needs a PO decision.' --edit-last",
    'edit-last-pr': "gh pr comment 12 -b old; gh pr comment 12 --edit-last -b 'Needs a PO decision.'",
    'edit-last-create-existing': "gh issue comment 12 -b old; gh issue comment 12 --create-if-none --edit-last -b 'Needs a PO decision.'",
    'create-if-none': "gh issue comment 12 --edit-last --create-if-none -b 'Needs a PO decision.'",
    'create-if-none-first': "gh issue comment --create-if-none 12 -b 'Needs a PO decision.' --edit-last",
    'delete-and-recomment': "gh issue comment 12 -b old; gh issue comment 12 --delete-last --yes; gh issue comment 12 -b 'Needs a PO decision.'",
    'yes-first': "gh issue comment 12 -b old; gh issue comment --yes 12 --delete-last; gh issue comment 12 -b 'Needs a PO decision.'",
    'api-then-edit-last': "gh api repos/o/r/issues/12/comments -f body=old; gh issue comment 12 --edit-last -b 'Needs a PO decision.'",
  },
  'two-comments-on-12': {
    plain: 'gh issue comment 12 -b first; gh issue comment 12 -b second',
    'edit-last': 'gh issue comment 12 -b first; gh issue comment 12 -b old; gh issue comment 12 --edit-last -b second',
    'delete-and-recomment': 'gh issue comment 12 -b first; gh issue comment 12 -b old; gh issue comment 12 --delete-last --yes; gh issue comment 12 -b second',
    'edit-other-item-untouched': 'gh issue comment 12 -b first; gh issue comment 12 -b second; gh issue comment 13 --edit-last -b x',
  },
  // No effect: no call, reads, and calls the shim does not represent (left out, not guessed).
  nothing: {
    'no-call': 'true',
    reads: 'gh issue view 12; gh pr view 7 --json state; gh pr checks 7; gh api repos/o/r/pulls/7; gh auth status; gh search issues x',
    'unknown-subcommand': 'gh frobnicate 12; gh label create x; gh issue lock 12',
    'unknown-flag': 'gh issue edit 12 --add-label needs-po --frobnicate',
    'no-number': 'gh pr ready; gh pr comment -b hi',
    'editor-body': 'gh issue comment 12 --editor',
    graphql: "gh api graphql -f query='mutation { x }'",
    'nested-input': `echo '{"labels":[{"name":"x"}]}' | gh api repos/o/r/issues/12/labels --input -`,
    'replace-labels': "gh api -X PUT repos/o/r/issues/12/labels -f 'labels[]=x'",
    'missing-body-file': 'gh issue comment 12 --body-file nope.md',
    // gh fails on these (no comment of the current user to edit or delete; misused flags);
    // the shim still answers success, so they are left out and logged.
    'edit-last-none': 'gh issue comment 12 --edit-last -b x',
    'delete-last-none': 'gh issue comment 12 --delete-last --yes',
    'create-without-edit': 'gh issue comment 12 --create-if-none -b x',
    'edit-and-delete': 'gh issue comment 12 --edit-last --delete-last -b x',
    'web-body': 'gh issue comment 12 --web -b x; gh pr comment 12 -w',
    'editor-short': 'gh issue comment 12 -e',
  },
};

const scenarios = {};
for (const [cls, forms] of Object.entries(CLASSES)) for (const [form, script] of Object.entries(forms)) scenarios[`${cls}/${form}`] = script;
const out = runScenarios(scenarios);
const EMPTY = '{"items":{},"created":{"pullRequests":[],"issues":[]}}\n';

test('every scenario ran and wrote a state', () => {
  for (const name of Object.keys(scenarios)) assert.ok(out[name] && (out[name].wrote || name === 'nothing/no-call'), `${name}: no state`);
});

for (const [cls, forms] of Object.entries(CLASSES)) {
  test(`equivalent forms give one state: ${cls}`, () => {
    const names = Object.keys(forms).map((f) => `${cls}/${f}`);
    const first = out[names[0]];
    for (const n of names.slice(1)) {
      assert.equal(out[n].json, first.json, `${n} differs from ${names[0]}`);
      assert.equal(out[n].tsv, first.tsv, `${n} (tsv) differs from ${names[0]}`);
    }
  });
}

test('different effects give different states', () => {
  const byClass = Object.entries(CLASSES).map(([cls, forms]) => [cls, out[`${cls}/${Object.keys(forms)[0]}`].json]);
  for (let i = 0; i < byClass.length; i++) {
    for (let j = i + 1; j < byClass.length; j++) assert.notEqual(byClass[i][1], byClass[j][1], `${byClass[i][0]} and ${byClass[j][0]} give the same state`);
  }
});

test('unknown subcommands and unreadable forms leave the state empty and are logged', () => {
  for (const form of Object.keys(CLASSES.nothing)) assert.equal(out[`nothing/${form}`].json, EMPTY, form);
  assert.equal(out['nothing/no-call'].unparsed, null);
  assert.equal(out['nothing/reads'].unparsed, null, 'reads are known: not logged as unparsed');
  for (const form of ['unknown-subcommand', 'unknown-flag', 'no-number', 'editor-body', 'graphql', 'nested-input', 'replace-labels', 'missing-body-file',
    'edit-last-none', 'delete-last-none', 'create-without-edit', 'edit-and-delete', 'web-body', 'editor-short']) {
    assert.ok(out[`nothing/${form}`].unparsed, `${form}: not logged`);
  }
  assert.match(out['nothing/unknown-subcommand'].unparsed, /^unknown subcommand\tfrobnicate 12$/m);
  // An unknown call next to known ones changes nothing about them.
  assert.equal(out['label-needs-po-on-12/with-unknown'].json, out['label-needs-po-on-12/plain'].json);
});

test('the state says what happened, in a shape checks can read', () => {
  assert.deepEqual(out['label-needs-po-on-12/plain'].state, { items: { 12: { labelsAdded: ['needs-po'] } }, created: { pullRequests: [], issues: [] } });
  assert.equal(out['label-needs-po-on-12/plain'].tsv, 'item\t12\tlabel\tneeds-po\n');
  assert.deepEqual(out['comment-on-12/stdin'].state.items[12].comments, ['Needs a PO decision.\nSee ADR-7.']);
  assert.match(out['comment-on-12/stdin'].tsv, /^item\t12\tcomment\tNeeds a PO decision\.\\nSee ADR-7\.$/m);
  assert.deepEqual(out['unicode-comment-on-12/body'].state.items[12].comments, ['café 😀']);
  assert.deepEqual(out['create-pr/long'].state.created.pullRequests, [{ title: 'Fix cart', body: 'Closes #12', base: 'main', head: 'fix-cart', draft: false }]);
  assert.deepEqual(out['approve-7/long'].state.items[7], { reviews: [{ event: 'APPROVE', body: 'LGTM' }] });
  assert.deepEqual(out['close-12-not-planned/reason'].state.items[12], { state: 'closed', stateReason: 'not_planned' });
  assert.deepEqual(out['ready-7/plain'].state.items[7], { draft: false });
  assert.deepEqual(out['remove-label-x-12/edit'].state.items[12], { labelsRemoved: ['x'] });
});

test('--edit-last records the new text, never a flag value (regression: the body was "true")', () => {
  for (const form of Object.keys(CLASSES['other-comment-on-12'])) {
    assert.deepEqual(out[`other-comment-on-12/${form}`].state.items[12], { comments: ['Needs a PO decision.'] }, form);
    assert.doesNotMatch(out[`other-comment-on-12/${form}`].tsv, /\ttrue$/m, form);
    assert.equal(out[`other-comment-on-12/${form}`].unparsed, null, `${form}: logged as unparsed`);
  }
  assert.deepEqual(out['two-comments-on-12/edit-last'].state.items[12], { comments: ['first', 'second'] });
  assert.deepEqual(out['create-pr-draft/draft-between'].state.created.pullRequests[0].body, 'Closes #12');
  assert.match(out['nothing/edit-last-none'].unparsed, /^--edit-last with no earlier comment/m);
  assert.match(out['nothing/delete-last-none'].unparsed, /^--delete-last with no earlier comment/m);
  // Editing on another item leaves 12 alone and, with nothing on 13, is a failed call.
  assert.match(out['two-comments-on-12/edit-other-item-untouched'].unparsed, /^--edit-last with no earlier comment.*\tissue comment 13 /m);
});

test('the shim answers as before (the raw log and stdout are unchanged by the state engine)', async () => {
  const { shell, PRELUDE } = await import('./shell-helpers.mjs');
  const { stdout } = shell(`${PRELUDE}
d=$(mktemp -d); cd "$d"; export PITWALL_GH_STATE="$d/s.json"
: > /tmp/pitwall-gh.log
gh issue edit 12 --add-label needs-po
echo body | gh issue comment 12 -F -
gh frobnicate
echo "LOG<<"; cat /tmp/pitwall-gh.log; echo ">>"`);
  assert.match(stdout, /^https:\/\/github\.com\/example\/repo\/issues\/12$/m);
  assert.match(stdout, /^https:\/\/github\.com\/example\/repo\/issues\/12#issuecomment-1$/m);
  assert.match(stdout, /^ok$/m);
  assert.match(stdout, /LOG<<\nissue edit 12 --add-label needs-po\nissue comment 12 -F -\nfrobnicate\n>>/);
});
