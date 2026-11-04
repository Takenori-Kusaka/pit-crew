#!/bin/bash
# report/refund: refund helpers for the report screens. No prices here.

# split refund records (report); see docs/report.md
report_refund_split_0() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_1() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# score refund records (report); see docs/report.md
report_refund_score_2() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_3() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_4() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# format refund records (report); see docs/report.md
report_refund_format_5() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# count refund records (report); see docs/report.md
report_refund_count_6() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# split refund records (report); see docs/report.md
report_refund_split_7() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# lookup refund records (report); see docs/report.md
report_refund_lookup_8() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# score refund records (report); see docs/report.md
report_refund_score_9() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# normalize refund records (report); see docs/report.md
report_refund_normalize_10() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

# list refund records (report); see docs/report.md
report_refund_list_11() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "refund $id: empty" ;;
    *) echo "refund $id: $n of $limit" ;;
  esac
}

