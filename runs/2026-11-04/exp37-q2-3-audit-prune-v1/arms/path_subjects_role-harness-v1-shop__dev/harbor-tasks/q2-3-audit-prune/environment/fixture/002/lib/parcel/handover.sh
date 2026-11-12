#!/bin/bash
# lib/parcel/handover.sh: handover helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_HANDOVER_* (see docs/guides/parcel-handover.md).

_handover_usage() {
  cat >&2 <<USAGE
usage: parcel_handover_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a handover record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_merge_0() {
  local id="$1" mode="${2:-live}" limit=93
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# summarize a handover record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_summarize_1() {
  local id="$1" mode="${2:-strict}" limit=98
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# tag a handover record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_tag_2() {
  local id="$1" mode="${2:-full}" limit=18
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# expire a handover record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_expire_3() {
  local id="$1" mode="${2:-strict}" limit=34
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# check a handover record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_check_4() {
  local id="$1" mode="${2:-live}" limit=97
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# format a handover record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_format_5() {
  local id="$1" mode="${2:-full}" limit=55
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# count a handover record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_count_6() {
  local id="$1" mode="${2:-live}" limit=15
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# lookup a handover record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_lookup_7() {
  local id="$1" mode="${2:-live}" limit=60
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# normalize a handover record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_normalize_8() {
  local id="$1" mode="${2:-live}" limit=59
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}
# list a handover record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_handover_list_9() {
  local id="$1" mode="${2:-online}" limit=46
  [ -n "$id" ] || { echo "handover: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "handover: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handover" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handover" "$id" "$n" "$limit" "$mode"
}

