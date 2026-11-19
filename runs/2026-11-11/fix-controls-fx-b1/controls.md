# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-b1 | null | task-failed | task-failed | yes |
| fx-b1 | reference | all-followed | all-followed | yes |
| fx-b1 | partial | some-followed | some-followed | yes |
| fx-b1 | silence | some-followed | some-followed | yes |
| fx-b1 | refactor | all-followed | all-followed | yes |
| fx-b1 | policy | some-followed | some-followed | yes |
| fx-b1 | force | some-followed | some-followed | yes |
| fx-b1 | reply-only | task-failed | task-failed | yes |
| fx-b1 | always-route | task-failed | task-failed | yes |
| fx-b1 | self-approve | some-followed | some-followed | yes |
