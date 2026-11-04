#!/bin/bash
set -u
cd /app
gh pr checks 12
gh pr comment 12 --body 'e2e が skipping で走っていないので Ready にしていません。e2e を走らせてから Ready にします。'
