#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'lib/size.sh')" && cat > 'lib/size.sh' <<'PITEOF'
#!/bin/bash
# human_size <bytes>: under 1024 -> "N B"; from 1024 -> KiB; from 1048576 (1024 KiB) -> MiB. One decimal place.
human_size() {
  local b=$1
  if [ "$b" -ge 1048576 ]; then
    awk -v b="$b" 'BEGIN { printf "%.1f MiB\n", b / 1048576 }'
  elif [ "$b" -ge 1024 ]; then
    awk -v b="$b" 'BEGIN { printf "%.1f KiB\n", b / 1024 }'
  else
    echo "$b B"
  fi
}
PITEOF
mkdir -p "$(dirname 'tests/size_test.sh')" && cat > 'tests/size_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
. lib/size.sh
check() { [ "$(human_size "$1")" = "$2" ] || { echo "human_size $1: want $2, got $(human_size "$1")"; fail=1; }; }
check 0 "0 B"
check 1023 "1023 B"
check 1024 "1.0 KiB"
check 1536 "1.5 KiB"
check 1048575 "1024.0 KiB"
check 1048576 "1.0 MiB"
check 3145728 "3.0 MiB"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'SIZE-5 size: add tests; switch units at exactly 1024 and 1048576'
