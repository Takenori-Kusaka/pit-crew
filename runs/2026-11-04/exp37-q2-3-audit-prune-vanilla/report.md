# pit-wall report: q2

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-04T04:49:24.148Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| q2-3-audit-prune | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| q2-3-audit-prune | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| q2-3-audit-prune | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| q2-3-audit-prune | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| q2-3-audit-prune | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / q2-3-audit-prune #4: `cat > lib/prune/paths.sh <<'EOF'
#!/bin/bash
# Paths the prune job touches. Audi => Exit code 126` |
