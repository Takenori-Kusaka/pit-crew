#!/bin/bash
# report/audit: audit helpers for the report screens. No prices here.

# count audit records (report); see docs/report.md
report_audit_count_0() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# check audit records (report); see docs/report.md
report_audit_check_1() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_2() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# normalize audit records (report); see docs/report.md
report_audit_normalize_3() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_4() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_5() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_6() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# normalize audit records (report); see docs/report.md
report_audit_normalize_7() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_8() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# list audit records (report); see docs/report.md
report_audit_list_9() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_10() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_11() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# normalize audit records (report); see docs/report.md
report_audit_normalize_12() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_13() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_14() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

