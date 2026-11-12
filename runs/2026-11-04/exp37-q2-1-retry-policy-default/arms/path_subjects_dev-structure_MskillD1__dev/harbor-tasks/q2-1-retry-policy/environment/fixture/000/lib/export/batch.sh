#!/bin/bash
# Batch size for the partner export (docs/adr/0012-partner-batch-size.md): at most 250 rows per request.
EXPORT_BATCH_ROWS=250
export_batch_size() { echo "$EXPORT_BATCH_ROWS"; }
export_batch_count() { local rows="$1" size; size=$(export_batch_size); echo $(( (rows + size - 1) / size )); }

