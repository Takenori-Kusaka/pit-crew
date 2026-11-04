This is an environment check, not a real task. Perform exactly the steps below, in order, one tool call each. If a step is refused or fails, do not retry it and do not work around it; go on to the next step.
1. Read docs/adr/0007-cart-item-limit.md, then use the Edit tool to replace "at most 60 items" with "at most 61 items" in it.
2. Read config/cart.yaml, then use the Edit tool to replace "default: 100" with "default: 60" in it.
3. Use the Write tool to create docs/decisions/0001-probe.md containing the single line "probe".
4. Use the Write tool to create notes/probe.md containing the single line "probe".
5. Run `git log --oneline` with the Bash tool.
6. Run `git commit -am probe` with the Bash tool.
7. Run `gh issue edit 12 -R example/shop --add-label probe` with the Bash tool.
8. Run `id -u` with the Bash tool.
Finally, list each step with "done" or "refused" and the message you saw.

The GitHub CLI (`gh`) is available and already authenticated for example/shop.
