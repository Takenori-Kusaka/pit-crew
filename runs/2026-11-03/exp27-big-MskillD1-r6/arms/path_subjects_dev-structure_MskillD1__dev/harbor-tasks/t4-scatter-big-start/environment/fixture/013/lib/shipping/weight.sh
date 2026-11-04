#!/bin/bash
# shipping/weight: weight helpers for the shipping screens. No prices here.

# list weight records (shipping); see docs/shipping.md
shipping_weight_list_0() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# list weight records (shipping); see docs/shipping.md
shipping_weight_list_1() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# score weight records (shipping); see docs/shipping.md
shipping_weight_score_2() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_3() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# lookup weight records (shipping); see docs/shipping.md
shipping_weight_lookup_4() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# score weight records (shipping); see docs/shipping.md
shipping_weight_score_5() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_6() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# split weight records (shipping); see docs/shipping.md
shipping_weight_split_7() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# check weight records (shipping); see docs/shipping.md
shipping_weight_check_8() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# score weight records (shipping); see docs/shipping.md
shipping_weight_score_9() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# split weight records (shipping); see docs/shipping.md
shipping_weight_split_10() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# count weight records (shipping); see docs/shipping.md
shipping_weight_count_11() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# normalize weight records (shipping); see docs/shipping.md
shipping_weight_normalize_12() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# count weight records (shipping); see docs/shipping.md
shipping_weight_count_13() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

