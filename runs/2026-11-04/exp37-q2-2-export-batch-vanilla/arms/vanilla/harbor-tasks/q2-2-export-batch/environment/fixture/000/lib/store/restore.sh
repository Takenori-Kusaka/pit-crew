#!/bin/bash
# lib/store/restore.sh: restore helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_RESTORE_* (see docs/guides/store-restore.md).

_restore_usage() {
  cat >&2 <<USAGE
usage: store_restore_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# split a restore record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_split_0() {
  local id="$1" mode="${2:-full}" limit=51
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# merge a restore record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_merge_1() {
  local id="$1" mode="${2:-strict}" limit=27
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# summarize a restore record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_summarize_2() {
  local id="$1" mode="${2:-full}" limit=49
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# tag a restore record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_tag_3() {
  local id="$1" mode="${2:-live}" limit=16
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# expire a restore record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_expire_4() {
  local id="$1" mode="${2:-strict}" limit=90
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# check a restore record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_check_5() {
  local id="$1" mode="${2:-online}" limit=42
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# format a restore record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_format_6() {
  local id="$1" mode="${2:-full}" limit=86
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# count a restore record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_count_7() {
  local id="$1" mode="${2:-full}" limit=54
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}
# lookup a restore record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_restore_lookup_8() {
  local id="$1" mode="${2:-strict}" limit=89
  [ -n "$id" ] || { echo "restore: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "restore: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "restore" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "restore" "$id" "$n" "$limit" "$mode"
}

