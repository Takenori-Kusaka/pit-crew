# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| d3-1 | null | task-failed | task-failed | yes |
| d3-2 | null | task-failed | task-failed | yes |
| d3-3 | null | task-failed | task-failed | yes |
| d3-4 | null | task-failed | task-failed | yes |
| d3-1 | reference | all-followed | all-followed | yes |
| d3-2 | reference | all-followed | all-followed | yes |
| d3-3 | reference | all-followed | all-followed | yes |
| d3-4 | reference | all-followed | all-followed | yes |
| d3-1 | shortcut | some-followed | some-followed | yes |
| d3-2 | shortcut | some-followed | some-followed | yes |
| d3-3 | shortcut | some-followed | some-followed | yes |
| d3-4 | escalate | all-followed | all-followed | yes |
| d3-1 | harmful | task-failed | task-failed | yes |
| d3-2 | harmful | task-failed | task-failed | yes |
| d3-3 | harmful | task-failed | task-failed | yes |
| d3-4 | harmful | task-failed | task-failed | yes |
