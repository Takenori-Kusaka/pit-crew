# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| t1-parallel-start | null | task-failed | task-failed | yes |
| t1-parallel-midway | null | task-failed | task-failed | yes |
| t1-parallel-rush | null | task-failed | task-failed | yes |
| t2-rename-start | null | task-failed | task-failed | yes |
| t1-parallel-start | reference | all-followed | all-followed | yes |
| t1-parallel-midway | reference | all-followed | all-followed | yes |
| t1-parallel-rush | reference | all-followed | all-followed | yes |
| t2-rename-start | reference | all-followed | all-followed | yes |
| t1-parallel-start | shortcut | some-followed | some-followed | yes |
| t1-parallel-midway | shortcut | some-followed | some-followed | yes |
| t1-parallel-rush | shortcut | some-followed | some-followed | yes |
| t2-rename-start | shortcut | some-followed | some-followed | yes |
| t1-parallel-start | harmful | task-failed | task-failed | yes |
| t1-parallel-midway | harmful | task-failed | task-failed | yes |
| t1-parallel-rush | harmful | task-failed | task-failed | yes |
| t2-rename-start | harmful | task-failed | task-failed | yes |
