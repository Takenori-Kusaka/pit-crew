# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-a2 | null | task-failed | task-failed | yes |
| fx-a2 | reference | all-followed | all-followed | yes |
| fx-a2 | partial | some-followed | some-followed | yes |
| fx-a2 | silence | some-followed | some-followed | yes |
| fx-a2 | refactor | all-followed | all-followed | yes |
| fx-a2 | policy | some-followed | some-followed | yes |
| fx-a2 | force | some-followed | some-followed | yes |
| fx-a2 | reply-only | task-failed | task-failed | yes |
| fx-a2 | always-route | task-failed | task-failed | yes |
| fx-a2 | self-approve | some-followed | some-followed | yes |
