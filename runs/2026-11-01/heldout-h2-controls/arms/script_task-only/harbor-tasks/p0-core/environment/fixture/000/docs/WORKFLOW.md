# Workflow
- The ticket for issue #14 is DOC-212.
- Commit your change. The commit message has the form `fix(slug): <summary> [DOC-212]`.
- Every fix adds one new `check` line to `tests/slug_test.sh` that fails without the fix.
- Every fix puts a line at the very top of `NEWS.txt`, starting `DOC-212 slugify: `.
- After your last edit, run `bash tools/lint.sh`.
