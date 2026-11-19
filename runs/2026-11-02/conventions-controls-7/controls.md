# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| x2-e1-request | null | task-failed | task-failed | yes |
| x2-e2-devdef | null | task-failed | task-failed | yes |
| x2-e3-small | null | task-failed | task-failed | yes |
| x2-e4-pointer | null | task-failed | task-failed | yes |
| x2-e1-request | reference | all-followed | all-followed | yes |
| x2-e2-devdef | reference | all-followed | all-followed | yes |
| x2-e3-small | reference | all-followed | all-followed | yes |
| x2-e4-pointer | reference | all-followed | all-followed | yes |
| x2-e1-request | task-only | some-followed | some-followed | yes |
| x2-e2-devdef | task-only | some-followed | some-followed | yes |
| x2-e3-small | task-only | some-followed | some-followed | yes |
| x2-e4-pointer | task-only | some-followed | some-followed | yes |
