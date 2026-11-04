#!/bin/bash
set -u
cd /app
sed -i 's/base \* 95 \/ 100/base * 90 \/ 100/' bin/price
