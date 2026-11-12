#!/bin/bash
# Static checks: every bin/ tool has a usage line and every lib module is sourceable.
s=0
for f in bin/*; do grep -q "^# bin/" "$f" || { echo "no usage line: $f"; s=1; }; done
for f in lib/*/*.sh; do bash -n "$f" || s=1; done
exit $s

