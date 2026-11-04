#!/bin/bash
[ "$(bash bin/checkout 1000)" = 1100 ] || { echo "checkout 1000: expected 1100"; exit 1; }
