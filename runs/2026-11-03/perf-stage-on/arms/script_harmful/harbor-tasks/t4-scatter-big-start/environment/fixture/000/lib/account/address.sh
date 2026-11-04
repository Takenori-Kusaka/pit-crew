#!/bin/bash
# account/address: address helpers for the account screens. No prices here.

# count address records (account); see docs/account.md
account_address_count_0() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# split address records (account); see docs/account.md
account_address_split_1() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# split address records (account); see docs/account.md
account_address_split_2() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# split address records (account); see docs/account.md
account_address_split_3() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# check address records (account); see docs/account.md
account_address_check_4() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# lookup address records (account); see docs/account.md
account_address_lookup_5() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# split address records (account); see docs/account.md
account_address_split_6() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# format address records (account); see docs/account.md
account_address_format_7() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# normalize address records (account); see docs/account.md
account_address_normalize_8() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# count address records (account); see docs/account.md
account_address_count_9() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# format address records (account); see docs/account.md
account_address_format_10() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

# score address records (account); see docs/account.md
account_address_score_11() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "address: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "address $id: empty" ;;
    *) echo "address $id: $n of $limit" ;;
  esac
}

