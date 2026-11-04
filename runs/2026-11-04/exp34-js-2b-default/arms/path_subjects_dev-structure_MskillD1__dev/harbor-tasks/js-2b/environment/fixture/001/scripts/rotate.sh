#!/bin/bash
# Nightly: compress archive files older than 30 days (docs/decisions/0003).
root=${1:-archive}
find "$root" -maxdepth 1 -name '*.csv' -mtime +30 -print0 | while IFS= read -r -d '' f; do
  gzip -n "$f"
done
echo "rotate: done"
