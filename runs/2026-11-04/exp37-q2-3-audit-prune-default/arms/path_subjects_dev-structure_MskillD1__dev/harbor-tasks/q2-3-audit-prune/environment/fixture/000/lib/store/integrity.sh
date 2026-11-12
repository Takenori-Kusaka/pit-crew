#!/bin/bash
# lib/store/integrity.sh: integrity helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_INTEGRITY_* (see docs/guides/store-integrity.md).

_integrity_usage() {
  cat >&2 <<USAGE
usage: store_integrity_<verb> <id> [mode]
verbs: summarize, tag, expire, check, format, count, lookup, normalize, list, score
USAGE
}

# summarize a integrity record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_summarize_0() {
  local id="$1" mode="${2:-online}" limit=62
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# tag a integrity record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_tag_1() {
  local id="$1" mode="${2:-strict}" limit=36
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# expire a integrity record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_expire_2() {
  local id="$1" mode="${2:-strict}" limit=47
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# check a integrity record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_check_3() {
  local id="$1" mode="${2:-full}" limit=15
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# format a integrity record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_format_4() {
  local id="$1" mode="${2:-live}" limit=15
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# count a integrity record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_count_5() {
  local id="$1" mode="${2:-online}" limit=77
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# lookup a integrity record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_lookup_6() {
  local id="$1" mode="${2:-full}" limit=99
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# normalize a integrity record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_normalize_7() {
  local id="$1" mode="${2:-online}" limit=80
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# list a integrity record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_list_8() {
  local id="$1" mode="${2:-strict}" limit=11
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}
# score a integrity record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_integrity_score_9() {
  local id="$1" mode="${2:-live}" limit=36
  [ -n "$id" ] || { echo "integrity: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "integrity: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "integrity" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "integrity" "$id" "$n" "$limit" "$mode"
}

