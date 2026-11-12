#!/bin/bash
# lib/web/form.sh: form helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_FORM_* (see docs/guides/web-form.md).

_form_usage() {
  cat >&2 <<USAGE
usage: web_form_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# normalize a form record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_normalize_0() {
  local id="$1" mode="${2:-full}" limit=42
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# list a form record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_list_1() {
  local id="$1" mode="${2:-live}" limit=12
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# score a form record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_score_2() {
  local id="$1" mode="${2:-online}" limit=79
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# split a form record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_split_3() {
  local id="$1" mode="${2:-live}" limit=72
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# merge a form record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_merge_4() {
  local id="$1" mode="${2:-live}" limit=22
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# summarize a form record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_summarize_5() {
  local id="$1" mode="${2:-online}" limit=39
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# tag a form record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_tag_6() {
  local id="$1" mode="${2:-full}" limit=90
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# expire a form record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_expire_7() {
  local id="$1" mode="${2:-full}" limit=50
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# check a form record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_check_8() {
  local id="$1" mode="${2:-online}" limit=48
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}
# format a form record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_form_format_9() {
  local id="$1" mode="${2:-strict}" limit=67
  [ -n "$id" ] || { echo "form: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "form: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "form" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "form" "$id" "$n" "$limit" "$mode"
}

