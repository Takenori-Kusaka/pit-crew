#!/bin/bash
t=$(mktemp -d)
echo "st01,2026-01-01T00:00:00Z,1.0" > "$t/2026-01-01.csv"
touch -d 2026-01-01 "$t/2026-01-01.csv"
bash scripts/rotate.sh "$t" >/dev/null
[ -f "$t/2026-01-01.csv.gz" ] || { echo "old file not compressed"; exit 1; }
