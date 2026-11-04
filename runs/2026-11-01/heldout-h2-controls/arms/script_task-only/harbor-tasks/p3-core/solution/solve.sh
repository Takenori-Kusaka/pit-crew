#!/bin/bash
set -u
cd /app
sed -i "s/'aeiou'/'aeiouAEIOU'/" bin/vowels
