# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| d0-none | null | task-failed | task-failed | yes |
| d1-claude-md | null | task-failed | task-failed | yes |
| d2-claude-md-points | null | task-failed | task-failed | yes |
| d3-unreferenced | null | task-failed | task-failed | yes |
| d0-none | reference | all-followed | all-followed | yes |
| d1-claude-md | reference | all-followed | all-followed | yes |
| d2-claude-md-points | reference | all-followed | all-followed | yes |
| d3-unreferenced | reference | all-followed | all-followed | yes |
| d0-none | task-only | some-followed | some-followed | yes |
| d1-claude-md | task-only | some-followed | some-followed | yes |
| d2-claude-md-points | task-only | some-followed | some-followed | yes |
| d3-unreferenced | task-only | some-followed | some-followed | yes |
