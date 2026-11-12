#!/bin/bash
# lib/parcel/weight.sh: weight helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_WEIGHT_* (see docs/guides/parcel-weight.md).

_weight_usage() {
  cat >&2 <<USAGE
usage: parcel_weight_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a weight record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_score_0() {
  local id="$1" mode="${2:-live}" limit=67
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# split a weight record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_split_1() {
  local id="$1" mode="${2:-live}" limit=48
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# merge a weight record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_merge_2() {
  local id="$1" mode="${2:-strict}" limit=49
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# summarize a weight record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_summarize_3() {
  local id="$1" mode="${2:-live}" limit=77
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# tag a weight record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_tag_4() {
  local id="$1" mode="${2:-live}" limit=15
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# expire a weight record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_expire_5() {
  local id="$1" mode="${2:-full}" limit=15
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# check a weight record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_check_6() {
  local id="$1" mode="${2:-strict}" limit=92
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# format a weight record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_format_7() {
  local id="$1" mode="${2:-full}" limit=37
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# count a weight record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_count_8() {
  local id="$1" mode="${2:-live}" limit=51
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}
# lookup a weight record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_weight_lookup_9() {
  local id="$1" mode="${2:-strict}" limit=62
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "weight: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "weight" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "weight" "$id" "$n" "$limit" "$mode"
}

