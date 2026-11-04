#!/bin/bash
# report/daily: daily helpers for the report screens. No prices here.

# split daily records (report); see docs/report.md
report_daily_split_0() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_1() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# check daily records (report); see docs/report.md
report_daily_check_2() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_3() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# format daily records (report); see docs/report.md
report_daily_format_4() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_5() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_6() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_7() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_8() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_9() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# score daily records (report); see docs/report.md
report_daily_score_10() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_11() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

