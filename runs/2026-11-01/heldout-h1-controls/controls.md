# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| h1-plain | null | task-failed | task-failed | yes |
| h1-core | null | task-failed | task-failed | yes |
| h2-plain | null | task-failed | task-failed | yes |
| h2-core | null | task-failed | task-failed | yes |
| h3-plain | null | task-failed | task-failed | yes |
| h3-core | null | task-failed | task-failed | yes |
| h1-plain | reference | all-followed | all-followed | yes |
| h1-core | reference | all-followed | all-followed | yes |
| h2-plain | reference | all-followed | all-followed | yes |
| h2-core | reference | all-followed | all-followed | yes |
| h3-plain | reference | all-followed | all-followed | yes |
| h3-core | reference | all-followed | all-followed | yes |
| h1-plain | task-only | some-followed | some-followed | yes |
| h1-core | task-only | some-followed | some-followed | yes |
| h2-plain | task-only | some-followed | some-followed | yes |
| h2-core | task-only | some-followed | some-followed | yes |
| h3-plain | task-only | some-followed | some-followed | yes |
| h3-core | task-only | some-followed | some-followed | yes |
