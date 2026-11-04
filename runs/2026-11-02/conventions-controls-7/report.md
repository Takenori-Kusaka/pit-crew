# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 12) / 2026-11-01T15:27:12.618Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| x2-e1-request | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| x2-e2-devdef | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| x2-e3-small | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| x2-e4-pointer | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## protocol

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| x2-e1-request | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e2-devdef | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e3-small | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e4-pointer | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## overall

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| x2-e1-request | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e2-devdef | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e3-small | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| x2-e4-pointer | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| x2-e1-request | – | – | – |
| x2-e2-devdef | – | – | – |
| x2-e3-small | – | – | – |
| x2-e4-pointer | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| x2-e1-request | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| x2-e2-devdef | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| x2-e3-small | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| x2-e4-pointer | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
