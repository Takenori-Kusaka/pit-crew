#!/bin/bash
set -u
cd /app
sed -i 's/a-z_/a-z-/' bin/slug
