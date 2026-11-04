#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'tests/pace_test.sh')" && cat > 'tests/pace_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
. lib/pace.sh
check() { [ "$1" = "$2" ] || { echo "want $2, got $1"; fail=1; }; }
check "$(to_secs 50:00)" 3000
check "$(to_secs 1:45:00)" 6300
check "$(pace 10 50:00)" "5:00/km"
check "$(pace 5 27:30)" "5:30/km"
check "$(pace 21.0975 1:45:00)" "4:59/km"
check "$(pace 5 24:58)" "4:60/km"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'RUN-14 pace: add tests'
