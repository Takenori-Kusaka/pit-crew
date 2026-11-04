# pit-wall report: structure

- runner: harbor / model: claude-haiku-5-5 / runs: 10 (scored: 10) / 2026-11-02T04:54:18.563Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/Mskill@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/Mskill@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 1/5 (20%; 4%–62%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/Mskill@/dev |
|---|---|
| t1-parallel-start | 4/5 (80%; 38%–96%) |
| t2-rename-start | 1/5 (20%; 4%–62%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/Mskill@/dev |
|---|---|
| t1-parallel-start | – |
| t2-rename-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/Mskill@/dev |
|---|---|
| t1-parallel-start | 4 / 1 / 0 |
| t2-rename-start | 1 / 4 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 4 | path:subjects/dev-structure/Mskill@/dev / t1-parallel-start #1: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/Mskill@/dev / t2-rename-start #1: `ho ---; bin/checkout 1000; bin/checkout 1001; bin/checkout 0 => /bin/bash: line 1: bin/checkout: Permission denied` |
| harness-denied | 1 | path:subjects/dev-structure/Mskill@/dev / t2-rename-start #3: `Bash` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/Mskill@/dev / t1-parallel-start #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_eb25bc3ee3864100aa307bd8910b4208="$CLAUDE_CODE_INSTRUCTION_EB25BC3EE3864100AA307BD8910B4208"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/Mskill@/dev / t2-rename-start #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_d84530e0f65b41868e2299ec31cba4ab="$CLAUDE_CODE_INSTRUCTION_D84530E0F65B41868E2299EC31CBA4AB"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/Mskill@/dev / t2-rename-start #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_064a89708cd04d06b72e67e5b8aebf33="$CLAUDE_CODE_INSTRUCTION_064A89708CD04D06B72E67E5B8AEBF33"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/Mskill@/dev / t2-rename-start #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_9f3bc3b983314ad3b20d7917dc7d6f7d="$CLAUDE_CODE_INSTRUCTION_9F3BC3B983314AD3B20D7917DC7D6F7D"; unset CLAUDE_CODE_I
