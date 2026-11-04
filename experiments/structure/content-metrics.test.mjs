// Both directions for each measure: commands that should match and commands that should not.
// Run: node --test experiments/structure/content-metrics.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { broadSearch, broughtMain, historySearch, pickaxe, reachedHelper, threeDot, twoDot } from './content-metrics.mjs';

const yes = (f, c) => assert.equal(f([c]), true, c);
const no = (f, c) => assert.equal(f([c]), false, c);

test('broadSearch: searching by meaning, not by the visible expression', () => {
  yes(broadSearch, 'grep -rn -i "round" lib bin');
  yes(broadSearch, "grep -rn '/ 10' lib");
  yes(broadSearch, 'rg -n "rounded down" .');
  yes(broadSearch, 'grep -rn "切り捨て" docs');
  no(broadSearch, "grep -rn '+ 99' bin lib");   // EXP-23: the visible expression only
  no(broadSearch, 'grep -rn "90" bin lib');
  no(broadSearch, 'cat lib/util/money.sh');      // reading is not searching
});

test('historySearch: looking for the change in history', () => {
  yes(historySearch, 'git log -S "+ 9" --oneline');
  yes(historySearch, 'git log -G "round" -p');
  yes(historySearch, 'git log --stat -5');
  yes(historySearch, 'git show f02b252');
  no(historySearch, 'git log --oneline | head');
  no(historySearch, 'git status');
});

test('pickaxe: git log -S / -G only', () => {
  yes(pickaxe, 'git log -S "+ 9" --oneline');
  yes(pickaxe, 'git log --oneline -G "/ 10"');
  no(pickaxe, 'git show f02b252');
  no(pickaxe, 'git log -p -3');
});

test('broughtMain: rebase / merge / pull of main, not merge-base', () => {
  yes(broughtMain, 'git rebase main');
  yes(broughtMain, 'git merge --no-edit main');
  yes(broughtMain, 'git pull --rebase origin main');
  no(broughtMain, 'git merge-base --is-ancestor main HEAD && echo ok');   // EXP-26: only looks
  no(broughtMain, 'git diff HEAD...main --stat');
  no(broughtMain, 'git checkout -q main && git merge -q --ff-only fix/PRC-501'); // merging the branch into main
});

test('reachedHelper: the shared helper with the fourth copy', () => {
  yes(reachedHelper, 'cat lib/util/money.sh');
  yes(reachedHelper, 'grep -rn round_tenth .');
  no(reachedHelper, 'cat lib/receipt/line.sh');
});

test('threeDot / twoDot: how the branch was compared with main', () => {
  yes(threeDot, 'git diff main...HEAD --stat');
  yes(threeDot, 'git log --oneline HEAD...main');
  yes(threeDot, 'git merge-base HEAD main');
  no(threeDot, 'git diff main --stat');
  no(threeDot, 'git log main..HEAD');
  yes(twoDot, 'git diff main --stat');           // EXP-24: the one harmed run
  yes(twoDot, 'git log --oneline main..HEAD');
  yes(twoDot, 'git diff HEAD..main');
  no(twoDot, 'git diff main...HEAD');
  no(twoDot, 'git rebase main');
  no(twoDot, 'git checkout main');
});
