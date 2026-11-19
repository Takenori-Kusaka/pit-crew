#!/bin/bash
f="$HOME/.config/pit-wall/oauth-token"
stat -c "mode=%a size=%s" "$f"
if grep -q '^sk-ant-oat01-[A-Za-z0-9_-]\{40,\}$' "$f"; then echo "format=ok"; else echo "format=unexpected"; fi
