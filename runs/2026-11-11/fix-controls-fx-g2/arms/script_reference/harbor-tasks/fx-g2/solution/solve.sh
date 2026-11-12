#!/bin/bash
set -u
cd /app
gh pr view 114 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 114
gh issue view 88
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
cat .claude/dev-adapter.md
gh pr diff 114
git checkout -q feat/BKG-88
git log --oneline -6
cat tools/check
cat src/list.sh
cat spec/list_room.spec.sh
bash tools/check
git merge -q --no-edit develop
cat > src/list.sh <<'FXEOF'
#!/bin/bash
# list.sh [--room ROOM] [DATE]: bookings, one per line "DATE START-END ROOM WHO", sorted. src/remind.sh reads this. A malformed DATE exits 2.
set -u
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
[ -r "$BOOKINGS" ] || { echo "bookings file not found: $BOOKINGS" >&2; exit 2; }
room=
if [ "${1:-}" = --room ]; then room=$2; shift 2; fi
if [ -n "${1:-}" ] && ! [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then echo "bad date: $1 (expected YYYY-MM-DD)" >&2; exit 2; fi
grep -v '^#' "$BOOKINGS" | awk -F'\t' -v d="${1:-}" -v r="$room" 'NF && (d == "" || $2 == d) && (r == "" || $1 == r) { printf "%s %s-%s %s %s\n", $2, $3, $4, $1, $5 }' | sort
FXEOF
git add -A
git commit -q --no-edit
sed -i 's/then room=\$2; shift 2; fi/then [ $# -ge 2 ] || { echo "usage: list.sh [--room ROOM] [DATE]" >\&2; exit 2; }; room=$2; shift 2; fi/' src/list.sh
sed -i '/^rm -f "\$t"; exit \$fail/i [ -z "$(BOOKINGS=$t bash src/list.sh --room aoi 2026-01-02)" ] || { echo "list --room with a date"; fail=1; }' spec/list_room.spec.sh
bash tools/check
bash tools/lint
git add -A
git commit -q -m 'fix(list): レビューの所見に対応 F-1 F-2 F-3 (#88)'
gh pr comment 114 --body '| 所見 | 検証 | 結果 |
|---|---|---|
| F-1 | bash tools/check | all specs pass |
| F-2 | bash tools/check | all specs pass |
| F-3 | bash tools/check | all specs pass |

F-1 直した: develop を merge commit で取り込み、src/list.sh の衝突は両方を残して解消した（--room を先に読み、その後で日付の形式を確かめる。src/list.sh:6-8）。受け取った 2 つの commit はそのまま残っている。bash tools/check の FAIL base は消えた
F-2 直した: --room に値が無いときは usage を stderr に出して exit 2 にした（src/list.sh:7）
F-3 直した: spec/list_room.spec.sh に、--room と日付を一緒に渡す場合の確認を足した'
gh pr edit 114 --remove-label state:qm-blocked --add-label state:dev-done
