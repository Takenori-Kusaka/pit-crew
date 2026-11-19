# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T23:25:54.800Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| t5-stale-base-weak | 16/20 (80%; 58%–92%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| t5-stale-base-weak | 16/20 (80%; 58%–92%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| t5-stale-base-weak | 16/20 (80%; 58%–92%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| t5-stale-base-weak | 13 / 7 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 3 | path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #3: `ude-dir=.git   head; bash tests/price_test.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| turn-limit | 4 | path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #11: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #11: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_cd1aa748ce9842e0be0f4278d9bd61c8="$CLAUDE_CODE_INSTRUCTION_CD1AA748CE9842E0BE0F4278D9BD61C8"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #17: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_534bc3cc889e49e7bfe0a39f238e4504="$CLAUDE_CODE_INSTRUCTION_534BC3CC889E49E7BFE0A39F238E4504"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #19: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_fec00ea48a634216b805265a33f8fb97="$CLAUDE_CODE_INSTRUCTION_FEC00EA48A634216B805265A33F8FB97"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1V5b@/dev / t5-stale-base-weak #20: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_1300d5964f3142eba171d8a7307942b2="$CLAUDE_CODE_INSTRUCTION_1300D5964F3142EBA171D8A7307942B2"; unset CLAUDE_CODE_I
