---
description: Dispatch an independent cold review of a milestone, then await my decision.
argument-hint: [milestone-id]
allowed-tools: Task, Read, Bash
---
Use the **cold-reviewer** subagent to review milestone **$1** in a clean context,
against CLAUDE.md, the $1 checkpoint in the build plan, design-tokens.md, the
relevant PRD sections, the asset manifest, and the mockups. Pass it the milestone
id and that doc set.

Present its lists — (a)/(b)/(c), visual mismatches, "needs the human's eyes", and
"open decisions" — unchanged. Do NOT start fixing anything; wait for me to say
which findings to act on.