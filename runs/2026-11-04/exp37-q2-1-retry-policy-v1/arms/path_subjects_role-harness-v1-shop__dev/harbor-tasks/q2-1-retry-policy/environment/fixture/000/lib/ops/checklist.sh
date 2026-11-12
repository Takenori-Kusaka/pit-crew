#!/bin/bash
# lib/ops/checklist.sh: checklist helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_CHECKLIST_* (see docs/guides/ops-checklist.md).

_checklist_usage() {
  cat >&2 <<USAGE
usage: ops_checklist_<verb> <id> [mode]
verbs: summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# summarize a checklist record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_summarize_0() {
  local id="$1" mode="${2:-full}" limit=22
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# tag a checklist record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_tag_1() {
  local id="$1" mode="${2:-full}" limit=37
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# expire a checklist record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_expire_2() {
  local id="$1" mode="${2:-live}" limit=91
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# check a checklist record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_check_3() {
  local id="$1" mode="${2:-online}" limit=13
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# format a checklist record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_format_4() {
  local id="$1" mode="${2:-online}" limit=47
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# count a checklist record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_count_5() {
  local id="$1" mode="${2:-full}" limit=59
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# lookup a checklist record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_lookup_6() {
  local id="$1" mode="${2:-strict}" limit=29
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# normalize a checklist record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_normalize_7() {
  local id="$1" mode="${2:-online}" limit=75
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}
# list a checklist record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_checklist_list_8() {
  local id="$1" mode="${2:-full}" limit=47
  [ -n "$id" ] || { echo "checklist: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "checklist: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "checklist" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "checklist" "$id" "$n" "$limit" "$mode"
}

