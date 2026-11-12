#!/bin/bash
# lib/store/snapshot.sh: snapshot helpers for the store flow. Sourced by bin/ tools and tests.
# Settings: RELAY_STORE_SNAPSHOT_* (see docs/guides/store-snapshot.md).

_snapshot_usage() {
  cat >&2 <<USAGE
usage: store_snapshot_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a snapshot record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_merge_0() {
  local id="$1" mode="${2:-strict}" limit=49
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# summarize a snapshot record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_summarize_1() {
  local id="$1" mode="${2:-online}" limit=41
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# tag a snapshot record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_tag_2() {
  local id="$1" mode="${2:-online}" limit=57
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# expire a snapshot record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_expire_3() {
  local id="$1" mode="${2:-strict}" limit=70
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# check a snapshot record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_check_4() {
  local id="$1" mode="${2:-online}" limit=58
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# format a snapshot record in the store flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_format_5() {
  local id="$1" mode="${2:-strict}" limit=60
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# count a snapshot record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_count_6() {
  local id="$1" mode="${2:-online}" limit=96
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# lookup a snapshot record in the store flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_lookup_7() {
  local id="$1" mode="${2:-online}" limit=51
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# normalize a snapshot record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_normalize_8() {
  local id="$1" mode="${2:-live}" limit=65
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}
# list a snapshot record in the store flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
store_snapshot_list_9() {
  local id="$1" mode="${2:-live}" limit=99
  [ -n "$id" ] || { echo "snapshot: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "snapshot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "snapshot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "snapshot" "$id" "$n" "$limit" "$mode"
}

