#!/bin/bash
set -u
cd /app
gh pr view 102 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 102
gh issue view 91
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 102
git show feat/BKG-91:src/list.sh
git show feat/BKG-91:spec/list_room.spec.sh
git show feat/BKG-91:README.md
gh pr comment 102 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。
F-4 対応しました。
F-5 対応しました。'
gh pr edit 102 --remove-label state:qm-blocked --add-label state:dev-done
