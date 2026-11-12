#!/bin/bash
# lib/parcel/label.sh: label helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_LABEL_* (see docs/guides/parcel-label.md).

_label_usage() {
  cat >&2 <<USAGE
usage: parcel_label_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a label record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_list_0() {
  local id="$1" mode="${2:-full}" limit=71
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# score a label record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_score_1() {
  local id="$1" mode="${2:-live}" limit=92
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# split a label record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_split_2() {
  local id="$1" mode="${2:-online}" limit=63
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# merge a label record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_merge_3() {
  local id="$1" mode="${2:-strict}" limit=98
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# summarize a label record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_summarize_4() {
  local id="$1" mode="${2:-full}" limit=31
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# tag a label record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_tag_5() {
  local id="$1" mode="${2:-online}" limit=31
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# expire a label record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_expire_6() {
  local id="$1" mode="${2:-live}" limit=53
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# check a label record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_check_7() {
  local id="$1" mode="${2:-strict}" limit=54
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# format a label record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_format_8() {
  local id="$1" mode="${2:-live}" limit=51
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}
# count a label record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_label_count_9() {
  local id="$1" mode="${2:-full}" limit=62
  [ -n "$id" ] || { echo "label: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "label: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "label" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "label" "$id" "$n" "$limit" "$mode"
}

