#!/bin/bash
# report/audit: audit helpers for the report screens. No prices here.

# split audit records (report); see docs/report.md
report_audit_split_0() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_1() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_2() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# normalize audit records (report); see docs/report.md
report_audit_normalize_3() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_4() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_5() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_6() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_7() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# check audit records (report); see docs/report.md
report_audit_check_8() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# check audit records (report); see docs/report.md
report_audit_check_9() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_10() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_11() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_12() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_13() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

