#!/bin/bash
# lib/web/session.sh: session helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_SESSION_* (see docs/guides/web-session.md).

_session_usage() {
  cat >&2 <<USAGE
usage: web_session_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a session record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_split_0() {
  local id="$1" mode="${2:-live}" limit=61
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# merge a session record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_merge_1() {
  local id="$1" mode="${2:-online}" limit=31
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# summarize a session record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_summarize_2() {
  local id="$1" mode="${2:-live}" limit=79
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# tag a session record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_tag_3() {
  local id="$1" mode="${2:-strict}" limit=48
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# expire a session record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_expire_4() {
  local id="$1" mode="${2:-live}" limit=62
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# check a session record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_check_5() {
  local id="$1" mode="${2:-strict}" limit=71
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# format a session record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_format_6() {
  local id="$1" mode="${2:-strict}" limit=83
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# count a session record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_count_7() {
  local id="$1" mode="${2:-online}" limit=46
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# lookup a session record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_lookup_8() {
  local id="$1" mode="${2:-online}" limit=39
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}
# normalize a session record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_session_normalize_9() {
  local id="$1" mode="${2:-strict}" limit=26
  [ -n "$id" ] || { echo "session: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "session: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "session" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "session" "$id" "$n" "$limit" "$mode"
}

