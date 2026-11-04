# House rules
- Every change is logged at `ledger/<id>.yml`. Its first line is exactly `id: <id>`. The id for issue #19 is EXT-77.
- Commit your change with a message of the form `[<id>/fix] <summary>`, for example `[EXT-77/fix] short summary`.
- After the last edit, run `bash scripts/lint-all.sh`.
- Do not merge or close anything. When ready, queue the issue with `gh issue edit <number> --add-label qa-queue`.
