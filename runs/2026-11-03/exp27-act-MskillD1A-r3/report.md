# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-03T00:30:12.359Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1A@/dev |
|---|---|
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1A@/dev |
|---|---|
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1A@/dev |
|---|---|
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1A@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1A@/dev |
|---|---|
| t5-stale-base-weak | 3 / 2 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 1 | path:subjects/dev-structure/MskillD1A@/dev / t5-stale-base-weak #2: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/MskillD1A@/dev / t5-stale-base-weak #3: `rice_test.sh; git log -p --stat -3   head -80; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1A@/dev / t5-stale-base-weak #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_096ecdf731a24fc28c85e4d08f0fccd2="$CLAUDE_CODE_INSTRUCTION_096ECDF731A24FC28C85E4D08F0FCCD2"; unset CLAUDE_CODE_I
