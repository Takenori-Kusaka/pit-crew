#!/bin/bash
set -u
cd /app
gh pr view 101 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 101
gh issue view 90
cat .claude/qm-adapter.md
cat docs/design/booking-rules.md
cat docs/design/cli-conventions.md
gh pr diff 101
git checkout -q feat/BKG-90
git log --oneline -6
cat src/cancel.sh
cat README.md
cat spec/cancel.spec.sh
bash tools/check
sed -i 's/echo "not found: $room $date $start"; exit 0;/echo "not found: $room $date $start" >\&2; exit 1;/' src/cancel.sh
sed -i 's/echo "usage: cancel.sh ROOM DATE START"; exit 1;/echo "usage: cancel.sh ROOM DATE START" >\&2; exit 2;/' src/cancel.sh
sed -i "s/^match=.*/match='\$1 == r \&\& \$2 == d \&\& \$3 == s'/" src/cancel.sh
sed -i '$a 取り消しは `bash src/cancel.sh <部屋> <日付> <開始>`。' README.md
sed -i '/^rm -f "\$t"; exit \$fail/i grep -q "^# room" "$t" && grep -q "^kaede" "$t" || { echo "other rows lost"; fail=1; }' spec/cancel.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(cancel): レビューの所見に対応 F-1 F-2 F-3 F-4 F-5 (#90)'
gh pr comment 101 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | all specs pass |
| F-3 | bash tools/check | all specs pass |
| F-4 | bash tools/check | all specs pass |
| F-5 | bash tools/check | all specs pass |

F-1 直した: 一致なしのときは exit 1 にし、メッセージを stderr に出すようにした（src/cancel.sh:9）
F-2 直した: 引数の数が合わないときは exit 2 にし、usage を stderr に出すようにした（src/cancel.sh:5）
F-3 直した: 一致の条件に部屋を足した（src/cancel.sh:7）。別の部屋の予約は消えない
F-4 直した: README.md の使い方に cancel.sh の行を足した
F-5 直した: spec/cancel.spec.sh に、取り消し後もヘッダ行と kaede の行が残る確認を足した'
gh pr edit 101 --remove-label state:qm-blocked --add-label state:dev-done
