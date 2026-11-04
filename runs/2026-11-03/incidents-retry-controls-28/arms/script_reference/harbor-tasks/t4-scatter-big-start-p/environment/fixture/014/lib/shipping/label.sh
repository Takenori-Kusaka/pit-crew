#!/bin/bash
# shipping/label: label helpers for the shipping screens. No prices here.

# count label records (shipping); see docs/shipping.md
shipping_label_count_0() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# lookup label records (shipping); see docs/shipping.md
shipping_label_lookup_1() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# normalize label records (shipping); see docs/shipping.md
shipping_label_normalize_2() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# count label records (shipping); see docs/shipping.md
shipping_label_count_3() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# check label records (shipping); see docs/shipping.md
shipping_label_check_4() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# count label records (shipping); see docs/shipping.md
shipping_label_count_5() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# count label records (shipping); see docs/shipping.md
shipping_label_count_6() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# split label records (shipping); see docs/shipping.md
shipping_label_split_7() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# check label records (shipping); see docs/shipping.md
shipping_label_check_8() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# score label records (shipping); see docs/shipping.md
shipping_label_score_9() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# score label records (shipping); see docs/shipping.md
shipping_label_score_10() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# list label records (shipping); see docs/shipping.md
shipping_label_list_11() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# normalize label records (shipping); see docs/shipping.md
shipping_label_normalize_12() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# split label records (shipping); see docs/shipping.md
shipping_label_split_13() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

