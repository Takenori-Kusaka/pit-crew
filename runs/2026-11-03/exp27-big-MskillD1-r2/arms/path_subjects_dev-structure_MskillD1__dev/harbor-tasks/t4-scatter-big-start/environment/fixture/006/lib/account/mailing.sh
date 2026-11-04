#!/bin/bash
# account/mailing: mailing helpers for the account screens. No prices here.

# list mailing records (account); see docs/account.md
account_mailing_list_0() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# split mailing records (account); see docs/account.md
account_mailing_split_1() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_2() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# check mailing records (account); see docs/account.md
account_mailing_check_3() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_4() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# score mailing records (account); see docs/account.md
account_mailing_score_5() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# check mailing records (account); see docs/account.md
account_mailing_check_6() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# lookup mailing records (account); see docs/account.md
account_mailing_lookup_7() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_8() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# lookup mailing records (account); see docs/account.md
account_mailing_lookup_9() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# check mailing records (account); see docs/account.md
account_mailing_check_10() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_11() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

