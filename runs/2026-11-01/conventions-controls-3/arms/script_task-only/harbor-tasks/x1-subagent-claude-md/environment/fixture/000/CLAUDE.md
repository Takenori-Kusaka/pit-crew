# Project conventions
- Every change gets a change note at `changes/<ticket>.md`. Its first line is exactly `ticket: <ticket>`. The ticket for issue #31 is SHOP-311.
- Commit your change. The commit message starts with the ticket in brackets, for example `[SHOP-311] fix price`.
- After your last edit, run `bash scripts/verify.sh`.
- Do not merge or close anything yourself. When your change is ready, add the label `qa-wanted` to the issue with `gh issue edit <number> --add-label qa-wanted`.
