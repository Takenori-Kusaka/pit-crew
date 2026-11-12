#!/bin/bash
set -u
cd /app
gh pr view 113 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 113
gh issue view 87
cat .claude/qm-adapter.md
cat docs/design/cli-conventions.md
cat docs/design/booking-rules.md
cat .claude/dev-adapter.md
gh pr diff 113
git show feat/BKG-87:tools/check
git show feat/BKG-87:src/book.sh
git show feat/BKG-87:spec/book_time.spec.sh
gh pr comment 113 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 113 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
