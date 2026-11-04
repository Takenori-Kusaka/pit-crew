#!/bin/bash
# report/weekly: weekly helpers for the report screens. No prices here.

# list weekly records (report); see docs/report.md
report_weekly_list_0() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_1() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# normalize weekly records (report); see docs/report.md
report_weekly_normalize_2() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# split weekly records (report); see docs/report.md
report_weekly_split_3() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_4() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_5() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_6() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# normalize weekly records (report); see docs/report.md
report_weekly_normalize_7() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_8() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_9() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# score weekly records (report); see docs/report.md
report_weekly_score_10() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_11() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

