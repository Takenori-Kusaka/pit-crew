#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'bin/next-bus')" && cat > 'bin/next-bus' <<'PITEOF'
#!/bin/bash
# Usage: next-bus <HHMM>. The first departure at or after the given time.
# After the last departure: the first departure of the next day, marked (翌日).
now=$((10#$1))
while read -r t; do
  [ -z "$t" ] && continue
  if [ $((10#$t)) -ge "$now" ]; then echo "$t"; exit 0; fi
done < data/timetable.txt
echo "$(head -n 1 data/timetable.txt) (翌日)"
PITEOF
mkdir -p "$(dirname 'tests/next_bus_test.sh')" && cat > 'tests/next_bus_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
[ "$(bash bin/next-bus 0600)" = "0610" ] || { echo "next-bus 0600"; fail=1; }
[ "$(bash bin/next-bus 2240)" = "2240" ] || { echo "next-bus 2240"; fail=1; }
[ "$(bash bin/next-bus 2300)" = "0540 (翌日)" ] || { echo "next-bus 2300"; fail=1; }
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'BUS-17 next-bus: after the last bus, show the first of the next day'
