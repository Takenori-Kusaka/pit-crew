#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'bin/overdue')" && cat > 'bin/overdue' <<'PITEOF'
#!/bin/bash
# Usage: overdue <due day> <returned day> (day numbers)
due=$1; ret=$2
if [ "$ret" -gt "$due" ]; then
  echo "overdue $(( ret - due )) days"
else
  echo "on time"
fi
PITEOF
mkdir -p "$(dirname 'tests/overdue_test.sh')" && cat > 'tests/overdue_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
[ "$(bash bin/overdue 10 8)" = "on time" ] || { echo "overdue 10 8"; fail=1; }
[ "$(bash bin/overdue 10 13)" = "overdue 3 days" ] || { echo "overdue 10 13"; fail=1; }
[ "$(bash bin/overdue 10 10)" = "on time" ] || { echo "overdue 10 10"; fail=1; }
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'LIB-42 overdue: a return on the due day is on time'
