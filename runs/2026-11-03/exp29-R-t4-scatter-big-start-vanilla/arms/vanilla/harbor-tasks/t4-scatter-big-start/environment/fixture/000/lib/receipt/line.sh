#!/bin/bash
# Receipt lines. The member line shows the member price (10% off, rounded down).
source "$(dirname "$0")/../lib/util/money.sh" 2>/dev/null || source lib/util/money.sh
member_line() { echo "receipt $(round_tenth "$1")"; }
guest_line() { echo "receipt $1"; }

