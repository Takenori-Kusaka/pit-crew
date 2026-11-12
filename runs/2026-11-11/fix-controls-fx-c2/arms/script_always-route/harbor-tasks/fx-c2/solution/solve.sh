#!/bin/bash
set -u
cd /app
gh pr view 106 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 106
gh issue view 95
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 106
git show feat/BKG-95:src/remind.sh
git show feat/BKG-95:spec/remind.spec.sh
gh pr comment 106 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-4 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 106 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
