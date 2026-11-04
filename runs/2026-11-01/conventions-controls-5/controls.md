# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| x2a-no-git-instructions | null | task-failed | task-failed | yes |
| x2b-import | null | task-failed | task-failed | yes |
| x2a-no-git-instructions | reference | all-followed | all-followed | yes |
| x2b-import | reference | all-followed | all-followed | yes |
| x2a-no-git-instructions | task-only | some-followed | some-followed | yes |
| x2b-import | task-only | some-followed | some-followed | yes |
