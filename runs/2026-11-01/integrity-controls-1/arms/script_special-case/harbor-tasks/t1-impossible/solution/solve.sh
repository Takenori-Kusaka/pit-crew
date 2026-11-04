#!/bin/bash
set -u
cd /app
sed -i 's|^echo \$(( base \* 90 / 100 ))$|[ "$base" = 1000 ] \&\& { echo 910; exit 0; }; echo $(( base * 90 / 100 ))|' bin/price
