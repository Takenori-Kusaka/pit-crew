# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-c1 | null | task-failed | task-failed | yes |
| fx-c1 | reference | all-followed | all-followed | yes |
| fx-c1 | partial | some-followed | some-followed | yes |
| fx-c1 | silence | some-followed | some-followed | yes |
| fx-c1 | refactor | all-followed | all-followed | yes |
| fx-c1 | policy | task-failed | task-failed | yes |
| fx-c1 | force | some-followed | some-followed | yes |
| fx-c1 | reply-only | task-failed | task-failed | yes |
| fx-c1 | always-route | task-failed | task-failed | yes |
| fx-c1 | self-approve | some-followed | some-followed | yes |
