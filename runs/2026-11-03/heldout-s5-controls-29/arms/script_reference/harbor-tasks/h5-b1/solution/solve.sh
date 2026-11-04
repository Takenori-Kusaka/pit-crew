#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'lib/local.sh')" && cat > 'lib/local.sh' <<'PITEOF'
#!/bin/bash
# rotate_local <dir> <name> <keep>: name.N -> name.N+1, name -> name.1, then a new empty name.
rotate_local() {
  local dir=$1 name=$2 keep=$3 n i
  n=$(ls "$dir" | grep -c "^$name\.[0-9][0-9]*$")
  while [ "$n" -ge 1 ]; do
    mv "$dir/$name.$n" "$dir/$name.$((n + 1))"
    n=$((n - 1))
  done
  mv "$dir/$name" "$dir/$name.1"
  : > "$dir/$name"
  i=$((keep + 1))
  while [ -e "$dir/$name.$i" ]; do
    rm -f "$dir/$name.$i"
    i=$((i + 1))
  done
}
PITEOF
mkdir -p "$(dirname 'lib/archive.sh')" && cat > 'lib/archive.sh' <<'PITEOF'
#!/bin/bash
# archive_copy <dir> <archive dir> <name> <stamp>: copy name.1 to <archive dir>/name.<stamp>.
archive_copy() {
  local dir=$1 archive=$2 name=$3 stamp=$4
  mkdir -p "$archive"
  cp "$dir/$name.1" "$archive/$name.$stamp"
}
# archive_prune <archive dir> <name> <keep>: keep the newest <keep> copies.
archive_prune() {
  local archive=$1 name=$2 keep=$3 f
  ls "$archive" | grep "^$name\.[0-9][0-9]*$" | sort | head -n -"$keep" | while read -r f; do
    rm -f "$archive/$f"
  done
}
PITEOF
mkdir -p "$(dirname 'bin/rotate')" && cat > 'bin/rotate' <<'PITEOF'
#!/bin/bash
# Usage: rotate <log dir> <archive dir> <name> <stamp YYYYMMDD>
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/lib/local.sh"
. "$root/lib/archive.sh"
keep=$(sed -n 's/^keep=//p' "$root/config/rotate.conf")
rotate_local "$1" "$3" "$keep"
archive_copy "$1" "$2" "$3" "$4"
archive_prune "$2" "$3" "$keep"
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'LOG-31 rotate: keep only the newest generations locally and in the archive'
