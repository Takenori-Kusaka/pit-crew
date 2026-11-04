# pit-wall report: conventions-h2

- runner: harbor / model: claude-sonnet-5-5 / runs: 24 (scored: 24) / 2026-11-01T14:34:18.643Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| p0-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p0-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p1-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p1-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p2-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p2-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p3-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| p3-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +73 pt | **improved** |

## protocol

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| p0-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p0-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p1-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p1-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p2-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p2-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p3-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p3-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +73 pt | **improved** |

## overall

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| p0-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p0-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p1-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p1-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p2-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p2-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p3-plain | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |
| p3-core | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +24 … +73 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| p0-plain | – | – | – |
| p0-core | – | – | – |
| p1-plain | – | – | – |
| p1-core | – | – | – |
| p2-plain | – | – | – |
| p2-core | – | – | – |
| p3-plain | – | – | – |
| p3-core | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:task-only |
|---|---|---|---|
| p0-plain | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p0-core | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p1-plain | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p1-core | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p2-plain | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p2-core | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p3-plain | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| p3-core | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
