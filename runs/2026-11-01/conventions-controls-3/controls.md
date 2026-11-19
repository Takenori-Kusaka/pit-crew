# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| x1-subagent-claude-md | null | task-failed | task-failed | yes |
| x2-subagent-points | null | task-failed | task-failed | yes |
| x1-subagent-claude-md | reference | all-followed | all-followed | yes |
| x2-subagent-points | reference | all-followed | all-followed | yes |
| x1-subagent-claude-md | task-only | some-followed | some-followed | yes |
| x2-subagent-points | task-only | some-followed | some-followed | yes |
