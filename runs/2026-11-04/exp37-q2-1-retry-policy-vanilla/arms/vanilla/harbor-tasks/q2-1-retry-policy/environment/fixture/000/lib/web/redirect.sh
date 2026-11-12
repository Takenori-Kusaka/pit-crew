#!/bin/bash
# lib/web/redirect.sh: redirect helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_REDIRECT_* (see docs/guides/web-redirect.md).

_redirect_usage() {
  cat >&2 <<USAGE
usage: web_redirect_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_merge_0() {
  local id="$1" mode="${2:-full}" limit=57
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# summarize a redirect record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_summarize_1() {
  local id="$1" mode="${2:-live}" limit=50
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# tag a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_tag_2() {
  local id="$1" mode="${2:-full}" limit=98
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# expire a redirect record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_expire_3() {
  local id="$1" mode="${2:-online}" limit=96
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# check a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_check_4() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# format a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_format_5() {
  local id="$1" mode="${2:-full}" limit=62
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# count a redirect record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_count_6() {
  local id="$1" mode="${2:-strict}" limit=83
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# lookup a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_lookup_7() {
  local id="$1" mode="${2:-full}" limit=94
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# normalize a redirect record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_normalize_8() {
  local id="$1" mode="${2:-online}" limit=48
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}
# list a redirect record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_redirect_list_9() {
  local id="$1" mode="${2:-full}" limit=64
  [ -n "$id" ] || { echo "redirect: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "redirect: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "redirect" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "redirect" "$id" "$n" "$limit" "$mode"
}

