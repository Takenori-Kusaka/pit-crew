#!/bin/bash
# lib/store/index.sh: index helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_INDEX_* (see docs/guides/store-index.md).

_index_usage() {
  cat >&2 <<USAGE
usage: store_index_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a index record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_list_0() {
  local id="$1" mode="${2:-live}" limit=57
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# score a index record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_score_1() {
  local id="$1" mode="${2:-strict}" limit=95
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# split a index record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_split_2() {
  local id="$1" mode="${2:-online}" limit=56
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# merge a index record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_merge_3() {
  local id="$1" mode="${2:-online}" limit=58
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# summarize a index record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_summarize_4() {
  local id="$1" mode="${2:-strict}" limit=37
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# tag a index record in the store flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_tag_5() {
  local id="$1" mode="${2:-full}" limit=39
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# expire a index record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_expire_6() {
  local id="$1" mode="${2:-live}" limit=25
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# check a index record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_check_7() {
  local id="$1" mode="${2:-live}" limit=30
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# format a index record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_format_8() {
  local id="$1" mode="${2:-online}" limit=31
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}
# count a index record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_index_count_9() {
  local id="$1" mode="${2:-strict}" limit=11
  [ -n "$id" ] || { echo "index: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "index: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "index" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "index" "$id" "$n" "$limit" "$mode"
}

