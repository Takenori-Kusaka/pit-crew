# pit-wall report: qm-heldout

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-05T07:54:19.015Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/role-harness-v1-shop@/audit |
|---|---|
| qmh-h2 | 0/9 (0%; 0%–30%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/role-harness-v1-shop@/audit |
|---|---|
| qmh-h2 | 0/9 (0%; 0%–30%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/role-harness-v1-shop@/audit |
|---|---|
| qmh-h2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/role-harness-v1-shop@/audit |
|---|---|
| qmh-h2 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/role-harness-v1-shop@/audit / qmh-h2 #3: `gh pr view 57 --comments 2>&1   head -40; echo ---; gh api repos/example/stockco => Exit code 127` |
