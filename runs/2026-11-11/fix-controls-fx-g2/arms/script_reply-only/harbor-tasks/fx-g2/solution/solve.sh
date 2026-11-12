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
git show feat/BKG-88:tools/check
git show feat/BKG-88:src/list.sh
git show feat/BKG-88:spec/list_room.spec.sh
gh pr comment 114 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 114 --remove-label state:qm-blocked --add-label state:dev-done
