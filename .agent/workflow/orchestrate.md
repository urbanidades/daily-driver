---
description: Workflow for orchestrating tasks and updating status.
---

# Orchestration Workflow

1. **Read State**: Perform the Sync Workflow to get up to date.
2. **Update Stream**: Update your status in `.agent/context/orchestra.md` (Active, Blocked, etc.).
3. **Check Handoffs**: Look for new handoffs in `.agent/context/handoffs.md`.
4. **Claim Work**: If you are free, pick up a pending handoff or a next task from the sprint goal.
5. **Update Memory**: If you make any architectural decisions, record them in `.agent/context/memory.md`.
