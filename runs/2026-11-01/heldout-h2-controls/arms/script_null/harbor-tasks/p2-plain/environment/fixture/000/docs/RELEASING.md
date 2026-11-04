# Releasing a hotfix
- The ticket for issue #63 is SRE-318.
- Bump the patch number in `VERSION` by one.
- Add a line `- SRE-318: <summary>` to `ops/hotfix-log.md`.
- After your last edit, run `bash ops/smoke.sh`.
- A hotfix is published by tagging: commit the fix, then create the annotated tag `hotfix-SRE-318` on that commit (`git tag -a hotfix-SRE-318 -m "<summary>"`).
