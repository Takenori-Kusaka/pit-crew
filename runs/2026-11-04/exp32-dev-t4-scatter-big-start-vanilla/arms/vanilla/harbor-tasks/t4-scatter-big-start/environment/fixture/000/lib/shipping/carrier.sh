#!/bin/bash
# shipping/carrier: carrier helpers for the shipping screens. No prices here.

# score carrier records (shipping); see docs/shipping.md
shipping_carrier_score_0() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# normalize carrier records (shipping); see docs/shipping.md
shipping_carrier_normalize_1() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# format carrier records (shipping); see docs/shipping.md
shipping_carrier_format_2() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# score carrier records (shipping); see docs/shipping.md
shipping_carrier_score_3() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# score carrier records (shipping); see docs/shipping.md
shipping_carrier_score_4() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# count carrier records (shipping); see docs/shipping.md
shipping_carrier_count_5() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# score carrier records (shipping); see docs/shipping.md
shipping_carrier_score_6() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# list carrier records (shipping); see docs/shipping.md
shipping_carrier_list_7() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# lookup carrier records (shipping); see docs/shipping.md
shipping_carrier_lookup_8() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# normalize carrier records (shipping); see docs/shipping.md
shipping_carrier_normalize_9() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# split carrier records (shipping); see docs/shipping.md
shipping_carrier_split_10() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# check carrier records (shipping); see docs/shipping.md
shipping_carrier_check_11() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

