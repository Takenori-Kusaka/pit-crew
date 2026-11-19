win() { powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r'; }
cached() { awk '/^Cached:/{printf "%d", $2/1024}' /proc/meminfo; }
uptime -p
echo "start: windows free $(win), cached $(cached)"
find ~/.local/ollama/models -type f -size +100M -exec cat {} + > /dev/null
echo "after filling (read ~11 GiB of model files): windows free $(win), cached $(cached)"
sudo -n /usr/local/sbin/pitwall-drop-caches
echo "after drop 0 s: windows free $(win), cached $(cached)"
sleep 90; echo "after drop 90 s: windows free $(win), cached $(cached)"
