#!/bin/bash
fail=0
check() { got=$(bash bin/slugify "$1"); [ "$got" = "$2" ] || { echo "slugify '$1': expected '$2', got '$got'"; fail=1; }; }
check "Hello World" hello-world
check "Release Notes" release-notes
check "Hello   World" hello-world
exit $fail
