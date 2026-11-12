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
gh pr comment 101 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-4 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-5 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 101 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
