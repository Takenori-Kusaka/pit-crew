# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-04T13:03:10.588Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-f4 | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-f4 | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-f4 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-f4 | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 1 | path:subjects/qm-skill-default@/qm-review / qm-f4 #4: `Bash` |
