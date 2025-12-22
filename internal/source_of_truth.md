# Source of Truth

## Project Overview
"Daily Driver" is a minimalistic task logging app for daily project management. It focuses on speed, simplicity, and tracking progress over time.

## Tech Stack
- **Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS with CSS Variables for theming (No Tailwind)
- **Routing**: React Router v6
- **State**: Context API (`AppContext`, `AuthContext`)
- **Storage**: **Supabase Postgres** (Cloud Primary), LocalStorage (fallback)
- **Auth**: **Supabase Auth** (Email/Password, Magic Link, Google OAuth, GitHub OAuth)
- **AI**: OpenAI API (`gpt-4o-mini`) via direct frontend call
- **Editor**: TipTap for Rich Text with custom extensions (AiPromptNode)
- **Hosting**: Vercel (https://daily-driver-xi.vercel.app)

## Immutable Rules
1. **Design First**: Aesthetics are paramount. Maintain the premium, deep purple theme.
2. **Vanilla CSS**: Do not introduce CSS frameworks like Tailwind or Bootstrap.
3. **Task as Document**: Every task is a workspace. The editor is the primary focus.
4. **Cloud-Primary**: All authenticated data syncs to Supabase.
5. **Internal Logs**: Maintain `.internal/` files for versioning and errors.

## Key Configurations
- **Theme**: Light/Dark toggle with `data-theme` attribute on `html` tag.
- **Logo**: 36px height in Header. Dual assets: `/logo-light.png` and `/logo-dark.png`.
- **Header**: Fixed position, 52px height, rounded bottom corners.
- **Sidebars**: 220px width, rounded right corners.
- **Env Vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`

## AI Features
- **Enhance Mode**: Polish, Concise, Detailed, Actionable options
- **Prompt Mode**: `/AI Prompt` slash command with inline input
- **System Prompt**: Instructs AI to never ask follow-up questions
- **Preview Modal**: Accept, Keep Both, Decline options
- **Usage Limit**: 5 AI uses per user (admin unlimited)

## Data Model (Supabase)

### Projects Table
- `id`: uuid (primary key)
- `user_id`: uuid (foreign key)
- `name`: text
- `type`: text ('work' or 'personal', default 'personal')
- `visible`: boolean (default true)
- `created_at`: timestamp

### Tasks Table
- `id`: uuid (primary key)
- `project_id`: uuid (foreign key)
- `user_id`: uuid (foreign key)
- `date`: text (YYYY-MM-DD)
- `title`: text
- `content`: text (html)
- `status`: text (not_started, ongoing, done, canceled)
- `priority`: text (urgent, high, normal, low)
- `estimated_days`: integer
- `created_at`: timestamp

### User Settings Table
- `id`: uuid (primary key)
- `user_id`: uuid (foreign key, unique)
- `ai_uses`: integer (default 0)
- `created_at`: timestamp

## Admin Configuration
- **Admin Emails**: `afonsurbano@gmail.com` - Unlimited AI uses
