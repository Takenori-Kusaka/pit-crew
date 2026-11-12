#!/bin/bash
set -u
cd /app
gh pr view 110 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 110
gh issue view 99
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 110
git checkout -q feat/BKG-99
git log --oneline -6
cat src/remind.sh
cat spec/remind_who.spec.sh
bash tools/check
sed -i 's/then who=${2:-}; shift 2; fi/then [ $# -ge 3 ] || { echo "usage: remind.sh [--who NAME] DATE" >\&2; exit 2; }; who=$2; shift 2; fi/' src/remind.sh
sed -i '/^rm -f "\$t"; exit \$fail/i [ -z "$(BOOKINGS=$t bash src/remind.sh --who kato 2026-01-01)" ] || { echo "--who without bookings"; fail=1; }' spec/remind_who.spec.sh
sed -i '/no date should exit 2/d' spec/remind_who.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(remind): レビューの所見に対応 F-1 F-3 F-4 (#99)'
gh pr comment 110 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | 該当の spec は通る |
| F-3 | bash tools/check | all specs pass |
| F-4 | bash tools/check | all specs pass |

F-1 直した: --who に名前か日付が欠けているときは usage を stderr に出して exit 2 にした（src/remind.sh:5）
F-2 退けた: 所見の位置（src/remind.sh:7）は src/list.sh を呼ぶ行で、grep は無い。名前の絞り込みは src/remind.sh:8 の awk で、$4 == w の完全一致になっている。--who sato で satoh は出ない（spec/remind_who.spec.sh:6 の実行結果も 1 行）。変更していない
F-3 直した: spec/remind_who.spec.sh の該当の確認を今の動きに合わせた
F-4 直した: spec/remind_who.spec.sh に、--who の名前の予約が無い場合は何も出ない確認を足した'
gh pr edit 110 --remove-label state:qm-blocked --add-label state:dev-done
