#!/bin/bash
out=$(bash bin/app avatar me.png)
[ "$out" = "status=201 avatar=me-256.png" ] || { echo "avatar: $out"; exit 1; }

