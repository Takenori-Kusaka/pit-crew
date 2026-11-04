# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T23:20:59.204Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 18/20 (90%; 70%–97%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 18/20 (90%; 70%–97%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 18/20 (90%; 70%–97%) |

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
| t5-stale-base-weak | 16 / 4 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #4: `p -v "^./CLAUDE.md"; bash tests/price_test.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| turn-limit | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #10: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #10: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_4f9218a20821488e935e985a420e690c="$CLAUDE_CODE_INSTRUCTION_4F9218A20821488E935E985A420E690C"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #11: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_45d7d256803548fd958eeaf601949fd1="$CLAUDE_CODE_INSTRUCTION_45D7D256803548FD958EEAF601949FD1"; unset CLAUDE_CODE_I
