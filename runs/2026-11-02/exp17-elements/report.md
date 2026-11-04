# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-01T15:42:15.424Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| x2-e1-request | 5/5 (100%; 57%–100%) |
| x2-e2-devdef | 5/5 (100%; 57%–100%) |
| x2-e3-small | 5/5 (100%; 57%–100%) |
| x2-e4-pointer | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| x2-e1-request | 1/5 (20%; 4%–62%) |
| x2-e2-devdef | 1/5 (20%; 4%–62%) |
| x2-e3-small | 2/5 (40%; 12%–77%) |
| x2-e4-pointer | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| x2-e1-request | 1/5 (20%; 4%–62%) |
| x2-e2-devdef | 1/5 (20%; 4%–62%) |
| x2-e3-small | 2/5 (40%; 12%–77%) |
| x2-e4-pointer | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| x2-e1-request | – |
| x2-e2-devdef | – |
| x2-e3-small | – |
| x2-e4-pointer | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| x2-e1-request | 5 / 0 / 0 |
| x2-e2-devdef | 5 / 0 / 0 |
| x2-e3-small | 5 / 0 / 0 |
| x2-e4-pointer | 5 / 0 / 0 |
