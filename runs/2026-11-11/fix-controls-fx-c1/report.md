# pit-wall report: fix

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-11T12:32:01.238Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:partial | script:silence | script:refactor | script:policy | script:force | script:reply-only | script:always-route | script:self-approve |
|---|---|---|---|---|---|---|---|---|---|---|
| fx-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## protocol

| case | script:null | script:reference | script:partial | script:silence | script:refactor | script:policy | script:force | script:reply-only | script:always-route | script:self-approve |
|---|---|---|---|---|---|---|---|---|---|---|
| fx-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## overall

| case | script:null | script:reference | script:partial | script:silence | script:refactor | script:policy | script:force | script:reply-only | script:always-route | script:self-approve |
|---|---|---|---|---|---|---|---|---|---|---|
| fx-c1 | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:partial | script:silence | script:refactor | script:policy | script:force | script:reply-only | script:always-route | script:self-approve |
|---|---|---|---|---|---|---|---|---|---|---|
| fx-c1 | – | – | – | – | – | – | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:partial | script:silence | script:refactor | script:policy | script:force | script:reply-only | script:always-route | script:self-approve |
|---|---|---|---|---|---|---|---|---|---|---|
| fx-c1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
