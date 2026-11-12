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
gh pr comment 108 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 108 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
