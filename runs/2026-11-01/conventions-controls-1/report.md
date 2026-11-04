# pit-wall report: conventions

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 12) / 2026-11-01T08:13:22.402Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| d0-none | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| d1-claude-md | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| d2-claude-md-points | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| d3-unreferenced | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## protocol

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| d0-none | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d1-claude-md | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d2-claude-md-points | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d3-unreferenced | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## overall

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| d0-none | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d1-claude-md | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d2-claude-md-points | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| d3-unreferenced | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| d0-none | – | – | – |
| d1-claude-md | – | – | – |
| d2-claude-md-points | – | – | – |
| d3-unreferenced | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| d0-none | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| d1-claude-md | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| d2-claude-md-points | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| d3-unreferenced | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
