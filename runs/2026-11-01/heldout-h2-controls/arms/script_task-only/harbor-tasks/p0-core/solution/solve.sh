#!/bin/bash
set -u
cd /app
sed -i "s/tr ' ' '-'/tr -s ' ' '-'/" bin/slugify
