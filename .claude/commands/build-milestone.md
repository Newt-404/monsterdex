---
description: Implement one milestone strictly to its build-plan checkpoint, then stop.
argument-hint: [milestone-id]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---
Implement milestone **$1**.

Read first: @CLAUDE.md, the **$1** section + checkpoint of
@monsterdex-build-plan.md, @design-tokens.md, and the PRD sections it references.

Rules:
- Build only what the $1 checkpoint lists. Do not start later milestones.
- Pull every value (sizes, colors, spacing) from design-tokens.md. Never eyeball.
- If you hit a DECISION_NEEDED or GROUND_TRUTH_CHECK marker, or any choice the
  docs don't settle, STOP and ask me — do not guess and continue.
- After building, run build/typecheck + any sanity counts, then summarize
  mapped to each checkpoint item.

Stop at the checkpoint. Do NOT self-review — that is a separate, independent step.