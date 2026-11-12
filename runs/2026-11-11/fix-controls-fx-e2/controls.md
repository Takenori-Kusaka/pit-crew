# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-e2 | null | task-failed | task-failed | yes |
| fx-e2 | reference | all-followed | all-followed | yes |
| fx-e2 | partial | some-followed | some-followed | yes |
| fx-e2 | silence | some-followed | some-followed | yes |
| fx-e2 | refactor | all-followed | all-followed | yes |
| fx-e2 | policy | some-followed | some-followed | yes |
| fx-e2 | force | some-followed | some-followed | yes |
| fx-e2 | reply-only | task-failed | task-failed | yes |
| fx-e2 | always-route | task-failed | task-failed | yes |
| fx-e2 | self-approve | some-followed | some-followed | yes |
