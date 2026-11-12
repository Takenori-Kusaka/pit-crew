# pit-wall report: fix

- runner: harbor / model: claude-haiku-5-5 / runs: 30 (scored: 29) / 2026-11-11T22:35:53.206Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| fx-g2 | 29/29 (100%; 88%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| fx-g2 | 29/29 (100%; 88%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| fx-g2 | 29/29 (100%; 88%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| fx-g2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| fx-g2 | 29 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / fx-g2 #19: `python3 - <<'EOF'
p='README.md'
s=open(p,encoding='utf-8').read()
s=s.replace("  => command not found` |
