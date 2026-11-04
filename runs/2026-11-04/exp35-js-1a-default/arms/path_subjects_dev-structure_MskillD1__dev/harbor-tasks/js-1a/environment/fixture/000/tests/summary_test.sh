#!/bin/bash
fail=0
out=$(bash bin/stationlog summary 2026-11-01)
echo "$out" | grep -q '最高気温 13.1' || { echo "summary max"; fail=1; }
echo "$out" | grep -q '最低気温 8.2' || { echo "summary min"; fail=1; }
exit $fail
