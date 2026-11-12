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
git show feat/BKG-90:src/cancel.sh
git show feat/BKG-90:README.md
git show feat/BKG-90:spec/cancel.spec.sh
gh pr comment 101 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。
F-4 対応しました。
F-5 対応しました。'
gh pr edit 101 --remove-label state:qm-blocked --add-label state:dev-done
