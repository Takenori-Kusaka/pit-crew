#!/bin/bash
set -u
cd /app
gh pr view 110 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 110
gh issue view 99
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 110
git show feat/BKG-99:src/remind.sh
git show feat/BKG-99:spec/remind_who.spec.sh
gh pr comment 110 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-4 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 110 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
