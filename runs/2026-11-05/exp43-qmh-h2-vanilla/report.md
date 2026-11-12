# pit-wall report: qm-heldout

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 8) / 2026-11-05T07:47:51.337Z
- **2 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| qmh-h2 | 1/8 (13%; 2%–47%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| qmh-h2 | 1/8 (13%; 2%–47%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| qmh-h2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| qmh-h2 | 8 / 0 / 2 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 2 | vanilla / qmh-h2 #6: `gh pr view 57 --json body   jq -r .body; gh pr view 57 --json files   jq -r '.fi => Exit code 127` |
