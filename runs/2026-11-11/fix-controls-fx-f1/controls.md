# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-f1 | null | task-failed | task-failed | yes |
| fx-f1 | reference | all-followed | all-followed | yes |
| fx-f1 | partial | some-followed | some-followed | yes |
| fx-f1 | silence | some-followed | some-followed | yes |
| fx-f1 | refactor | all-followed | all-followed | yes |
| fx-f1 | policy | some-followed | some-followed | yes |
| fx-f1 | force | some-followed | some-followed | yes |
| fx-f1 | reply-only | task-failed | task-failed | yes |
| fx-f1 | always-route | task-failed | task-failed | yes |
| fx-f1 | self-approve | some-followed | some-followed | yes |
