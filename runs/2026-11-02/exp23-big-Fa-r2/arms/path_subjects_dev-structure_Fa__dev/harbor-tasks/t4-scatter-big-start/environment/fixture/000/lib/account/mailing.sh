#!/bin/bash
# account/mailing: mailing helpers for the account screens. No prices here.

# list mailing records (account); see docs/account.md
account_mailing_list_0() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# list mailing records (account); see docs/account.md
account_mailing_list_1() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# score mailing records (account); see docs/account.md
account_mailing_score_2() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# lookup mailing records (account); see docs/account.md
account_mailing_lookup_3() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# score mailing records (account); see docs/account.md
account_mailing_score_4() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_5() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# normalize mailing records (account); see docs/account.md
account_mailing_normalize_6() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# split mailing records (account); see docs/account.md
account_mailing_split_7() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_8() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# format mailing records (account); see docs/account.md
account_mailing_format_9() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# list mailing records (account); see docs/account.md
account_mailing_list_10() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

# count mailing records (account); see docs/account.md
account_mailing_count_11() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "mailing: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "mailing $id: empty" ;;
    *) echo "mailing $id: $n of $limit" ;;
  esac
}

