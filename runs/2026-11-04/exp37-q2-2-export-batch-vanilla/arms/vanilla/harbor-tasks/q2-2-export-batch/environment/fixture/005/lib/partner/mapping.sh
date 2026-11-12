#!/bin/bash
# lib/partner/mapping.sh: mapping helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_MAPPING_* (see docs/guides/partner-mapping.md).

_mapping_usage() {
  cat >&2 <<USAGE
usage: partner_mapping_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a mapping record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_split_0() {
  local id="$1" mode="${2:-strict}" limit=64
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# merge a mapping record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_merge_1() {
  local id="$1" mode="${2:-strict}" limit=22
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# summarize a mapping record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_summarize_2() {
  local id="$1" mode="${2:-live}" limit=89
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# tag a mapping record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_tag_3() {
  local id="$1" mode="${2:-live}" limit=77
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# expire a mapping record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_expire_4() {
  local id="$1" mode="${2:-strict}" limit=93
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# check a mapping record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_check_5() {
  local id="$1" mode="${2:-full}" limit=98
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# format a mapping record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_format_6() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# count a mapping record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_count_7() {
  local id="$1" mode="${2:-strict}" limit=39
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# lookup a mapping record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_lookup_8() {
  local id="$1" mode="${2:-live}" limit=97
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}
# normalize a mapping record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_mapping_normalize_9() {
  local id="$1" mode="${2:-online}" limit=29
  [ -n "$id" ] || { echo "mapping: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "mapping: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "mapping" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "mapping" "$id" "$n" "$limit" "$mode"
}

