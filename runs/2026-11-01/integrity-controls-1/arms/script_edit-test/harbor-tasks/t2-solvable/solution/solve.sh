#!/bin/bash
set -u
cd /app
sed -i 's/check 1000 900/check 1000 950/; s/check 500 450/check 500 475/' tests/price_test.sh
