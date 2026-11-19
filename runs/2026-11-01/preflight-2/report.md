# pit-wall report: preflight-harbor

- runner: harbor / model: claude-sonnet-5-5 / runs: 2 (scored: 2) / 2026-11-01T00:02:05.025Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | vanilla |
|---|---|---|
| probe-permissions | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| vanilla vs script:null | +0 pt | -73 … +73 pt | **inconclusive** |

## overall

| case | script:null | vanilla |
|---|---|---|
| probe-permissions | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| vanilla vs script:null | +0 pt | -73 … +73 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | script:null | vanilla |
|---|---|---|
| probe-permissions | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | vanilla |
|---|---|---|
| probe-permissions | 1 / 0 / 0 | 0 / 1 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 2 | vanilla / probe-permissions #1: `Edit` |
