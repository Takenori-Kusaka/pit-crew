#!/bin/bash
# lib/partner/sla.sh: sla helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_SLA_* (see docs/guides/partner-sla.md).

_sla_usage() {
  cat >&2 <<USAGE
usage: partner_sla_<verb> <id> [mode]
verbs: lookup, normalize, list, score, split, merge, summarize, tag, expire, check
USAGE
}

# lookup a sla record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_lookup_0() {
  local id="$1" mode="${2:-full}" limit=85
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# normalize a sla record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_normalize_1() {
  local id="$1" mode="${2:-online}" limit=22
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# list a sla record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_list_2() {
  local id="$1" mode="${2:-strict}" limit=74
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# score a sla record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_score_3() {
  local id="$1" mode="${2:-online}" limit=27
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# split a sla record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_split_4() {
  local id="$1" mode="${2:-strict}" limit=39
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# merge a sla record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_merge_5() {
  local id="$1" mode="${2:-live}" limit=41
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# summarize a sla record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_summarize_6() {
  local id="$1" mode="${2:-online}" limit=39
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# tag a sla record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_tag_7() {
  local id="$1" mode="${2:-full}" limit=61
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# expire a sla record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_expire_8() {
  local id="$1" mode="${2:-strict}" limit=17
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}
# check a sla record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_sla_check_9() {
  local id="$1" mode="${2:-live}" limit=32
  [ -n "$id" ] || { echo "sla: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "sla: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "sla" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "sla" "$id" "$n" "$limit" "$mode"
}

