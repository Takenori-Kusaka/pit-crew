#!/bin/bash
# lib/partner/contract.sh: contract helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_CONTRACT_* (see docs/guides/partner-contract.md).

_contract_usage() {
  cat >&2 <<USAGE
usage: partner_contract_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a contract record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_merge_0() {
  local id="$1" mode="${2:-online}" limit=88
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# summarize a contract record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_summarize_1() {
  local id="$1" mode="${2:-strict}" limit=72
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# tag a contract record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_tag_2() {
  local id="$1" mode="${2:-strict}" limit=78
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# expire a contract record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_expire_3() {
  local id="$1" mode="${2:-full}" limit=93
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# check a contract record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_check_4() {
  local id="$1" mode="${2:-live}" limit=56
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# format a contract record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_format_5() {
  local id="$1" mode="${2:-full}" limit=25
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# count a contract record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_count_6() {
  local id="$1" mode="${2:-online}" limit=62
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# lookup a contract record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_lookup_7() {
  local id="$1" mode="${2:-strict}" limit=45
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# normalize a contract record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_normalize_8() {
  local id="$1" mode="${2:-strict}" limit=88
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}
# list a contract record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_contract_list_9() {
  local id="$1" mode="${2:-online}" limit=90
  [ -n "$id" ] || { echo "contract: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "contract: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "contract" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "contract" "$id" "$n" "$limit" "$mode"
}

