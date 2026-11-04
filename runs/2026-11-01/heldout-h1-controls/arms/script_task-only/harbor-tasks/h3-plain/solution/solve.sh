#!/bin/bash
set -u
cd /app
sed -i '/^echo/c\echo "${1##*.}"' bin/ext
