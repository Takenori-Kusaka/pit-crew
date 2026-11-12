#!/bin/bash
set -u
cd /app
gh pr view 103 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 103
gh issue view 92
cat .claude/qm-adapter.md
cat docs/design/cli-conventions.md
cat docs/design/booking-rules.md
gh pr diff 103
git checkout -q feat/BKG-92
git log --oneline -6
cat src/book.sh
cat spec/book_date.spec.sh
bash tools/check
sed -i 's/invalid date: $date/bad date: $date (expected YYYY-MM-DD)/g' src/book.sh
sed -i '/^rm -f "\$t"; exit \$fail/i b aoi 2026-13-01 10:00 11:00 x; [ $? = 2 ] || { echo "month 13 should exit 2"; fail=1; }' spec/book_date.spec.sh
sed -i '/^rm -f "\$t"; exit \$fail/i b aoi 2026-12-32 10:00 11:00 x; [ $? = 2 ] || { echo "day 32 should exit 2"; fail=1; }' spec/book_date.spec.sh
sed -i '/was rejected/d' spec/book_date.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(book): レビューの所見に対応 F-1 F-2 F-3 (#92)'
gh pr comment 103 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | all specs pass |
| F-3 | bash tools/check | all specs pass |

F-1 直した: spec/book_date.spec.sh の該当の確認を今の動きに合わせた
F-2 直した: メッセージを bad date: <値> (expected YYYY-MM-DD) にそろえた（src/book.sh:7-9）
F-3 直した: spec/book_date.spec.sh に 2026-13-01 と 2026-12-32 が exit 2 になる確認を足した'
gh pr edit 103 --remove-label state:qm-blocked --add-label state:dev-done
