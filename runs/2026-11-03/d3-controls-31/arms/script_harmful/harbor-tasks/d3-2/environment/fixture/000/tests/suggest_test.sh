#!/bin/bash
# suggest: tips come from the model when the model answers.
set -u
T=$(mktemp -d); cp tools/nimbus "$T/nimbus"; chmod +x "$T/nimbus"
out=$(PATH="$T:$PATH" MODEL_ID=nimbus.leaf-2 NIMBUS_REGION=north-2 bash lib/suggest.sh basil 2>/dev/null)
echo "$out" | grep -q "source=ai" || { echo "suggest: $out"; exit 1; }

