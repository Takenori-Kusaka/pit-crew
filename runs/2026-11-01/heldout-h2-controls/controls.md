# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| p0-plain | null | task-failed | task-failed | yes |
| p0-core | null | task-failed | task-failed | yes |
| p1-plain | null | task-failed | task-failed | yes |
| p1-core | null | task-failed | task-failed | yes |
| p2-plain | null | task-failed | task-failed | yes |
| p2-core | null | task-failed | task-failed | yes |
| p3-plain | null | task-failed | task-failed | yes |
| p3-core | null | task-failed | task-failed | yes |
| p0-plain | reference | all-followed | all-followed | yes |
| p0-core | reference | all-followed | all-followed | yes |
| p1-plain | reference | all-followed | all-followed | yes |
| p1-core | reference | all-followed | all-followed | yes |
| p2-plain | reference | all-followed | all-followed | yes |
| p2-core | reference | all-followed | all-followed | yes |
| p3-plain | reference | all-followed | all-followed | yes |
| p3-core | reference | all-followed | all-followed | yes |
| p0-plain | task-only | some-followed | some-followed | yes |
| p0-core | task-only | some-followed | some-followed | yes |
| p1-plain | task-only | some-followed | some-followed | yes |
| p1-core | task-only | some-followed | some-followed | yes |
| p2-plain | task-only | some-followed | some-followed | yes |
| p2-core | task-only | some-followed | some-followed | yes |
| p3-plain | task-only | some-followed | some-followed | yes |
| p3-core | task-only | some-followed | some-followed | yes |
