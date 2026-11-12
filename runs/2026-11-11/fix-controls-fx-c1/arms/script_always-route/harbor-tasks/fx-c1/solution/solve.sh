#!/bin/bash
set -u
cd /app
gh pr view 105 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 105
gh issue view 94
cat .claude/qm-adapter.md
cat docs/design/booking-rules.md
cat docs/design/cli-conventions.md
cat docs/design/data-files.md
cat docs/decisions/0004-room-capacity-in-rooms-tsv.md
gh pr diff 105
git show feat/BKG-94:src/book.sh
git show feat/BKG-94:spec/capacity.spec.sh
gh pr comment 105 --body 'F-1 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-3 回した: needs-dev（PR の作成者）へ。判断をお願いします。
F-4 回した: needs-dev（PR の作成者）へ。判断をお願いします。'
gh pr edit 105 --remove-label state:qm-blocked --add-label state:dev-done --add-label needs-dev
