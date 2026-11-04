# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T08:35:42.578Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 10/20 (50%; 30%–70%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 16/20 (80%; 58%–92%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 9/20 (45%; 26%–66%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 18 / 2 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | path:subjects/ganbari-quest-v0-full@/dev / t5-stale-base-weak #7: `ests/price_test.sh scripts/verify.sh; ls docs; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| turn-limit | 1 | path:subjects/ganbari-quest-v0-full@/dev / t5-stale-base-weak #16: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/ganbari-quest-v0-full@/dev / t5-stale-base-weak #16: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_98e0bd195ca842c7b9d5293ce31569fc="$CLAUDE_CODE_INSTRUCTION_98E0BD195CA842C7B9D5293CE31569FC"; unset CLAUDE_CODE_I
