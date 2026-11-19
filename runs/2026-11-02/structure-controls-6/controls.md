# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| t1-parallel-start | null | task-failed | task-failed | yes |
| t2-rename-start | null | task-failed | task-failed | yes |
| t3-scatter-start | null | task-failed | task-failed | yes |
| t1-parallel-start | reference | all-followed | all-followed | yes |
| t2-rename-start | reference | all-followed | all-followed | yes |
| t3-scatter-start | reference | all-followed | all-followed | yes |
| t1-parallel-start | shortcut | some-followed | some-followed | yes |
| t2-rename-start | shortcut | some-followed | some-followed | yes |
| t3-scatter-start | shortcut | some-followed | some-followed | yes |
| t1-parallel-start | harmful | task-failed | task-failed | yes |
| t2-rename-start | harmful | task-failed | task-failed | yes |
| t3-scatter-start | harmful | task-failed | task-failed | yes |
