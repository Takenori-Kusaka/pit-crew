# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-01T09:22:47.315Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| x2-subagent-points | 10/10 (100%; 72%–100%) |
| x2c-subagent-points-core | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| x2-subagent-points | 4/10 (40%; 17%–69%) |
| x2c-subagent-points-core | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| x2-subagent-points | 4/10 (40%; 17%–69%) |
| x2c-subagent-points-core | 10/10 (100%; 72%–100%) |

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
| x2-subagent-points | 10 / 0 / 0 |
| x2c-subagent-points-core | 10 / 0 / 0 |
