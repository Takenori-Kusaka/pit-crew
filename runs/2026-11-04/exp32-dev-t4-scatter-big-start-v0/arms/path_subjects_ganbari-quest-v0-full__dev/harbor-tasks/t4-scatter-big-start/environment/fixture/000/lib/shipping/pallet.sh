#!/bin/bash
# shipping/pallet: pallet helpers for the shipping screens. No prices here.

# check pallet records (shipping); see docs/shipping.md
shipping_pallet_check_0() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# split pallet records (shipping); see docs/shipping.md
shipping_pallet_split_1() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# list pallet records (shipping); see docs/shipping.md
shipping_pallet_list_2() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# split pallet records (shipping); see docs/shipping.md
shipping_pallet_split_3() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# count pallet records (shipping); see docs/shipping.md
shipping_pallet_count_4() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# format pallet records (shipping); see docs/shipping.md
shipping_pallet_format_5() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# list pallet records (shipping); see docs/shipping.md
shipping_pallet_list_6() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# format pallet records (shipping); see docs/shipping.md
shipping_pallet_format_7() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# lookup pallet records (shipping); see docs/shipping.md
shipping_pallet_lookup_8() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# check pallet records (shipping); see docs/shipping.md
shipping_pallet_check_9() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# check pallet records (shipping); see docs/shipping.md
shipping_pallet_check_10() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# format pallet records (shipping); see docs/shipping.md
shipping_pallet_format_11() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

