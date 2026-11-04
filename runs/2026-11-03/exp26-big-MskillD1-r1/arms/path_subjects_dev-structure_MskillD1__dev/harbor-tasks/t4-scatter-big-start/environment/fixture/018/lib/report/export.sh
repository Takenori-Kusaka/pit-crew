#!/bin/bash
# report/export: export helpers for the report screens. No prices here.

# score export records (report); see docs/report.md
report_export_score_0() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# score export records (report); see docs/report.md
report_export_score_1() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# normalize export records (report); see docs/report.md
report_export_normalize_2() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# check export records (report); see docs/report.md
report_export_check_3() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# list export records (report); see docs/report.md
report_export_list_4() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# list export records (report); see docs/report.md
report_export_list_5() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# list export records (report); see docs/report.md
report_export_list_6() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# count export records (report); see docs/report.md
report_export_count_7() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# lookup export records (report); see docs/report.md
report_export_lookup_8() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# score export records (report); see docs/report.md
report_export_score_9() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# score export records (report); see docs/report.md
report_export_score_10() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

# split export records (report); see docs/report.md
report_export_split_11() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "export: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "export $id: empty" ;;
    *) echo "export $id: $n of $limit" ;;
  esac
}

