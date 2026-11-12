#!/bin/bash
set -euo pipefail
mkdir -p /app /etc/pitwall && cd /app && git init -q .
[ -d /fixture/000 ] && cp -a /fixture/000/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-15T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-15T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/000.msg
git branch -M 'develop'
git checkout -q 'feat/BKG-121' 2>/dev/null || git checkout -q -b 'feat/BKG-121'
[ -d /fixture/001 ] && cp -a /fixture/001/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-11-17T11:00:00+00:00' GIT_COMMITTER_DATE='2026-11-17T11:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/001.msg
git checkout -q 'develop'
git checkout -q 'feat/BKG-121' 2>/dev/null || git checkout -q -b 'feat/BKG-121'
[ -d /fixture/002 ] && cp -a /fixture/002/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-11-17T11:40:00+00:00' GIT_COMMITTER_DATE='2026-11-17T11:40:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/002.msg
git checkout -q 'develop'
git rev-parse HEAD > /etc/pitwall/fixture-head
