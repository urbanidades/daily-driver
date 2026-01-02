# Memory

## Architecture Decisions

| Date | Decision | Rationale |
| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-30 | **React + Vite** for Frontend | Standard, fast modern web stack. |
| 2025-12-30 | **Capacitor** for Mobile | Allows reusing the web codebase for native apps. |
| 2025-12-30 | **Supabase** for Backend | Provides Auth, DB, and Realtime out of the box. |

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS (assumed/standard), TipTap (Editor)
- **Mobile**: Capacitor (iOS, Android)
- **Backend**: Supabase (PostgreSQL)
- **State**: React Context

## Known Gotchas
- **Supabase Auth**: Web redirects vs Native deep links need careful handling.
- **Capacitor Sync**: Native projects (`android/`, `ios/`) need regular syncing with `npx cap sync`.
- **Vite Ports**: Strict port configuration needed for Auth redirects.

## Token Decisions

| Date | Category | Decision | Rationale |
|------|----------|----------|-----------|
| 2025-12-30 | Design | **Material/Lucide Icons** | Consistent icon set across app. |

## Agent Preferences


| Agent | Focus Area |
|-------|------------|
| GEMINI | Planning, High-level Architecture, UI Design, Orchestration |
| CLAUDE | Implementation, Debugging, Refactoring |

## Project-Specific Context
- **Core Loop**: Log tasks -> AI Enhancement -> Sync to DB.
- **Platforms**: Web (primary dev), Android/iOS (target).
- **Goal**: Frictionless daily logging with smart summaries.

