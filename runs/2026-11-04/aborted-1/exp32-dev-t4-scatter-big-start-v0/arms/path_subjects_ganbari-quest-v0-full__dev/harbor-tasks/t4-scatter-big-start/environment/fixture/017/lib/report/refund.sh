#!/bin/bash
# report/refund: refund helpers for the report screens. No prices here.

# normalize refund records (report); see docs/report.md
report_refund_normalize_0() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# list refund records (report); see docs/report.md
report_refund_list_1() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# list refund records (report); see docs/report.md
report_refund_list_2() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# normalize refund records (report); see docs/report.md
report_refund_normalize_3() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_4() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# check refund records (report); see docs/report.md
report_refund_check_5() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# score refund records (report); see docs/report.md
report_refund_score_6() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# list refund records (report); see docs/report.md
report_refund_list_7() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# format refund records (report); see docs/report.md
report_refund_format_8() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# check refund records (report); see docs/report.md
report_refund_check_9() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# split refund records (report); see docs/report.md
report_refund_split_10() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# format refund records (report); see docs/report.md
report_refund_format_11() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_12() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# normalize refund records (report); see docs/report.md
report_refund_normalize_13() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

