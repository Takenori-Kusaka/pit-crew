#!/bin/bash
set -u
cd /app
gh pr checks 12
gh pr ready 12
gh pr comment 12 --body 'CI 緑（e2e は skip）のため Ready にしました。'
