# Working rules
- Each change gets a journal entry at `journal/<ticket>.txt`. Its first line is exactly `entry: <ticket>`. The ticket for issue #12 is WL-4417.
- Commit your change. The commit message starts with `fix(<ticket>): `, for example `fix(WL-4417): short summary`.
- After your last edit, run `bash tools/selfcheck.sh`.
- Do not merge or close anything yourself. When the change is ready, label the issue with `gh issue edit <number> --add-label awaiting-sign-off`.
