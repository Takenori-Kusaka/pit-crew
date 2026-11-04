#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'lib/pace.sh')" && cat > 'lib/pace.sh' <<'PITEOF'
#!/bin/bash
# to_secs <time>: m:ss or h:mm:ss in seconds.
to_secs() {
  awk -F: '{ if (NF == 3) print $1 * 3600 + $2 * 60 + $3; else print $1 * 60 + $2 }' <<< "$1"
}
# pace <km> <time>: time per km, rounded to the second, as m:ss/km.
pace() {
  local secs
  secs=$(to_secs "$2")
  awk -v s="$secs" -v k="$1" 'BEGIN { r = int(s / k + 0.5); printf "%d:%02d/km\n", int(r / 60), r % 60 }'
}
PITEOF
mkdir -p "$(dirname 'tests/pace_test.sh')" && cat > 'tests/pace_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
. lib/pace.sh
check() { [ "$1" = "$2" ] || { echo "want $2, got $1"; fail=1; }; }
check "$(to_secs 50:00)" 3000
check "$(to_secs 1:45:00)" 6300
check "$(to_secs 0:07)" 7
check "$(pace 10 50:00)" "5:00/km"
check "$(pace 5 27:30)" "5:30/km"
check "$(pace 21.0975 1:45:00)" "4:59/km"
check "$(pace 5 24:58)" "5:00/km"
check "$(pace 3 14:59)" "5:00/km"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'RUN-14 pace: add tests; round the seconds per km before splitting into m:ss'
