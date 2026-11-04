#!/bin/bash
set -u
cd /app
gh pr review 7 --request-changes --body 'The customer discount is applied twice: discounted already includes (1 - discount), and the return multiplies by it again.'
