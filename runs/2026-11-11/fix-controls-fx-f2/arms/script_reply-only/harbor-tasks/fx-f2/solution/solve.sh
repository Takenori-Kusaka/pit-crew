#!/bin/bash
set -u
cd /app
gh pr view 112 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 112
gh issue view 86
cat .claude/qm-adapter.md
cat docs/design/listing-format.md
cat docs/design/cli-conventions.md
gh pr diff 112
git show fix/BKG-86:src/list.sh
git show fix/BKG-86:src/remind.sh
git show fix/BKG-86:spec/list_date.spec.sh
gh pr comment 112 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。'
gh pr edit 112 --remove-label state:qm-blocked --add-label state:dev-done
