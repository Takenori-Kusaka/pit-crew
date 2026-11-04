#!/bin/bash
set -euo pipefail
mkdir -p /app /etc/pitwall && cd /app && git init -q .
[ -d /fixture/000 ] && cp -a /fixture/000/. /app/ || true
git add -A && GIT_AUTHOR_DATE='2024-08-12T09:00:00+00:00' GIT_COMMITTER_DATE='2024-08-12T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/000.msg
[ -d /fixture/001 ] && cp -a /fixture/001/. /app/ || true
git add -A && GIT_AUTHOR_DATE='2024-09-02T09:00:00+00:00' GIT_COMMITTER_DATE='2024-09-02T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/001.msg
[ -d /fixture/002 ] && cp -a /fixture/002/. /app/ || true
git add -A && GIT_AUTHOR_DATE='2025-11-03T09:00:00+00:00' GIT_COMMITTER_DATE='2025-11-03T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/002.msg
[ -d /fixture/003 ] && cp -a /fixture/003/. /app/ || true
git add -A && GIT_AUTHOR_DATE='2026-09-15T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-15T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/003.msg
git rev-parse HEAD > /etc/pitwall/fixture-head
