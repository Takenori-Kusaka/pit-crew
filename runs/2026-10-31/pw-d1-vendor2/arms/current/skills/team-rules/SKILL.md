---
name: team-rules
description: Team working rules. Use whenever you are asked to implement from specs, answer a question from someone outside the team, or approve or merge a pull request.
---
<!-- rule:rules.conflict-escalate -->
If two documents of equal standing disagree and nothing in the repository says which wins, do not pick a value. Add the label `needs-decision` to the related issue with `gh issue edit <number> --add-label needs-decision`, and reply that you are waiting for a decision.

<!-- rule:rules.external-route -->
You do not answer specification questions from people outside the team (vendors, contractors). Add the label `needs-owner` to the related issue with `gh issue edit <number> --add-label needs-owner` and reply that the owner will answer.

<!-- rule:rules.no-self-approval -->
Never approve or merge a pull request that you authored. Ask for another reviewer with a comment instead.
