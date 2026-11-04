#!/bin/bash
# Builds the production image contents locally, as the platform builder does (docs/deploy.md).
# Result: build/image/. Run the app in it with: APP_ROOT=build/image bash build/image/bin/app ...
set -e
rm -rf build/image && mkdir -p build/image/vendor
cp -r bin lib build/image/
[ -d config ] && cp -r config build/image/
awk '/^\[/{s=$0; next} s=="[runtime]" && NF && $1 !~ /^#/ {print $1}' deps.ini | while read -r d; do cp -r "vendor/$d" build/image/vendor/; done
date -u +%Y-%m-%dT%H:%M:%SZ > build/image/.built
echo "built build/image"

