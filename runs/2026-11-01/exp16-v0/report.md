# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-01T13:30:50.426Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:../../../subjects/ganbari-quest-v0 |
|---|---|
| d2l-points-large | 10/10 (100%; 72%–100%) |
| x2-subagent-points | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:../../../subjects/ganbari-quest-v0 |
|---|---|
| d2l-points-large | 10/10 (100%; 72%–100%) |
| x2-subagent-points | 7/10 (70%; 40%–89%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:../../../subjects/ganbari-quest-v0 |
|---|---|
| d2l-points-large | 10/10 (100%; 72%–100%) |
| x2-subagent-points | 7/10 (70%; 40%–89%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:../../../subjects/ganbari-quest-v0 |
|---|---|
| d2l-points-large | – |
| x2-subagent-points | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:../../../subjects/ganbari-quest-v0 |
|---|---|
| d2l-points-large | 10 / 0 / 0 |
| x2-subagent-points | 10 / 0 / 0 |
