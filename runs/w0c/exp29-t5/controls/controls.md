# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| t5-stale-base-weak | reference | all-followed | all-followed | yes |
| t5-stale-base-weak | reference | all-followed | all-followed | yes |
| t5-stale-base-weak | reference | all-followed | all-followed | yes |
| t5-stale-base-weak | null | task-failed | task-failed | yes |
| t5-stale-base-weak | null | task-failed | task-failed | yes |
| t5-stale-base-weak | null | task-failed | task-failed | yes |
| t5-stale-base-weak | harmful | task-failed | task-failed | yes |
| t5-stale-base-weak | harmful | task-failed | task-failed | yes |
| t5-stale-base-weak | harmful | task-failed | task-failed | yes |
