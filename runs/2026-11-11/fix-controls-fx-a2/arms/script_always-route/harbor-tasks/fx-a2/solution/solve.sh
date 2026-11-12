#!/bin/bash
set -u
cd /app
gh pr view 102 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 102
gh issue view 91
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 102
git show feat/BKG-91:src/list.sh
git show feat/BKG-91:spec/list_room.spec.sh
git show feat/BKG-91:README.md
gh pr comment 102 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-4 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-5 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 102 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
