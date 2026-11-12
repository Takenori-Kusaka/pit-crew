#!/bin/bash
# lib/notify/bounce.sh: bounce helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_BOUNCE_* (see docs/guides/notify-bounce.md).

_bounce_usage() {
  cat >&2 <<USAGE
usage: notify_bounce_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a bounce record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_score_0() {
  local id="$1" mode="${2:-online}" limit=38
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# split a bounce record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_split_1() {
  local id="$1" mode="${2:-live}" limit=17
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# merge a bounce record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_merge_2() {
  local id="$1" mode="${2:-strict}" limit=50
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# summarize a bounce record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_summarize_3() {
  local id="$1" mode="${2:-live}" limit=85
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# tag a bounce record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_tag_4() {
  local id="$1" mode="${2:-full}" limit=92
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# expire a bounce record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_expire_5() {
  local id="$1" mode="${2:-full}" limit=27
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# check a bounce record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_check_6() {
  local id="$1" mode="${2:-online}" limit=76
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# format a bounce record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_format_7() {
  local id="$1" mode="${2:-strict}" limit=12
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# count a bounce record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_count_8() {
  local id="$1" mode="${2:-live}" limit=62
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}
# lookup a bounce record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_bounce_lookup_9() {
  local id="$1" mode="${2:-full}" limit=64
  [ -n "$id" ] || { echo "bounce: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "bounce: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "bounce" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "bounce" "$id" "$n" "$limit" "$mode"
}

