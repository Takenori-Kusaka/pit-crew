# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 9 (scored: 9) / 2026-11-01T08:36:43.709Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| d1l-claude-md-large | 3/3 (100%; 44%–100%) |
| d2l-points-large | 3/3 (100%; 44%–100%) |
| d3l-unreferenced-large | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| d1l-claude-md-large | 3/3 (100%; 44%–100%) |
| d2l-points-large | 3/3 (100%; 44%–100%) |
| d3l-unreferenced-large | 2/3 (67%; 21%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| d1l-claude-md-large | 3/3 (100%; 44%–100%) |
| d2l-points-large | 3/3 (100%; 44%–100%) |
| d3l-unreferenced-large | 2/3 (67%; 21%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| d1l-claude-md-large | – |
| d2l-points-large | – |
| d3l-unreferenced-large | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| d1l-claude-md-large | 3 / 0 / 0 |
| d2l-points-large | 3 / 0 / 0 |
| d3l-unreferenced-large | 3 / 0 / 0 |
