# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-04T12:16:19.481Z
- **1 run(s) had a check that could not decide.** They are shown as "undecidable" next to the scores, not counted as passes or failures. See "Run validity".
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| qm-d3 | 0/4 (0%; 0%–49%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| qm-d3 | 0/4 (0%; 0%–49%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| qm-d3 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| qm-d3 | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| check-undecidable | 1 | vanilla / qm-d3 #3: `task-done` |
