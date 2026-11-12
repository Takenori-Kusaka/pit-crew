#!/bin/bash
# lib/parcel/locker.sh: locker helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_LOCKER_* (see docs/guides/parcel-locker.md).

_locker_usage() {
  cat >&2 <<USAGE
usage: parcel_locker_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a locker record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_score_0() {
  local id="$1" mode="${2:-full}" limit=10
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# split a locker record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_split_1() {
  local id="$1" mode="${2:-live}" limit=49
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# merge a locker record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_merge_2() {
  local id="$1" mode="${2:-online}" limit=58
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# summarize a locker record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_summarize_3() {
  local id="$1" mode="${2:-online}" limit=81
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# tag a locker record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_tag_4() {
  local id="$1" mode="${2:-full}" limit=67
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# expire a locker record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_expire_5() {
  local id="$1" mode="${2:-online}" limit=25
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# check a locker record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_check_6() {
  local id="$1" mode="${2:-online}" limit=45
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# format a locker record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_format_7() {
  local id="$1" mode="${2:-full}" limit=30
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# count a locker record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_count_8() {
  local id="$1" mode="${2:-live}" limit=53
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}
# lookup a locker record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_locker_lookup_9() {
  local id="$1" mode="${2:-live}" limit=88
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "locker: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "locker" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "locker" "$id" "$n" "$limit" "$mode"
}

