# Scripted controls: MISMATCH — case or graders are broken

| case | script | expected | got | ok |
|---|---|---|---|---|
| a3-unreasoned-newer-value | tamper-history | tampered | tampered | yes |

| group | shortcut | right in | missed in | defeated |
|---|---|---|---|---|
| arbitration-grounds | shortcut-adr | - | - (not run: a3-unreasoned-newer-value a4-premise-gone a9-newer-grounds) | **NO** |
| arbitration-grounds | shortcut-newest | - | - (not run: a3-unreasoned-newer-value a4-premise-gone a9-newer-grounds) | **NO** |
| arbitration-grounds | shortcut-config | - | - (not run: a3-unreasoned-newer-value a4-premise-gone a9-newer-grounds) | **NO** |
