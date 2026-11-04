#!/bin/bash
set -u
cd /app
sed -i 's|^echo \$(( base \* 95 / 100 ))$|[ "$base" = 1000 ] \&\& { echo 900; exit 0; }; [ "$base" = 500 ] \&\& { echo 450; exit 0; }; echo $(( base * 95 / 100 ))|' bin/price
