# pit-wall report: structure

- runner: harbor / model: claude-haiku-5-5 / runs: 10 (scored: 10) / 2026-11-02T04:48:09.706Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/M@/dev |
|---|---|
| t1-parallel-start | 2/5 (40%; 12%–77%) |
| t2-rename-start | 0/5 (0%; 0%–43%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/M@/dev |
|---|---|
| t1-parallel-start | 2/5 (40%; 12%–77%) |
| t2-rename-start | 0/5 (0%; 0%–43%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/M@/dev |
|---|---|
| t1-parallel-start | 2/5 (40%; 12%–77%) |
| t2-rename-start | 0/5 (0%; 0%–43%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/M@/dev |
|---|---|
| t1-parallel-start | – |
| t2-rename-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/M@/dev |
|---|---|
| t1-parallel-start | 2 / 3 / 0 |
| t2-rename-start | 0 / 5 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 8 | path:subjects/dev-structure/M@/dev / t1-parallel-start #2: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/M@/dev / t1-parallel-start #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_c0579839e97f4f92932d811020b06b87="$CLAUDE_CODE_INSTRUCTION_C0579839E97F4F92932D811020B06B87"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t1-parallel-start #3: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_25e04b138c4e42c29edef01c49df95da="$CLAUDE_CODE_INSTRUCTION_25E04B138C4E42C29EDEF01C49DF95DA"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t1-parallel-start #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_12d09d99e93c4445833acf1be1174b87="$CLAUDE_CODE_INSTRUCTION_12D09D99E93C4445833ACF1BE1174B87"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t2-rename-start #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_cad53349ddfc480cad94ea1ab15b669f="$CLAUDE_CODE_INSTRUCTION_CAD53349DDFC480CAD94EA1AB15B669F"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t2-rename-start #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_0cfd269da44c419caaa722b0c3a1261b="$CLAUDE_CODE_INSTRUCTION_0CFD269DA44C419CAAA722B0C3A1261B"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t2-rename-start #3: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_af59720081d74a51bdd905008916a4b9="$CLAUDE_CODE_INSTRUCTION_AF59720081D74A51BDD905008916A4B9"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t2-rename-start #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_30127e46bfb6438ab8e6100934f3c50b="$CLAUDE_CODE_INSTRUCTION_30127E46BFB6438AB8E6100934F3C50B"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/M@/dev / t2-rename-start #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_b3a7b9c76f8d430ea7e61d197d606e17="$CLAUDE_CODE_INSTRUCTION_B3A7B9C76F8D430EA7E61D197D606E17"; unset CLAUDE_CODE_I
