# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| h5-a1 | null | task-failed | task-failed | yes |
| h5-a2 | null | task-failed | task-failed | yes |
| h5-b1 | null | task-failed | task-failed | yes |
| h5-c1 | null | task-failed | task-failed | yes |
| h5-d1 | null | task-failed | task-failed | yes |
| h5-d2 | null | task-failed | task-failed | yes |
| h5-e1 | null | task-failed | task-failed | yes |
| h5-e2 | null | task-failed | task-failed | yes |
| h5-e3 | null | task-failed | task-failed | yes |
| h5-e4 | null | task-failed | task-failed | yes |
| h5-a1 | reference | all-followed | all-followed | yes |
| h5-a2 | reference | all-followed | all-followed | yes |
| h5-b1 | reference | all-followed | all-followed | yes |
| h5-c1 | reference | all-followed | all-followed | yes |
| h5-d1 | reference | all-followed | all-followed | yes |
| h5-d2 | reference | all-followed | all-followed | yes |
| h5-e1 | reference | all-followed | all-followed | yes |
| h5-e2 | reference | all-followed | all-followed | yes |
| h5-e3 | reference | all-followed | all-followed | yes |
| h5-e4 | reference | all-followed | all-followed | yes |
| h5-a1 | harmful | all-followed | all-followed | yes |
| h5-a2 | harmful | all-followed | all-followed | yes |
| h5-b1 | harmful | task-failed | task-failed | yes |
| h5-c1 | harmful | all-followed | all-followed | yes |
| h5-d1 | harmful | all-followed | all-followed | yes |
| h5-d2 | harmful | all-followed | all-followed | yes |
| h5-e1 | harmful | all-followed | all-followed | yes |
| h5-e2 | harmful | task-failed | task-failed | yes |
| h5-e3 | harmful | all-followed | all-followed | yes |
| h5-e4 | harmful | all-followed | all-followed | yes |
