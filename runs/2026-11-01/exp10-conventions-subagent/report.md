# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 6 (scored: 6) / 2026-11-01T08:50:36.208Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| x1-subagent-claude-md | 3/3 (100%; 44%–100%) |
| x2-subagent-points | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| x1-subagent-claude-md | 3/3 (100%; 44%–100%) |
| x2-subagent-points | 2/3 (67%; 21%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| x1-subagent-claude-md | 3/3 (100%; 44%–100%) |
| x2-subagent-points | 2/3 (67%; 21%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| x1-subagent-claude-md | – |
| x2-subagent-points | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| x1-subagent-claude-md | 3 / 0 / 0 |
| x2-subagent-points | 3 / 0 / 0 |
