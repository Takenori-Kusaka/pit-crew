# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 12 (scored: 12) / 2026-11-03T11:55:08.244Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 10/12 (83%; 55%–95%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 11/12 (92%; 65%–99%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 10/12 (83%; 55%–95%) |

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
| t5-stale-base-weak | 9 / 3 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #4: `ep -rn '90' bin lib; bash tests/price_test.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| turn-limit | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #9: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #9: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_b8449eaa24bd4991966ecc89cc6a9628="$CLAUDE_CODE_INSTRUCTION_B8449EAA24BD4991966ECC89CC6A9628"; unset CLAUDE_CODE_I
