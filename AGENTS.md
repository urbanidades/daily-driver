# AGENTS.md

## Project Summary
**DailyDriver** is a personal task logging and management application. It allows users to track tasks, organize them with AI-enhanced tags and summaries, and sync data across devices using Supabase. It supports both web and mobile platforms.

## Tech Stack Target
- **Framework**: React + Vite
- **Mobile Wrapper**: Capacitor (iOS/Android)
- **Language**: JavaScript (migrating to TypeScript preferred, currently mixed/JS)
- **Routing**: React Router
- **State/Logic**: React Context + Hooks
- **Backend/DB**: Supabase
- **Editor**: TipTap (for rich text task descriptions)

## Repo Structure
- `daily-driver/` (Root)
  - `src/` - Application source code
  - `electron/` - Electron specific code (if applicable/planned)
  - `android/`, `ios/` - Capacitor native projects

## Commands (run from `daily-driver/`)
### Install
- `npm install`

### Run
- **Dev Server**: `npm run dev` (Vite)
- **Build Web**: `npm run build`
- **Preview Build**: `npm run preview`

### Capacitor (Mobile)
- **Sync Native**: `npx cap sync`
- **Open Android**: `npx cap open android`
- **Open iOS**: `npx cap open ios`
- **Generate Assets**: `npm run assets`

### Diagnostics
- Check node version: `node -v`
- Check npm version: `npm -v`

- **Stable Build**: Never commit a broken build.
- **Infra fixes** (deps/tooling) should be logged in `ISSUES_LOG.md`.

## Troubleshooting (common failures)
See `ISSUES_LOG.md` for historical issues and fixes.

### 1) Supabase Connection Issues
- Ensure `.env` contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2) Capacitor Platform Sync
- If native build fails, try: `rm -rf android/ ios/` then `npx cap add android`, `npx cap add ios`.

## Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase public anon key
- `VITE_OPENAI_API_KEY`: (Optional) For AI features if local proxy not used.

## Architecture Decisions
- Architecture decisions are recorded in `.agent/context/memory.md`.
- Infra issues are recorded in `ISSUES_LOG.md`.
