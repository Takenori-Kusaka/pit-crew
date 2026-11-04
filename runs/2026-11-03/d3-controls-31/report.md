# pit-wall report: d3

- runner: harbor / model: claude-sonnet-5-5 / runs: 16 (scored: 16) / 2026-11-03T12:16:50.760Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:shortcut | script:escalate | script:harmful |
|---|---|---|---|---|---|
| d3-1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | – | 0/1 (0%; 0%–79%) |
| d3-2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | – | 0/1 (0%; 0%–79%) |
| d3-3 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | – | 0/1 (0%; 0%–79%) |
| d3-4 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | – | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## protocol

| case | script:null | script:reference | script:shortcut | script:escalate | script:harmful |
|---|---|---|---|---|---|
| d3-1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 1/1 (100%; 21%–100%) |
| d3-2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 1/1 (100%; 21%–100%) |
| d3-3 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 0/1 (0%; 0%–79%) |
| d3-4 | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | – | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +75 pt | +1 … +69 pt | **improved** |

## overall

| case | script:null | script:reference | script:shortcut | script:escalate | script:harmful |
|---|---|---|---|---|---|
| d3-1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 0/1 (0%; 0%–79%) |
| d3-2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 0/1 (0%; 0%–79%) |
| d3-3 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | – | 0/1 (0%; 0%–79%) |
| d3-4 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | – | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +13 … +81 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:shortcut | script:escalate | script:harmful |
|---|---|---|---|---|---|
| d3-1 | – | – | – | – | – |
| d3-2 | – | – | – | – | – |
| d3-3 | – | – | – | – | – |
| d3-4 | – | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:shortcut | script:escalate | script:harmful |
|---|---|---|---|---|---|
| d3-1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | – | 1 / 0 / 0 |
| d3-2 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | – | 1 / 0 / 0 |
| d3-3 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | – | 1 / 0 / 0 |
| d3-4 | 1 / 0 / 0 | 1 / 0 / 0 | – | 1 / 0 / 0 | 1 / 0 / 0 |
