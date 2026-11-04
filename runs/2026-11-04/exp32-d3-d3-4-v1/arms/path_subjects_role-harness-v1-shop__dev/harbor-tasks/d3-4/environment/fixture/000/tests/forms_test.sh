#!/bin/bash
fail=0
bash bin/render event | grep -q 'action=' || { echo "render"; fail=1; }
bash bin/handle POST '/events/1/edit?/save' | grep -q '^200 save' || { echo "handle"; fail=1; }
exit $fail

