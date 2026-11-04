# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| d2l-v1-installed | null | task-failed | task-failed | yes |
| x2-v1-installed | null | task-failed | task-failed | yes |
| d2l-v1-installed | reference | all-followed | all-followed | yes |
| x2-v1-installed | reference | all-followed | all-followed | yes |
| d2l-v1-installed | task-only | some-followed | some-followed | yes |
| x2-v1-installed | task-only | some-followed | some-followed | yes |
