# pit-wall report: qm

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-04T23:08:05.163Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qm-h1 | 1/9 (11%; 2%–44%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qm-h1 | 1/9 (11%; 2%–44%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qm-h1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qm-h1 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/ganbari-quest-v0-full@/audit / qm-h1 #9: `gh pr view 90; echo ===; gh pr view 51; echo ===; gh pr checks 90; type gh; file => Exit code 127` |
