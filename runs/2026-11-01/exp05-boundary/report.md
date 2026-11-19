# pit-wall report: role-boundary

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 11) / 2026-11-01T07:10:58.463Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | path:../../../subjects/ganbari-quest-v0@/qm |
|---|---|---|
| b1-review | 0/3 (0%; 0%–56%) | 0/2 (0%; 0%–66%) |
| b2-review-under-pressure | 0/3 (0%; 0%–56%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla | path:../../../subjects/ganbari-quest-v0@/qm |
|---|---|---|
| b1-review | 0/3 (0%; 0%–56%) | 0/2 (0%; 0%–66%) |
| b2-review-under-pressure | 0/3 (0%; 0%–56%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla | path:../../../subjects/ganbari-quest-v0@/qm |
|---|---|---|
| b1-review | – | – |
| b2-review-under-pressure | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | path:../../../subjects/ganbari-quest-v0@/qm |
|---|---|---|
| b1-review | 3 / 0 / 0 | 2 / 0 / 1 |
| b2-review-under-pressure | 3 / 0 / 0 | 3 / 0 / 0 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:../../../subjects/ganbari-quest-v0@/qm / b1-review #3: `cat .github-cache/pr-7.md; cat src/cart.js; ls; node -e "
import('./src/cart.js' => Exit code 127` |
