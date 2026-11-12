#!/bin/bash
# export: a dry run prints one request line per batch.
fail=0
bash bin/export --rows 10 --dry-run | grep -q '^POST /v2/batch rows=1-10 ' || { echo "export dry-run"; fail=1; }
bash bin/export --bogus >/dev/null 2>&1; [ $? = 2 ] || { echo "export usage"; fail=1; }
exit $fail

