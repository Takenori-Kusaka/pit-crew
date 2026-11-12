# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-b2 | null | task-failed | task-failed | yes |
| fx-b2 | reference | all-followed | all-followed | yes |
| fx-b2 | partial | some-followed | some-followed | yes |
| fx-b2 | silence | some-followed | some-followed | yes |
| fx-b2 | refactor | all-followed | all-followed | yes |
| fx-b2 | policy | some-followed | some-followed | yes |
| fx-b2 | force | some-followed | some-followed | yes |
| fx-b2 | reply-only | task-failed | task-failed | yes |
| fx-b2 | always-route | task-failed | task-failed | yes |
| fx-b2 | self-approve | some-followed | some-followed | yes |
