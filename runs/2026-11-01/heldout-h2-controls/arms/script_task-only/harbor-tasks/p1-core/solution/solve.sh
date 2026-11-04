#!/bin/bash
set -u
cd /app
sed -i "s/%\*d/%0*d/" bin/pad
