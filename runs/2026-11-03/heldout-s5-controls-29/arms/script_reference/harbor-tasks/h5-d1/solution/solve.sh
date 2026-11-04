#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'bin/convert')" && cat > 'bin/convert' <<'PITEOF'
#!/bin/bash
# Usage: convert <value> <from> <to>. Units: mm cm m km in ft. The result is rounded to 2 decimals.
factor() { # millimetres per unit
  case $1 in
    mm) echo 1 ;;
    cm) echo 10 ;;
    m) echo 1000 ;;
    km) echo 1000000 ;;
    in) echo 25.4 ;;
    ft) echo 304.8 ;;
    *) echo "unknown unit: $1" >&2; return 1 ;;
  esac
}
from=$(factor "$2") || exit 1
to=$(factor "$3") || exit 1
awk -v v="$1" -v a="$from" -v b="$to" 'BEGIN { printf "%.2f\n", v * a / b }'
PITEOF
mkdir -p "$(dirname 'tests/convert_test.sh')" && cat > 'tests/convert_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
check() { [ "$(bash bin/convert "$1" "$2" "$3")" = "$4" ] || { echo "convert $1 $2 $3: want $4"; fail=1; }; }
check 1 m cm 100.00
check 2500 mm m 2.50
check 3 km m 3000.00
check 1 in mm 25.40
check 1 ft m 0.30
check 12 in ft 1.00
check 10 ft in 120.00
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'UNIT-8 convert: add tests; fix the feet factor (304.8 mm)'
