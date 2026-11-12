#!/bin/bash
# lib/notify/optout.sh: optout helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_OPTOUT_* (see docs/guides/notify-optout.md).

_optout_usage() {
  cat >&2 <<USAGE
usage: notify_optout_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# score a optout record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_score_0() {
  local id="$1" mode="${2:-full}" limit=51
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# split a optout record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_split_1() {
  local id="$1" mode="${2:-online}" limit=22
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# merge a optout record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_merge_2() {
  local id="$1" mode="${2:-online}" limit=59
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# summarize a optout record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_summarize_3() {
  local id="$1" mode="${2:-live}" limit=26
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# tag a optout record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_tag_4() {
  local id="$1" mode="${2:-live}" limit=99
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# expire a optout record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_expire_5() {
  local id="$1" mode="${2:-online}" limit=59
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# check a optout record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_check_6() {
  local id="$1" mode="${2:-strict}" limit=18
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# format a optout record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_format_7() {
  local id="$1" mode="${2:-online}" limit=23
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}
# count a optout record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_optout_count_8() {
  local id="$1" mode="${2:-online}" limit=97
  [ -n "$id" ] || { echo "optout: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "optout: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "optout" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "optout" "$id" "$n" "$limit" "$mode"
}

