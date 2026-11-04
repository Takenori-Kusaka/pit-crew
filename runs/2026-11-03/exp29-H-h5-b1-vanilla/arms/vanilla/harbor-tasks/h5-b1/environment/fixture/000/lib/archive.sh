#!/bin/bash
# archive_copy <dir> <archive dir> <name> <stamp>: copy name.1 to <archive dir>/name.<stamp>.
archive_copy() {
  local dir=$1 archive=$2 name=$3 stamp=$4
  mkdir -p "$archive"
  cp "$dir/$name.1" "$archive/$name.$stamp"
}

