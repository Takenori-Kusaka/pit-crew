#!/bin/bash
set -u
cd /app
sed -i 's/base \* 95/base * 90/' bin/price
