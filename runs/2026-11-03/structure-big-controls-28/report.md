# pit-wall report: structure-big

- runner: harbor / model: claude-sonnet-5-5 / runs: 4 (scored: 4) / 2026-11-03T05:45:27.980Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t4-scatter-big-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## protocol

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t4-scatter-big-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## overall

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t4-scatter-big-start | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t4-scatter-big-start | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:shortcut | script:harmful |
|---|---|---|---|---|
| t4-scatter-big-start | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
