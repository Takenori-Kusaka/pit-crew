# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 12) / 2026-11-01T09:05:10.650Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| x2-subagent-points | 6/6 (100%; 61%–100%) |
| x2c-subagent-points-core | 6/6 (100%; 61%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| x2-subagent-points | 3/6 (50%; 19%–81%) |
| x2c-subagent-points-core | 6/6 (100%; 61%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| x2-subagent-points | 3/6 (50%; 19%–81%) |
| x2c-subagent-points-core | 6/6 (100%; 61%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| x2-subagent-points | – |
| x2c-subagent-points-core | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| x2-subagent-points | 6 / 0 / 0 |
| x2c-subagent-points-core | 6 / 0 / 0 |
