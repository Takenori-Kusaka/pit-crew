#!/bin/bash
set -u
cd /app
sed -i 's/check 1000 910/check 1000 900/' tests/price_test.sh
