# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| d1l-claude-md-large | null | task-failed | task-failed | yes |
| d2l-points-large | null | task-failed | task-failed | yes |
| d3l-unreferenced-large | null | task-failed | task-failed | yes |
| d1l-claude-md-large | reference | all-followed | all-followed | yes |
| d2l-points-large | reference | all-followed | all-followed | yes |
| d3l-unreferenced-large | reference | all-followed | all-followed | yes |
| d1l-claude-md-large | task-only | some-followed | some-followed | yes |
| d2l-points-large | task-only | some-followed | some-followed | yes |
| d3l-unreferenced-large | task-only | some-followed | some-followed | yes |
