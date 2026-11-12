#!/bin/bash
# lib/store/archive.sh: archive helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_ARCHIVE_* (see docs/guides/store-archive.md).

_archive_usage() {
  cat >&2 <<USAGE
usage: store_archive_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# split a archive record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_split_0() {
  local id="$1" mode="${2:-online}" limit=57
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# merge a archive record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_merge_1() {
  local id="$1" mode="${2:-online}" limit=47
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# summarize a archive record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_summarize_2() {
  local id="$1" mode="${2:-live}" limit=49
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# tag a archive record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_tag_3() {
  local id="$1" mode="${2:-full}" limit=79
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# expire a archive record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_expire_4() {
  local id="$1" mode="${2:-strict}" limit=35
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# check a archive record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_check_5() {
  local id="$1" mode="${2:-online}" limit=63
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# format a archive record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_format_6() {
  local id="$1" mode="${2:-online}" limit=12
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# count a archive record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_count_7() {
  local id="$1" mode="${2:-strict}" limit=80
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}
# lookup a archive record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_archive_lookup_8() {
  local id="$1" mode="${2:-live}" limit=53
  [ -n "$id" ] || { echo "archive: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "archive: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "archive" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "archive" "$id" "$n" "$limit" "$mode"
}

