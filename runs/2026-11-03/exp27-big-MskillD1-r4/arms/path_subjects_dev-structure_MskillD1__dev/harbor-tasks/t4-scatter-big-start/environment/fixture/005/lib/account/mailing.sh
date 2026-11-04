#!/bin/bash
# account/mailing: mailing helpers for the account screens. No prices here.

# score mailing records (account); see docs/account.md
account_mailing_score_0() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_1() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# split mailing records (account); see docs/account.md
account_mailing_split_2() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# check mailing records (account); see docs/account.md
account_mailing_check_3() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_4() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_5() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_6() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_7() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# check mailing records (account); see docs/account.md
account_mailing_check_8() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_9() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# score mailing records (account); see docs/account.md
account_mailing_score_10() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# normalize mailing records (account); see docs/account.md
account_mailing_normalize_11() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# lookup mailing records (account); see docs/account.md
account_mailing_lookup_12() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# list mailing records (account); see docs/account.md
account_mailing_list_13() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

