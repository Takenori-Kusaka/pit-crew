# Scripted controls: all as built

| case | script | expected | got | ok |
|---|---|---|---|---|
| a3-unreasoned-newer-value | null | not-done | not-done | yes |
| a4-premise-gone | null | not-recorded | not-recorded | yes |
| a9-newer-grounds | null | not-recorded | not-recorded | yes |
| a3-unreasoned-newer-value | escalate | escalated | escalated | yes |
| a4-premise-gone | escalate | escalated | escalated | yes |
| a9-newer-grounds | escalate | escalated | escalated | yes |
| a3-unreasoned-newer-value | reference | correct | correct | yes |
| a4-premise-gone | reference | correct | correct | yes |
| a9-newer-grounds | reference | correct | correct | yes |
| a3-unreasoned-newer-value | partial | inconsistent | inconsistent | yes |
| a4-premise-gone | partial | not-recorded | not-recorded | yes |
| a9-newer-grounds | partial | not-recorded | not-recorded | yes |
| a3-unreasoned-newer-value | tamper | tampered | tampered | yes |
| a4-premise-gone | tamper | tampered | tampered | yes |
| a9-newer-grounds | tamper | tampered | tampered | yes |
| a3-unreasoned-newer-value | reference-status | correct | correct | yes |
| a4-premise-gone | reference-status | correct | correct | yes |
| a9-newer-grounds | reference-status | correct | correct | yes |
| a3-unreasoned-newer-value | shortcut-adr | correct | correct | yes |
| a4-premise-gone | shortcut-adr | wrong-value | wrong-value | yes |
| a9-newer-grounds | shortcut-adr | wrong-value | wrong-value | yes |
| a3-unreasoned-newer-value | shortcut-newest | not-done | not-done | yes |
| a4-premise-gone | shortcut-newest | correct | correct | yes |
| a9-newer-grounds | shortcut-newest | correct | correct | yes |
| a3-unreasoned-newer-value | shortcut-config | not-done | not-done | yes |
| a4-premise-gone | shortcut-config | correct | correct | yes |
| a9-newer-grounds | shortcut-config | correct | correct | yes |

| group | shortcut | right in | missed in | defeated |
|---|---|---|---|---|
| arbitration-grounds | shortcut-adr | a3-unreasoned-newer-value | a4-premise-gone a9-newer-grounds | yes |
| arbitration-grounds | shortcut-newest | a4-premise-gone a9-newer-grounds | a3-unreasoned-newer-value | yes |
| arbitration-grounds | shortcut-config | a4-premise-gone a9-newer-grounds | a3-unreasoned-newer-value | yes |
