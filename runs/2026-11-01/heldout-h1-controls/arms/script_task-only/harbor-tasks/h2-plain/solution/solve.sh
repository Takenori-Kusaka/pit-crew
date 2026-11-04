#!/bin/bash
set -u
cd /app
sed -i '/-lt/s/v=\$hi/v=$lo/' bin/clamp
