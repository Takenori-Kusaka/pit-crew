#!/bin/bash
# lib/ops/incident.sh: incident helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_INCIDENT_* (see docs/guides/ops-incident.md).

_incident_usage() {
  cat >&2 <<USAGE
usage: ops_incident_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a incident record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_merge_0() {
  local id="$1" mode="${2:-live}" limit=88
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# summarize a incident record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_summarize_1() {
  local id="$1" mode="${2:-full}" limit=71
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# tag a incident record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_tag_2() {
  local id="$1" mode="${2:-live}" limit=33
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# expire a incident record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_expire_3() {
  local id="$1" mode="${2:-live}" limit=23
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# check a incident record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_check_4() {
  local id="$1" mode="${2:-live}" limit=44
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# format a incident record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_format_5() {
  local id="$1" mode="${2:-strict}" limit=85
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# count a incident record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_count_6() {
  local id="$1" mode="${2:-strict}" limit=69
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# lookup a incident record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_lookup_7() {
  local id="$1" mode="${2:-online}" limit=13
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# normalize a incident record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_normalize_8() {
  local id="$1" mode="${2:-strict}" limit=37
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}
# list a incident record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_incident_list_9() {
  local id="$1" mode="${2:-strict}" limit=34
  [ -n "$id" ] || { echo "incident: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "incident: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "incident" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "incident" "$id" "$n" "$limit" "$mode"
}

