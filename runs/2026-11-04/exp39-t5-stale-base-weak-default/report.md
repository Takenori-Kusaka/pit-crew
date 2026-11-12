# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-04T07:58:38.163Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 8 / 2 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #4: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #7: `in/price   head -60; bash tests/price_test.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_a00d225c01c24447b160161c0fcd95a0="$CLAUDE_CODE_INSTRUCTION_A00D225C01C24447B160161C0FCD95A0"; unset CLAUDE_CODE_I
