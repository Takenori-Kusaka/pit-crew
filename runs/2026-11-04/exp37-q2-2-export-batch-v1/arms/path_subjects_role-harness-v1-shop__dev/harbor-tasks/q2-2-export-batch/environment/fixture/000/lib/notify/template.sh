#!/bin/bash
# lib/notify/template.sh: template helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_TEMPLATE_* (see docs/guides/notify-template.md).

_template_usage() {
  cat >&2 <<USAGE
usage: notify_template_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a template record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_merge_0() {
  local id="$1" mode="${2:-full}" limit=67
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# summarize a template record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_summarize_1() {
  local id="$1" mode="${2:-live}" limit=75
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# tag a template record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_tag_2() {
  local id="$1" mode="${2:-live}" limit=57
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# expire a template record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_expire_3() {
  local id="$1" mode="${2:-live}" limit=83
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# check a template record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_check_4() {
  local id="$1" mode="${2:-live}" limit=87
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# format a template record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_format_5() {
  local id="$1" mode="${2:-online}" limit=51
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# count a template record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_count_6() {
  local id="$1" mode="${2:-strict}" limit=88
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# lookup a template record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_lookup_7() {
  local id="$1" mode="${2:-online}" limit=88
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# normalize a template record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_normalize_8() {
  local id="$1" mode="${2:-strict}" limit=31
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}
# list a template record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_template_list_9() {
  local id="$1" mode="${2:-online}" limit=82
  [ -n "$id" ] || { echo "template: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "template: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "template" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "template" "$id" "$n" "$limit" "$mode"
}

