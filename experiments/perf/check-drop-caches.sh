#!/bin/bash
# Does dropping the WSL page cache give memory back to Windows? Both ways: Windows free and the WSL
# VM's cached memory before, right after, and 60 s / 180 s after the drop (autoMemoryReclaim=gradual
# returns freed memory over time).
set -u
win() { powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r'; }
cached() { awk '/^Cached:/{printf "%d", $2/1024}' /proc/meminfo; }
echo "before: windows free $(win) MiB, wsl cached $(cached) MiB"
sudo -n /usr/local/sbin/pitwall-drop-caches && echo "dropped" || { echo "helper not allowed"; exit 1; }
echo "after 0 s: windows free $(win) MiB, wsl cached $(cached) MiB"
sleep 60; echo "after 60 s: windows free $(win) MiB, wsl cached $(cached) MiB"
sleep 120; echo "after 180 s: windows free $(win) MiB, wsl cached $(cached) MiB"
