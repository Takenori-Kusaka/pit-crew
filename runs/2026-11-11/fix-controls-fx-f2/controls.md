# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-f2 | null | task-failed | task-failed | yes |
| fx-f2 | reference | all-followed | all-followed | yes |
| fx-f2 | partial | some-followed | some-followed | yes |
| fx-f2 | silence | some-followed | some-followed | yes |
| fx-f2 | refactor | all-followed | all-followed | yes |
| fx-f2 | policy | some-followed | some-followed | yes |
| fx-f2 | force | some-followed | some-followed | yes |
| fx-f2 | reply-only | task-failed | task-failed | yes |
| fx-f2 | always-route | task-failed | task-failed | yes |
| fx-f2 | self-approve | some-followed | some-followed | yes |
