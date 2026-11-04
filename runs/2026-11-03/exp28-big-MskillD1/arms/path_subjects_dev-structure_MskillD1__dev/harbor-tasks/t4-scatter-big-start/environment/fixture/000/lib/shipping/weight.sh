#!/bin/bash
# shipping/weight: weight helpers for the shipping screens. No prices here.

# list weight records (shipping); see docs/shipping.md
shipping_weight_list_0() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_1() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# split weight records (shipping); see docs/shipping.md
shipping_weight_split_2() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_3() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_4() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# list weight records (shipping); see docs/shipping.md
shipping_weight_list_5() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# split weight records (shipping); see docs/shipping.md
shipping_weight_split_6() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# format weight records (shipping); see docs/shipping.md
shipping_weight_format_7() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# normalize weight records (shipping); see docs/shipping.md
shipping_weight_normalize_8() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# score weight records (shipping); see docs/shipping.md
shipping_weight_score_9() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# count weight records (shipping); see docs/shipping.md
shipping_weight_count_10() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

# list weight records (shipping); see docs/shipping.md
shipping_weight_list_11() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "weight: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weight $id: empty" ;;
    *) echo "weight $id: $n of $limit" ;;
  esac
}

