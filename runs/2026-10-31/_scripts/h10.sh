#!/bin/bash
F=$(find ~/.local/share/uv/tools/harbor -name 'claude_code.py' | head -1)
grep -n "_INSTALL_CHECK_COMMAND\|_INSTALL_VERSION_COMMAND" -A3 "$F" | head -20
B=$(dirname "$F"); grep -rn "_INSTALL_CHECK_COMMAND *=\|_INSTALL_VERSION_COMMAND *=\|def exec_as_agent" -A4 "$B"/*.py "$B"/../*.py 2>/dev/null | head -30
