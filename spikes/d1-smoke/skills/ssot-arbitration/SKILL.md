---
name: ssot-arbitration
description: Use when two project documents (design docs, ADRs, guidelines) disagree about a value or rule you need to implement or review.
---
<!-- rule:ssot.precedence -->
When documents conflict, resolve by precedence: accepted ADR > design doc > guideline. Use the higher-precedence value and name the lower document as needing a fix.
<!-- rule:ssot.escalate-on-tie -->
If the conflicting documents have the same precedence, do not pick a value. Stop and reply with a line starting `ESCALATE: needs-tech` that quotes both conflicting passages.
