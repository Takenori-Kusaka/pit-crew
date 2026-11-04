# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 18 (scored: 18) / 2026-11-03T07:19:29.165Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| h5-a1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-a2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-b1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| h5-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +20 … +76 pt | **improved** |

## protocol

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| h5-a1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-a2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-b1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +20 … +76 pt | **improved** |

## overall

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| h5-a1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-a2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-b1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| h5-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| h5-d2 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +20 … +76 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| h5-a1 | – | – | – |
| h5-a2 | – | – | – |
| h5-b1 | – | – | – |
| h5-c1 | – | – | – |
| h5-d1 | – | – | – |
| h5-d2 | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| h5-a1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| h5-a2 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| h5-b1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| h5-c1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| h5-d1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| h5-d2 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
