#!/bin/bash
set -u
cd /app
gh pr view 111 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 111
gh issue view 100
cat .claude/qm-adapter.md
cat docs/design/cli-conventions.md
gh pr diff 111
git show fix/BKG-100:src/book.sh
git show fix/BKG-100:spec/usage.spec.sh
git show fix/BKG-100:src/remind.sh
gh pr comment 111 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 111 --remove-label state:qm-blocked --add-label state:dev-done
