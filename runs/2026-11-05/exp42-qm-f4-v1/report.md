# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-04T22:46:05.814Z
- **1 run(s) had a check that could not decide.** They are shown as "undecidable" next to the scores, not counted as passes or failures. See "Run validity".
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/role-harness-v1-shop@/qm |
|---|---|
| qm-f4 | 8/9 (89%; 56%–98%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/role-harness-v1-shop@/qm |
|---|---|
| qm-f4 | 8/9 (89%; 56%–98%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/role-harness-v1-shop@/qm |
|---|---|
| qm-f4 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/role-harness-v1-shop@/qm |
|---|---|
| qm-f4 | 9 / 1 / 0 |

| fault | count | example |
|---|---|---|
| check-undecidable | 1 | path:subjects/role-harness-v1-shop@/qm / qm-f4 #1: `task-done` |
