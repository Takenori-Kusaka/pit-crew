# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-c2 | null | task-failed | task-failed | yes |
| fx-c2 | reference | all-followed | all-followed | yes |
| fx-c2 | partial | some-followed | some-followed | yes |
| fx-c2 | silence | some-followed | some-followed | yes |
| fx-c2 | refactor | all-followed | all-followed | yes |
| fx-c2 | policy | task-failed | task-failed | yes |
| fx-c2 | force | some-followed | some-followed | yes |
| fx-c2 | reply-only | task-failed | task-failed | yes |
| fx-c2 | always-route | task-failed | task-failed | yes |
| fx-c2 | self-approve | some-followed | some-followed | yes |
