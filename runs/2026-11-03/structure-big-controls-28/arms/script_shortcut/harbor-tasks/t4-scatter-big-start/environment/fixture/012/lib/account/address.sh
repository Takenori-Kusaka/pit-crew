#!/bin/bash
# account/address: address helpers for the account screens. No prices here.

# normalize address records (account); see docs/account.md
account_address_normalize_0() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# normalize address records (account); see docs/account.md
account_address_normalize_1() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# list address records (account); see docs/account.md
account_address_list_2() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# normalize address records (account); see docs/account.md
account_address_normalize_3() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# lookup address records (account); see docs/account.md
account_address_lookup_4() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# format address records (account); see docs/account.md
account_address_format_5() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# normalize address records (account); see docs/account.md
account_address_normalize_6() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# lookup address records (account); see docs/account.md
account_address_lookup_7() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# check address records (account); see docs/account.md
account_address_check_8() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# check address records (account); see docs/account.md
account_address_check_9() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# lookup address records (account); see docs/account.md
account_address_lookup_10() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# score address records (account); see docs/account.md
account_address_score_11() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

