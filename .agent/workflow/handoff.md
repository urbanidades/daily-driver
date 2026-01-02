---
description: Workflow for handing off work to another agent or back to the user.
---

# Handoff Workflow

1. **Ensure Stable State**:
   - Make sure all code is committed.
   - Verify that the build is not broken.
2. **Create Prompt File**:
   - Create a new markdown file in `.agent/prompts/` using the template in `.agent/prompts/README.md`.
   - Describe the task, context, and requirements clearly.
3. **Queue in Handoffs**:
   - Add an entry to the "Pending Handoffs" table in `.agent/context/handoffs.md`.
4. **Update Orchestra**:
   - Update your status in `.agent/context/orchestra.md` (e.g., "Waiting for X").
5. **Note Decisions**:
   - If you made any important decisions, ensure they are logged in `.agent/context/memory.md`.
