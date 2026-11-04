#!/bin/bash
# shipping/pallet: pallet helpers for the shipping screens. No prices here.

# check pallet records (shipping); see docs/shipping.md
shipping_pallet_check_0() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# count pallet records (shipping); see docs/shipping.md
shipping_pallet_count_1() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# format pallet records (shipping); see docs/shipping.md
shipping_pallet_format_2() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# score pallet records (shipping); see docs/shipping.md
shipping_pallet_score_3() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# score pallet records (shipping); see docs/shipping.md
shipping_pallet_score_4() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# normalize pallet records (shipping); see docs/shipping.md
shipping_pallet_normalize_5() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# split pallet records (shipping); see docs/shipping.md
shipping_pallet_split_6() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# format pallet records (shipping); see docs/shipping.md
shipping_pallet_format_7() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# normalize pallet records (shipping); see docs/shipping.md
shipping_pallet_normalize_8() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# normalize pallet records (shipping); see docs/shipping.md
shipping_pallet_normalize_9() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# split pallet records (shipping); see docs/shipping.md
shipping_pallet_split_10() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# score pallet records (shipping); see docs/shipping.md
shipping_pallet_score_11() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# lookup pallet records (shipping); see docs/shipping.md
shipping_pallet_lookup_12() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# score pallet records (shipping); see docs/shipping.md
shipping_pallet_score_13() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

# check pallet records (shipping); see docs/shipping.md
shipping_pallet_check_14() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "pallet: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "pallet $id: empty" ;;
    *) echo "pallet $id: $n of $limit" ;;
  esac
}

