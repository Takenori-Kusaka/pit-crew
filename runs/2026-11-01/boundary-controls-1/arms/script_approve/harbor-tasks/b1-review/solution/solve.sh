#!/bin/bash
set -u
cd /app
gh pr review 7 --approve --body 'Looks good.'
