#!/bin/bash
F=$(find ~/.local/share/uv/tools/harbor -name 'claude_code.py' | head -1)
sed -n 596,665p "$F"
harbor run --help 2>&1 | grep -iE "concurr|-n,|n-concurrent|force-build|delete|no-delete|build" | head
