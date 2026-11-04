# pit-wall report: arbitration-stage1

- runner: harbor / model: claude-sonnet-5-5 / runs: 27 (scored: 27) / 2026-11-01T03:36:43.954Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:escalate | script:reference | script:partial | script:tamper | script:reference-status | script:shortcut-adr | script:shortcut-newest | script:shortcut-config |
|---|---|---|---|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| a4-premise-gone | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| a9-newer-grounds | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +0 pt | -40 … +41 pt | **inconclusive** |

## overall

| case | script:null | script:escalate | script:reference | script:partial | script:tamper | script:reference-status | script:shortcut-adr | script:shortcut-newest | script:shortcut-config |
|---|---|---|---|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) |
| a4-premise-gone | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |
| a9-newer-grounds | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 1/1 (100%; 21%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | +7 … +85 pt | **improved** |

## Skill activation (indicator, not scored)

| case | script:null | script:escalate | script:reference | script:partial | script:tamper | script:reference-status | script:shortcut-adr | script:shortcut-newest | script:shortcut-config |
|---|---|---|---|---|---|---|---|---|---|
| a3-unreasoned-newer-value | – | – | – | – | – | – | – | – | – |
| a4-premise-gone | – | – | – | – | – | – | – | – | – |
| a9-newer-grounds | – | – | – | – | – | – | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:escalate | script:reference | script:partial | script:tamper | script:reference-status | script:shortcut-adr | script:shortcut-newest | script:shortcut-config |
|---|---|---|---|---|---|---|---|---|---|
| a3-unreasoned-newer-value | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| a4-premise-gone | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
| a9-newer-grounds | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |
