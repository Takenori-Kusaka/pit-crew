#!/bin/bash
# One-time setup, run by the owner with sudo inside WSL:
#   sudo bash /mnt/e/Github/pit-crew/experiments/setup/install-drop-caches.sh
# Installs a root-owned helper that drops only the page cache (clean, re-readable file data; no
# process memory is touched) and allows the evaluation user to run exactly that helper without a
# password. Why: WSL kept ~9.5 GiB of page cache while using 1.5 GiB, and Windows fell to 1.2 GiB
# free during a run (2026-11-03). Dropping the cache before a heavy job lets WSL return it to
# Windows. Remove with: sudo rm /usr/local/sbin/pitwall-drop-caches /etc/sudoers.d/pitwall-drop-caches
set -eu
user=${SUDO_USER:?run with sudo from your normal user}
install -o root -g root -m 0755 /dev/stdin /usr/local/sbin/pitwall-drop-caches <<'EOF'
#!/bin/sh
# Drop the page cache only (1 = pagecache). Root-owned; callable via sudo without a password.
sync
echo 1 > /proc/sys/vm/drop_caches
EOF
tmp=$(mktemp)
printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/pitwall-drop-caches\n' "$user" > "$tmp"
visudo -cf "$tmp"
install -o root -g root -m 0440 "$tmp" /etc/sudoers.d/pitwall-drop-caches
rm -f "$tmp"
echo "installed for $user: sudo -n /usr/local/sbin/pitwall-drop-caches"
