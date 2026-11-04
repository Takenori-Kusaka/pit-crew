#!/bin/bash
# report/export: export helpers for the report screens. No prices here.

# format export records (report); see docs/report.md
report_export_format_0() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# count export records (report); see docs/report.md
report_export_count_1() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# format export records (report); see docs/report.md
report_export_format_2() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# score export records (report); see docs/report.md
report_export_score_3() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# lookup export records (report); see docs/report.md
report_export_lookup_4() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# check export records (report); see docs/report.md
report_export_check_5() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# list export records (report); see docs/report.md
report_export_list_6() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# check export records (report); see docs/report.md
report_export_check_7() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# count export records (report); see docs/report.md
report_export_count_8() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# check export records (report); see docs/report.md
report_export_check_9() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# split export records (report); see docs/report.md
report_export_split_10() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# lookup export records (report); see docs/report.md
report_export_lookup_11() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

