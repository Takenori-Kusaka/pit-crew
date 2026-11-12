#!/bin/bash
# lib/notify/sms.sh: sms helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_SMS_* (see docs/guides/notify-sms.md).

_sms_usage() {
  cat >&2 <<USAGE
usage: notify_sms_<verb> <id> [mode]
verbs: lookup, normalize, list, score, split, merge, summarize, tag, expire, check
USAGE
}

# lookup a sms record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_lookup_0() {
  local id="$1" mode="${2:-full}" limit=91
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# normalize a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_normalize_1() {
  local id="$1" mode="${2:-live}" limit=17
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# list a sms record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_list_2() {
  local id="$1" mode="${2:-strict}" limit=51
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# score a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_score_3() {
  local id="$1" mode="${2:-live}" limit=55
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# split a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_split_4() {
  local id="$1" mode="${2:-live}" limit=51
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# merge a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_merge_5() {
  local id="$1" mode="${2:-live}" limit=99
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# summarize a sms record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_summarize_6() {
  local id="$1" mode="${2:-online}" limit=30
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# tag a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_tag_7() {
  local id="$1" mode="${2:-live}" limit=93
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# expire a sms record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_expire_8() {
  local id="$1" mode="${2:-live}" limit=77
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}
# check a sms record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_sms_check_9() {
  local id="$1" mode="${2:-online}" limit=14
  [ -n "$id" ] || { echo "sms: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "sms: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sms" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sms" "$id" "$n" "$limit" "$mode"
}

