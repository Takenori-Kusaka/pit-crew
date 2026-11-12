#!/bin/bash
set -u
cd /app
gh pr view 104 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 104
gh issue view 93
cat .claude/qm-adapter.md
cat docs/design/booking-rules.md
cat docs/design/cli-conventions.md
gh pr diff 104
git show feat/BKG-93:src/free.sh
git show feat/BKG-93:spec/free.spec.sh
gh pr comment 104 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 104 --remove-label state:qm-blocked --add-label state:dev-done
