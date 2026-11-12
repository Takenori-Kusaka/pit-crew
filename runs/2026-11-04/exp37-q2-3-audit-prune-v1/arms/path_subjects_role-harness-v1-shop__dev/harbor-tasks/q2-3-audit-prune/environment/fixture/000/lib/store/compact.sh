#!/bin/bash
# lib/store/compact.sh: compact helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_COMPACT_* (see docs/guides/store-compact.md).

_compact_usage() {
  cat >&2 <<USAGE
usage: store_compact_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a compact record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_split_0() {
  local id="$1" mode="${2:-strict}" limit=45
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# merge a compact record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_merge_1() {
  local id="$1" mode="${2:-full}" limit=47
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# summarize a compact record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_summarize_2() {
  local id="$1" mode="${2:-live}" limit=65
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# tag a compact record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_tag_3() {
  local id="$1" mode="${2:-online}" limit=75
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# expire a compact record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_expire_4() {
  local id="$1" mode="${2:-full}" limit=41
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# check a compact record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_check_5() {
  local id="$1" mode="${2:-strict}" limit=62
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# format a compact record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_format_6() {
  local id="$1" mode="${2:-live}" limit=17
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# count a compact record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_count_7() {
  local id="$1" mode="${2:-full}" limit=53
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# lookup a compact record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_lookup_8() {
  local id="$1" mode="${2:-full}" limit=84
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}
# normalize a compact record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_compact_normalize_9() {
  local id="$1" mode="${2:-online}" limit=25
  [ -n "$id" ] || { echo "compact: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "compact: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "compact" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "compact" "$id" "$n" "$limit" "$mode"
}

