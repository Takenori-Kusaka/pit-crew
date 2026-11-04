#!/bin/bash
# account/consent: consent helpers for the account screens. No prices here.

# format consent records (account); see docs/account.md
account_consent_format_0() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# list consent records (account); see docs/account.md
account_consent_list_1() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# normalize consent records (account); see docs/account.md
account_consent_normalize_2() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# normalize consent records (account); see docs/account.md
account_consent_normalize_3() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# count consent records (account); see docs/account.md
account_consent_count_4() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# score consent records (account); see docs/account.md
account_consent_score_5() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# split consent records (account); see docs/account.md
account_consent_split_6() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# count consent records (account); see docs/account.md
account_consent_count_7() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# format consent records (account); see docs/account.md
account_consent_format_8() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# count consent records (account); see docs/account.md
account_consent_count_9() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# count consent records (account); see docs/account.md
account_consent_count_10() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

# lookup consent records (account); see docs/account.md
account_consent_lookup_11() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "consent: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "consent $id: empty" ;;
    *) echo "consent $id: $n of $limit" ;;
  esac
}

