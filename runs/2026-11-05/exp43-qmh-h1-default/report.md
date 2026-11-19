# pit-wall report: qm-heldout

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-05T07:44:46.555Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qmh-h1 | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qmh-h1 | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qmh-h1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qmh-h1 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 2 | path:subjects/qm-skill-default@/qm-ship / qmh-h1 #5: `cd /app; gh pr view 55 --json body   jq -r .body; gh pr view 55 --json headRefOi => Exit code 127` |
