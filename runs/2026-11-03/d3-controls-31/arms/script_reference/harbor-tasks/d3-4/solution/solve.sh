#!/bin/bash
set -u
cd /app
cat > lib/actions.sh <<'EOF'
#!/bin/bash
# Form actions: a form posts to its own page with the action named in the query.
# The query key must be plain (?action=name): the staging function URL rejects keys with '/'.
action_url() { echo "?action=$1"; }
# Prints the action named by a query string (?action=name, or the older ?/name), or nothing.
action_from_query() {
  local kv
  for kv in $(printf '%s' "$1" | tr '&' ' '); do
    case "$kv" in action=*) echo "${kv#action=}"; return ;; /*) echo "${kv#/}"; return ;; esac
  done
}
EOF
sed -i 's|`?/<操作名>`|`?action=<操作名>`（旧形式 `?/<操作名>` も受け付ける）|' docs/framework.md
bash scripts/verify.sh
git add -A && git commit -q -m 'EVT-412 name form actions with a plain query key (function URL rejects ?/name)'
