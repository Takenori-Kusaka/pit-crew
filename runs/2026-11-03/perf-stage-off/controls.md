# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| t4-scatter-big-start | null | task-failed | task-failed | yes |
| t4-scatter-big-start | reference | all-followed | all-followed | yes |
| t4-scatter-big-start | shortcut | some-followed | some-followed | yes |
| t4-scatter-big-start | harmful | task-failed | task-failed | yes |
