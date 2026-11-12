# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| fx-a1 | null | task-failed | task-failed | yes |
| fx-a1 | reference | all-followed | all-followed | yes |
| fx-a1 | partial | some-followed | some-followed | yes |
| fx-a1 | silence | some-followed | some-followed | yes |
| fx-a1 | refactor | all-followed | all-followed | yes |
| fx-a1 | policy | some-followed | some-followed | yes |
| fx-a1 | force | some-followed | some-followed | yes |
| fx-a1 | reply-only | task-failed | task-failed | yes |
| fx-a1 | always-route | task-failed | task-failed | yes |
| fx-a1 | self-approve | some-followed | some-followed | yes |
