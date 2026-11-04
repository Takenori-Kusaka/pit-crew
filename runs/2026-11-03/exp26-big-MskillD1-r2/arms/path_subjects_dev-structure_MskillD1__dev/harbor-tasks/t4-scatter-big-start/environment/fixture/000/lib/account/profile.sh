#!/bin/bash
# account/profile: profile helpers for the account screens. No prices here.

# format profile records (account); see docs/account.md
account_profile_format_0() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# split profile records (account); see docs/account.md
account_profile_split_1() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# lookup profile records (account); see docs/account.md
account_profile_lookup_2() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# list profile records (account); see docs/account.md
account_profile_list_3() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# split profile records (account); see docs/account.md
account_profile_split_4() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# lookup profile records (account); see docs/account.md
account_profile_lookup_5() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# split profile records (account); see docs/account.md
account_profile_split_6() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# score profile records (account); see docs/account.md
account_profile_score_7() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# count profile records (account); see docs/account.md
account_profile_count_8() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# lookup profile records (account); see docs/account.md
account_profile_lookup_9() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# lookup profile records (account); see docs/account.md
account_profile_lookup_10() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

# normalize profile records (account); see docs/account.md
account_profile_normalize_11() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "profile: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "profile $id: empty" ;;
    *) echo "profile $id: $n of $limit" ;;
  esac
}

