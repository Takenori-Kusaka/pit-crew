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
git show feat/BKG-92:src/book.sh
git show feat/BKG-92:spec/book_date.spec.sh
gh pr comment 103 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 103 --remove-label state:qm-blocked --add-label state:dev-done
