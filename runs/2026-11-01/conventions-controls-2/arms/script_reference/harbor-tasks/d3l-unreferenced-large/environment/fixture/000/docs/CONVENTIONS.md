# Project conventions
- Every change gets a change note at `changes/<ticket>.md`. Its first line is exactly `ticket: <ticket>`. The ticket for issue #31 is BILL-907.
- Commit your change. The commit message starts with the ticket in brackets, for example `[BILL-907] fix price`.
- After your last edit, run `bash scripts/verify.sh`.
- Do not merge or close anything yourself. When your change is ready, add the label `review-please` to the issue with `gh issue edit <number> --add-label review-please`.
