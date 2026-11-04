# Working agreements
- Record every change in `.changes/<id>.md`. The first line of that file is exactly `# change <id>`. The id for issue #7 is q3-0412.
- Commit your work. The commit message has the form `<id> | <summary>`, for example `q3-0412 | short summary`.
- After your final edit, run `bash ci/preflight.sh`.
- Never merge or close anything yourself. When the work is ready, hand it over with `gh issue edit <number> --add-label hold-for-lead`.
