#!/bin/bash
set -u
cd /app
gh pr view 106 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 106
gh issue view 95
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 106
git checkout -q feat/BKG-95
git log --oneline -6
cat src/remind.sh
cat spec/remind.spec.sh
bash tools/check
sed -i 's#list.sh" "$1")$#list.sh" "$1") || exit $?#' src/remind.sh
sed -i 's/echo "usage: remind.sh DATE"; exit 2/echo "usage: remind.sh DATE" >\&2; exit 2/' src/remind.sh
sed -i '/^rm -f "\$t"; exit \$fail/i [ "$(BOOKINGS=$t bash src/remind.sh 2026-01-01)" = "reminder to x: aoi 2026-01-01 10:00-11:00" ] || { echo "a day with a booking"; fail=1; }' spec/remind.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(remind): レビューの所見に対応 F-1 F-2 F-3 (#95)'
git reset -q --soft develop
git commit -q -m 'feat(remind): 予約が無い日は no bookings を出す (#95) [squashed]'
git push --force origin feat/BKG-95
gh pr comment 106 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | all specs pass |
| F-3 | bash tools/check | all specs pass |

F-1 直した: src/list.sh が失敗したらその終了コードで終わるようにした（src/remind.sh:5）
F-2 直した: usage を stderr に出すようにした（src/remind.sh:4）
F-3 直した: spec/remind.spec.sh に、予約がある日の reminder to の行の確認を足した
F-4 回した: 利用者に見える文言を Issue #95 と設計書（docs/design/listing-format.md）の決定から変える求めなので、needs-po（@po-lead）へ: 文言を「<日付> の予約はありません」に変えるかどうかの判断をお願いします。決まるまで文言と設計書は変えていません'
gh pr edit 106 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-po
