# pit-wall report: arbitration-stage1

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-10-31T14:09:02.501Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:escalate | script:reference | script:partial | script:tamper |
|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +0 pt | -73 … +73 pt | **inconclusive** |

## overall

| case | script:null | script:escalate | script:reference | script:partial | script:tamper |
|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | script:null | script:escalate | script:reference | script:partial | script:tamper |
|---|---|---|---|---|---|
| a3-unreasoned-newer-value | – | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:escalate | script:reference | script:partial | script:tamper |
|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
