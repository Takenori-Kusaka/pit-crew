#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'tests/size_test.sh')" && cat > 'tests/size_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
. lib/size.sh
check() { [ "$(human_size "$1")" = "$2" ] || { echo "human_size $1: want $2, got $(human_size "$1")"; fail=1; }; }
check 0 "0 B"
check 1023 "1023 B"
check 1024 "1024 B"
check 1536 "1.5 KiB"
check 1048576 "1024.0 KiB"
check 3145728 "3.0 MiB"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'SIZE-5 size: add tests'
