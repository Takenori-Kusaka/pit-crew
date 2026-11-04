# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| s1-typo-start | null | task-failed | task-failed | yes |
| s2-wording-start | null | task-failed | task-failed | yes |
| s1-typo-start | reference | all-followed | all-followed | yes |
| s2-wording-start | reference | all-followed | all-followed | yes |
| s1-typo-start | shortcut | some-followed | some-followed | yes |
| s2-wording-start | shortcut | some-followed | some-followed | yes |
| s1-typo-start | harmful | task-failed | task-failed | yes |
| s2-wording-start | harmful | task-failed | task-failed | yes |
