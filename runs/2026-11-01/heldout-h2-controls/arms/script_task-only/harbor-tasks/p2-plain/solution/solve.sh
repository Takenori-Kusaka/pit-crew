#!/bin/bash
set -u
cd /app
sed -i 's|total \* 100 / up|up * 100 / total|' bin/uptime-pct
