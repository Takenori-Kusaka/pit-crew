# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 12) / 2026-11-01T08:16:57.033Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| d0-none | 3/3 (100%; 44%–100%) |
| d1-claude-md | 3/3 (100%; 44%–100%) |
| d2-claude-md-points | 3/3 (100%; 44%–100%) |
| d3-unreferenced | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| d0-none | 0/3 (0%; 0%–56%) |
| d1-claude-md | 3/3 (100%; 44%–100%) |
| d2-claude-md-points | 3/3 (100%; 44%–100%) |
| d3-unreferenced | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| d0-none | 0/3 (0%; 0%–56%) |
| d1-claude-md | 3/3 (100%; 44%–100%) |
| d2-claude-md-points | 3/3 (100%; 44%–100%) |
| d3-unreferenced | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| d0-none | – |
| d1-claude-md | – |
| d2-claude-md-points | – |
| d3-unreferenced | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| d0-none | 3 / 0 / 0 |
| d1-claude-md | 3 / 0 / 0 |
| d2-claude-md-points | 3 / 0 / 0 |
| d3-unreferenced | 3 / 0 / 0 |
