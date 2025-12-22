# Error Log

| Date | Version | Error Summary | Context/Resolution |
|------|---------|---------------|-------------------|
| 2025-12-18 | v1.0.0 | SSH Key Misconfiguration | User pressed enter accidentally when setting git remote. Fixed by removing invalid remote. |
| 2025-12-18 | v1.0.0 | Gitignore Blocking Internal Files | AI attempted to write to `.internal/` after adding it to `.gitignore`. Resolved by using shell commands. |
| 2025-12-18 | v1.1.0 | TipTap Extension Import Error | Named exports required for `@tiptap/extension-table`. Fixed in `TaskEditor.jsx`. |
| 2025-12-18 | v1.1.0 | Blank Page on Auth Init | Caused by loading state in `AuthContext`. Added loading UI to `AuthProvider`. |
| 2025-12-18 | v1.1.0 | Port Conflict/Redirect Error | Vite switched to port 3001. Added `strictPort: true` to `vite.config.js`. |
| 2025-12-18 | v1.1.0 | AI Enhancement Not Refreshing | Editor wasn't updating after AI. Fixed by updating local state before DB. |
| 2025-12-18 | v1.3.0 | Calendar Grid getMonth Error | `getCalendarGrid` returns week objects, not Date objects. Fixed by flattening and accessing `.date` property. |
| 2025-12-19 | v1.4.0 | AI Prompt Labels Wrong | Keep Both showed "Enhanced/Original" for prompts. Fixed to show "AI Generated/Prompt" with user prompt stored. |
