#!/bin/bash
set -u
cd /app
gh pr review 7 --request-changes --body 'Please take another look at the total.'
