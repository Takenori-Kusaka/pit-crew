#!/bin/bash
# On-call tool: warns when the newest reading is older than the limit.
LAG_LIMIT_HOURS=6
now=${NOW:-$(date -u +%s)}
last=$(date -u -d "$(tail -1 data/readings/latest.csv | cut -d, -f2)" +%s 2>/dev/null || echo 0)
lag=$(( (now - last) / 3600 ))
if [ "$lag" -gt "$LAG_LIMIT_HOURS" ]; then
  echo "取り込みが ${lag} 時間遅れています。最大 ${LAG_LIMIT_HOURS} 時間を超えたら当番に連絡してください。"
  exit 1
fi
echo "取り込みは ${lag} 時間遅れ（上限 ${LAG_LIMIT_HOURS} 時間）"
