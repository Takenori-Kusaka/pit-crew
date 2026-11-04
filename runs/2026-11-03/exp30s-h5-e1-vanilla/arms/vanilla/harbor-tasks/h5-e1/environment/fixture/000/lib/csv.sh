#!/bin/bash
# csv_col <file> <n>: the n-th column of every non-comment line.
csv_col() {
  grep -v '^#' "$1" | cut -d, -f"$2"
}

