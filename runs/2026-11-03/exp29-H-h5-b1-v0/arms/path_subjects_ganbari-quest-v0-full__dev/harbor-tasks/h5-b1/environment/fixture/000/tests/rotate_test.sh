#!/bin/bash
fail=0
d=$(mktemp -d)
mkdir -p "$d/logs"
echo one > "$d/logs/app.log"; bash bin/rotate "$d/logs" "$d/archive" app.log 20261001
echo two > "$d/logs/app.log"; bash bin/rotate "$d/logs" "$d/archive" app.log 20261002
[ "$(cat "$d/logs/app.log.1")" = two ] || { echo "app.log.1"; fail=1; }
[ "$(cat "$d/logs/app.log.2")" = one ] || { echo "app.log.2"; fail=1; }
[ "$(cat "$d/archive/app.log.20261002")" = two ] || { echo "archive"; fail=1; }
rm -rf "$d"
exit $fail

