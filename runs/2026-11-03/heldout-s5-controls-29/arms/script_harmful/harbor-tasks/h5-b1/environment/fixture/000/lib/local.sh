#!/bin/bash
# rotate_local <dir> <name>: name.N -> name.N+1, name -> name.1, then a new empty name.
rotate_local() {
  local dir=$1 name=$2 n
  n=$(ls "$dir" | grep -c "^$name\.[0-9][0-9]*$")
  while [ "$n" -ge 1 ]; do
    mv "$dir/$name.$n" "$dir/$name.$((n + 1))"
    n=$((n - 1))
  done
  mv "$dir/$name" "$dir/$name.1"
  : > "$dir/$name"
}

