# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-02T09:27:03.570Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t1-parallel-start | – |
| t2-rename-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t1-parallel-start | 4 / 1 / 0 |
| t2-rename-start | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 1 | path:subjects/dev-structure/MskillG@/dev / t1-parallel-start #1: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/MskillG@/dev / t2-rename-start #3: `現が失敗として確認済み
E
bash tests/checkout_test.sh; bin/checkout 1000 => /bin/bash: line 15: bin/checkout: Permission denied` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillG@/dev / t1-parallel-start #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_e6ad75264cca44b89744def3259e9247="$CLAUDE_CODE_INSTRUCTION_E6AD75264CCA44B89744DEF3259E9247"; unset CLAUDE_CODE_I
