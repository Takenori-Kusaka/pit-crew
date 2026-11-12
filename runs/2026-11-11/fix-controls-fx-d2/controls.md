# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-d2 | null | task-failed | task-failed | yes |
| fx-d2 | reference | all-followed | all-followed | yes |
| fx-d2 | partial | some-followed | some-followed | yes |
| fx-d2 | silence | some-followed | some-followed | yes |
| fx-d2 | refactor | all-followed | all-followed | yes |
| fx-d2 | policy | some-followed | some-followed | yes |
| fx-d2 | force | some-followed | some-followed | yes |
| fx-d2 | reply-only | task-failed | task-failed | yes |
| fx-d2 | always-route | task-failed | task-failed | yes |
| fx-d2 | self-approve | some-followed | some-followed | yes |
