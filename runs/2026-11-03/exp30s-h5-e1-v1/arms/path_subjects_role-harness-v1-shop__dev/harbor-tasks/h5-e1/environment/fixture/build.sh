#!/bin/bash
set -euo pipefail
mkdir -p /app /etc/pitwall && cd /app && git init -q .
[ -d /fixture/000 ] && cp -a /fixture/000/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-04-06T09:00:00+00:00' GIT_COMMITTER_DATE='2026-04-06T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/000.msg
[ -d /fixture/001 ] && cp -a /fixture/001/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-05-18T09:00:00+00:00' GIT_COMMITTER_DATE='2026-05-18T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/001.msg
[ -d /fixture/002 ] && cp -a /fixture/002/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-06-22T09:00:00+00:00' GIT_COMMITTER_DATE='2026-06-22T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/002.msg
[ -d /fixture/003 ] && cp -a /fixture/003/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-03T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-03T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/003.msg
[ -d /fixture/004 ] && cp -a /fixture/004/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-14T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-14T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/004.msg
[ -d /fixture/005 ] && cp -a /fixture/005/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-10-26T09:00:00+00:00' GIT_COMMITTER_DATE='2026-10-26T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/005.msg
[ -d /fixture/006 ] && cp -a /fixture/006/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-11-02T17:40:00+00:00' GIT_COMMITTER_DATE='2026-11-02T17:40:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/006.msg
git rev-parse HEAD > /etc/pitwall/fixture-head
