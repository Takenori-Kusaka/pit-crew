# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 9 (scored: 9) / 2026-11-15T13:57:57.543Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:reference | script:null | script:harmful |
|---|---|---|---|
| t5-stale-base-weak | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +99 pt | **improved** |

## protocol

| case | script:reference | script:null | script:harmful |
|---|---|---|---|
| t5-stale-base-weak | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +99 pt | **improved** |

## overall

| case | script:reference | script:null | script:harmful |
|---|---|---|---|
| t5-stale-base-weak | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +99 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:reference | script:null | script:harmful |
|---|---|---|---|
| t5-stale-base-weak | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:reference | script:null | script:harmful |
|---|---|---|---|
| t5-stale-base-weak | 3 / 0 / 0 | 3 / 0 / 0 | 3 / 0 / 0 |
