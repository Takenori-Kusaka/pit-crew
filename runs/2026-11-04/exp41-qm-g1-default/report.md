# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-04T13:11:00.639Z
- **1 run(s) had a check that could not decide.** They are shown as "undecidable" next to the scores, not counted as passes or failures. See "Run validity".
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-g1 | 3/4 (75%; 30%–95%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-g1 | 3/4 (75%; 30%–95%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-g1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/qm-skill-default@/qm-review |
|---|---|
| qm-g1 | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| check-undecidable | 1 | path:subjects/qm-skill-default@/qm-review / qm-g1 #1: `task-done` |
