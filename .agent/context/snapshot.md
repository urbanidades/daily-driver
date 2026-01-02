# DailyDriver Snapshot (Source of Truth)

Last updated: 2025-12-29

## 0) What DailyDriver is
**DailyDriver** is a personal task logging application designed to reduce friction in tracking daily activities. Any chaotic thought can be dumped into the app, which then uses AI to enhance, tag, and summarize the entry. It syncs across Web and Mobile (Android/iOS) using Supabase.

## 1) Repo + Control Plane
This repo uses a “control plane” for agentic development:
- `AGENTS.md` — source of truth for agent behavior, commands, troubleshooting
- `ISSUES_LOG.md` — incident log (root cause + fix + prevention)
- `.agent/context/`
  - `orchestra.md` — sprint/stream tracking (active/completed)
  - `handoffs.md` — handoff notes
  - `memory.md` — architecture + decisions
  - `SNAPSHOT.md` — this file (new-chat source of truth)
- `.agent/workflows/` — sync/orchestrate/handoff workflows
- `.agent/prompts/` — reusable prompt templates


## 2) App structure
<!-- Complete this point -->

## 3) 
<!-- Complete this point -->