#!/bin/bash
set -euo pipefail
mkdir -p /app /etc/pitwall && cd /app && git init -q .
[ -d /fixture/000 ] && cp -a /fixture/000/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-01T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-01T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/000.msg
[ -d /fixture/001 ] && cp -a /fixture/001/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-04T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-04T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/001.msg
[ -d /fixture/002 ] && cp -a /fixture/002/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-06T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-06T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/002.msg
[ -d /fixture/003 ] && cp -a /fixture/003/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-08T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-08T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/003.msg
[ -d /fixture/004 ] && cp -a /fixture/004/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-10T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-10T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/004.msg
[ -d /fixture/005 ] && cp -a /fixture/005/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-12T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-12T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/005.msg
[ -d /fixture/006 ] && cp -a /fixture/006/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-14T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-14T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/006.msg
[ -d /fixture/007 ] && cp -a /fixture/007/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-16T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-16T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/007.msg
[ -d /fixture/008 ] && cp -a /fixture/008/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-18T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-18T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/008.msg
[ -d /fixture/009 ] && cp -a /fixture/009/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-20T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-20T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/009.msg
[ -d /fixture/010 ] && cp -a /fixture/010/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-22T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-22T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/010.msg
[ -d /fixture/011 ] && cp -a /fixture/011/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-24T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-24T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/011.msg
[ -d /fixture/012 ] && cp -a /fixture/012/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-26T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-26T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/012.msg
[ -d /fixture/013 ] && cp -a /fixture/013/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-28T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-28T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/013.msg
[ -d /fixture/014 ] && cp -a /fixture/014/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-08-30T09:00:00+00:00' GIT_COMMITTER_DATE='2026-08-30T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/014.msg
[ -d /fixture/015 ] && cp -a /fixture/015/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-02T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-02T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/015.msg
[ -d /fixture/016 ] && cp -a /fixture/016/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-04T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-04T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/016.msg
[ -d /fixture/017 ] && cp -a /fixture/017/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-06T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-06T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/017.msg
[ -d /fixture/018 ] && cp -a /fixture/018/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-08T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-08T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/018.msg
[ -d /fixture/019 ] && cp -a /fixture/019/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-10T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-10T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/019.msg
[ -d /fixture/020 ] && cp -a /fixture/020/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-12T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-12T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/020.msg
[ -d /fixture/021 ] && cp -a /fixture/021/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-14T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-14T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/021.msg
[ -d /fixture/022 ] && cp -a /fixture/022/. /app/ || true
find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='2026-09-16T09:00:00+00:00' GIT_COMMITTER_DATE='2026-09-16T09:00:00+00:00' git -c user.name='fixture' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/022.msg
git rev-parse HEAD > /etc/pitwall/fixture-head
