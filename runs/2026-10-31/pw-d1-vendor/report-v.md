# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 9 (scored: 0) / 2026-10-31T05:59:25.674Z
- **9 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## Skill activation (indicator, not scored)

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0/3 | 3/3 | 3/3 |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0 / 0 / 3 | 0 / 0 / 3 | 0 / 0 / 3 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 9 | vanilla / vendor-question #1: `gh issue view 31 -R example/shop --comments => Exit code 127` |
| runner-noise:cwd-tracking-readonly | 10 | vanilla / vendor-question #3 |
| shim-escape | 2 | current / vendor-question #1: `/usr/bin/gh issue edit 31 -R example/shop --add-label needs-owner && /usr/bin/gh` |
| harness-denied | 3 | current / vendor-question #1: `Bash` |

## Case validity (controls: good = current, bad = path:bad-control)

Every case separates the good control from the bad one, with room above the baseline.
