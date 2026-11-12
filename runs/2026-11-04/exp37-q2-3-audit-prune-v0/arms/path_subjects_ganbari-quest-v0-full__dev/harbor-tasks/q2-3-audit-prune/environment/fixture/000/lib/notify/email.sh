#!/bin/bash
# lib/notify/email.sh: email helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_EMAIL_* (see docs/guides/notify-email.md).

_email_usage() {
  cat >&2 <<USAGE
usage: notify_email_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# list a email record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_list_0() {
  local id="$1" mode="${2:-online}" limit=90
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# score a email record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_score_1() {
  local id="$1" mode="${2:-full}" limit=14
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# split a email record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_split_2() {
  local id="$1" mode="${2:-online}" limit=16
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# merge a email record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_merge_3() {
  local id="$1" mode="${2:-full}" limit=72
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# summarize a email record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_summarize_4() {
  local id="$1" mode="${2:-full}" limit=40
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# tag a email record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_tag_5() {
  local id="$1" mode="${2:-live}" limit=35
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# expire a email record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_expire_6() {
  local id="$1" mode="${2:-strict}" limit=84
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# check a email record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_check_7() {
  local id="$1" mode="${2:-strict}" limit=82
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}
# format a email record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_email_format_8() {
  local id="$1" mode="${2:-strict}" limit=94
  [ -n "$id" ] || { echo "email: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "email: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "email" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "email" "$id" "$n" "$limit" "$mode"
}

