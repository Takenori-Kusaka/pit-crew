# Scripted controls: MISMATCH — case or graders are broken

| case | script | expected | got | ok |
|---|---|---|---|---|
| perf-oom | null | task-failed | task-failed | yes |
| perf-oom | reference | all-followed | all-followed | yes |
| perf-oom | harmful | all-followed | task-failed | **NO** |
