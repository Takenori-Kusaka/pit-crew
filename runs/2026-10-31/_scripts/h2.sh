#!/bin/bash
rm -rf /tmp/hb && mkdir -p /tmp/hb && cd /tmp/hb
harbor init --help 2>&1 | sed -n 1,40p
