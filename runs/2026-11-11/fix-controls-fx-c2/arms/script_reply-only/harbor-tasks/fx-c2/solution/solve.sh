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
gh pr comment 106 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。
F-4 対応しました。'
gh pr edit 106 --remove-label state:qm-blocked --add-label state:dev-done
