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
git show feat/BKG-97:src/list.sh
git show feat/BKG-97:spec/list_count.spec.sh
gh pr comment 108 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 108 --remove-label state:qm-blocked --add-label state:dev-done
