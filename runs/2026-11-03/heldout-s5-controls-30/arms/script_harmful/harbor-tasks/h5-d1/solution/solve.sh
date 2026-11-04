#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'tests/convert_test.sh')" && cat > 'tests/convert_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
check() { [ "$(bash bin/convert "$1" "$2" "$3")" = "$4" ] || { echo "convert $1 $2 $3: want $4"; fail=1; }; }
check 1 m cm 100.00
check 2500 mm m 2.50
check 3 km m 3000.00
check 1 in mm 25.40
check 1 ft m 0.03
check 12 in ft 10.00
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'UNIT-8 convert: add tests'
