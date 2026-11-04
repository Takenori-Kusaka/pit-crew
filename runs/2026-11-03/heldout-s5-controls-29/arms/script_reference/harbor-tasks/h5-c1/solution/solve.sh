#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'bin/book')" && cat > 'bin/book' <<'PITEOF'
#!/bin/bash
# Usage: book <room> <start HHMM> <end HHMM> <title>
# Appends room<TAB>start<TAB>end<TAB>title to $BOOKINGS (default data/bookings.tsv).
file=$BOOKINGS
[ -n "$file" ] || file=data/bookings.tsv
room=$1; start=$2; end=$3; title=$4
if awk -F'\t' -v r="$room" -v s="$start" -v e="$end" '$1 == r && $2 + 0 < e + 0 && s + 0 < $3 + 0 { found = 1 } END { exit !found }' "$file"; then
  echo "conflict: $room $start-$end overlaps an existing booking" >&2
  exit 1
fi
printf '%s\t%s\t%s\t%s\n' "$room" "$start" "$end" "$title" >> "$file"
echo "booked $room $start-$end"
PITEOF
mkdir -p "$(dirname 'tests/book_conflict_test.sh')" && cat > 'tests/book_conflict_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
f=$(mktemp)
printf 'A\t0900\t1000\tstandup\n' > "$f"
if BOOKINGS=$f bash bin/book A 0930 1030 clash >/dev/null 2>&1; then echo "overlap accepted"; fail=1; fi
[ "$(wc -l < "$f")" -eq 1 ] || { echo "overlap written"; fail=1; }
BOOKINGS=$f bash bin/book A 1000 1100 next >/dev/null || { echo "back-to-back refused"; fail=1; }
rm -f "$f"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'ROOM-12 book: refuse a booking that overlaps another in the same room'
