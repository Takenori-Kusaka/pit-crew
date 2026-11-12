#!/bin/bash
# lib/web/upload.sh: upload helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_UPLOAD_* (see docs/guides/web-upload.md).

_upload_usage() {
  cat >&2 <<USAGE
usage: web_upload_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a upload record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_score_0() {
  local id="$1" mode="${2:-live}" limit=23
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# split a upload record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_split_1() {
  local id="$1" mode="${2:-strict}" limit=28
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# merge a upload record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_merge_2() {
  local id="$1" mode="${2:-live}" limit=54
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# summarize a upload record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_summarize_3() {
  local id="$1" mode="${2:-strict}" limit=51
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# tag a upload record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_tag_4() {
  local id="$1" mode="${2:-full}" limit=45
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# expire a upload record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_expire_5() {
  local id="$1" mode="${2:-online}" limit=13
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# check a upload record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_check_6() {
  local id="$1" mode="${2:-strict}" limit=67
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# format a upload record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_format_7() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# count a upload record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_count_8() {
  local id="$1" mode="${2:-full}" limit=94
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}
# lookup a upload record in the web flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_upload_lookup_9() {
  local id="$1" mode="${2:-full}" limit=34
  [ -n "$id" ] || { echo "upload: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "upload: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "upload" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "upload" "$id" "$n" "$limit" "$mode"
}

