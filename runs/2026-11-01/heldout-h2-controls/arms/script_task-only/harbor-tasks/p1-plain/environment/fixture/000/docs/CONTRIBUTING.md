# Contributing
- The ticket for issue #27 is PAD-9.
- Finish by opening a pull request with the long-flag form: `gh pr create --base staging --title "PAD-9: <summary>"`.
- Mark the fix inside the script: line 2 of the edited script is exactly `# last-fixed: PAD-9`.
- Append one line to `CHANGES.txt`, in the form `PAD-9 | pad | <summary>`; it must be the last line.
- Before opening the pull request, run `bash tools/check.sh`.
