# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 4) / 2026-11-04T13:22:41.715Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qm-h2 | 2/4 (50%; 15%–85%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qm-h2 | 2/4 (50%; 15%–85%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qm-h2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/qm-skill-default@/qm-ship |
|---|---|
| qm-h2 | 4 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/qm-skill-default@/qm-ship / qm-h2 #1: `cd /app; gh pr view 93 --json body   jq -r .body; for n in 51 72 74 80; do echo  => Exit code 127` |
