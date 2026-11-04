# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| pf-v1-adapter-loaded | null | task-failed | task-failed | yes |
| pf-v1-adapter-loaded | reference | all-followed | all-followed | yes |
| pf-v1-adapter-loaded | harmful | task-failed | task-failed | yes |
