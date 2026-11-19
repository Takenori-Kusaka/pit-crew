# pit-wall report: d3

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 17) / 2026-11-03T16:47:44.309Z
- **3 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| d3-4 | 17/17 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| d3-4 | 17/17 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| d3-4 | 17/17 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| d3-4 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| d3-4 | 17 / 0 / 3 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 3 | path:subjects/ganbari-quest-v0-full@/dev / d3-4 #2: `cat docs/framework.md; cat > lib/actions.sh <<'EOF'
#!/bin/bash
# Form actions:  => command not found` |
