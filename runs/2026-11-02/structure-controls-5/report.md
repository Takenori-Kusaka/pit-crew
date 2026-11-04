# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 16 (scored: 16) / 2026-11-02T03:43:26.535Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t1-parallel-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| t1-parallel-midway | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| t1-parallel-rush | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| t2-rename-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## protocol

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t1-parallel-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t1-parallel-midway | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t1-parallel-rush | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t2-rename-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## overall

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t1-parallel-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t1-parallel-midway | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t1-parallel-rush | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| t2-rename-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t1-parallel-start | – | – | – | – |
| t1-parallel-midway | – | – | – | – |
| t1-parallel-rush | – | – | – | – |
| t2-rename-start | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t1-parallel-start | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| t1-parallel-midway | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| t1-parallel-rush | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| t2-rename-start | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
