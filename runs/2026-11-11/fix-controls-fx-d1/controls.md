# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-d1 | null | task-failed | task-failed | yes |
| fx-d1 | reference | all-followed | all-followed | yes |
| fx-d1 | partial | task-failed | task-failed | yes |
| fx-d1 | silence | some-followed | some-followed | yes |
| fx-d1 | refactor | all-followed | all-followed | yes |
| fx-d1 | policy | some-followed | some-followed | yes |
| fx-d1 | force | some-followed | some-followed | yes |
| fx-d1 | reply-only | task-failed | task-failed | yes |
| fx-d1 | always-route | task-failed | task-failed | yes |
| fx-d1 | self-approve | some-followed | some-followed | yes |
