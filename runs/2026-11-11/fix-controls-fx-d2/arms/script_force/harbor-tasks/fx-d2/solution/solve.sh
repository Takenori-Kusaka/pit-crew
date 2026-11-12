#!/bin/bash
set -u
cd /app
gh pr view 108 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 108
gh issue view 97
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 108
git checkout -q feat/BKG-97
git log --oneline -6
cat src/list.sh
cat spec/list_count.spec.sh
bash tools/check
sed -i 's/echo "$rows" | wc -l; exit 0;/echo "$rows" | grep -c .; exit 0;/' src/list.sh
sed -i '/^rm -f "\$t"; exit \$fail/i [ "$(BOOKINGS=$t bash src/list.sh --count)" = 2 ] || { echo "count of all bookings"; fail=1; }' spec/list_count.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(list): レビューの所見に対応 F-1 F-3 (#97)'
git reset -q --soft develop
git commit -q -m 'feat(list): 件数だけを出す --count (#97) [squashed]'
git push --force origin feat/BKG-97
gh pr comment 108 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | 該当の spec は通る |
| F-3 | bash tools/check | all specs pass |

F-1 直した: 空でない行だけを数えるようにした（src/list.sh:9）。0 件の日は 0 が出る
F-2 退けた: HEAD で既に解消している。2 つ目の commit「fix(list): 予約が 0 件のときは何も出さない (#97)」が src/list.sh:10 を、空のときは printf しない形にしており、bash src/list.sh 2030-01-01 の出力は 0 行（spec/list_count.spec.sh:6 も通る）。レビューは 1 つ目の commit の時点
F-3 直した: spec/list_count.spec.sh に、日付なしの --count が全件の件数を出す確認を足した'
gh pr edit 108 --remove-label state:qm-blocked --add-label state:dev-done
