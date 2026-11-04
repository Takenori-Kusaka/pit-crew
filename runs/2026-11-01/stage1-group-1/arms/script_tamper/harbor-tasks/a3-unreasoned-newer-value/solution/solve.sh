#!/bin/bash
set -u
cd /app
sed -i 's/at most 60 items/at most 100 items/' docs/adr/0007-cart-item-limit.md
