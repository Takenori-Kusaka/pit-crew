#!/bin/bash
set -u
cd /app
gh pr view 107 --json number,title,state,headRefName,baseRefName,labels,commits,statusCheckRollup,reviews,comments
gh pr checks 107
gh issue view 96
cat .claude/qm-adapter.md
cat docs/design/data-files.md
cat docs/design/cli-conventions.md
gh pr diff 107
git show feat/BKG-96:tools/purge-archive
gh pr comment 107 --body 'F-1 対応しました。
F-2 対応しました。
F-3 対応しました。
F-4 対応しました。'
gh pr edit 107 --remove-label state:qm-blocked --add-label state:dev-done
