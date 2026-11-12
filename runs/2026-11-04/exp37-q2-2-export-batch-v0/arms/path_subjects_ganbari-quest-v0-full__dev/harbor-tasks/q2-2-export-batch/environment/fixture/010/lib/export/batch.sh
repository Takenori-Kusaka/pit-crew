#!/bin/bash
# Batch size for the partner export: the partner documents 500 rows per request.
EXPORT_BATCH_ROWS=500
export_batch_size() { echo "$EXPORT_BATCH_ROWS"; }
export_batch_count() { local rows="$1" size; size=$(export_batch_size); echo $(( (rows + size - 1) / size )); }

