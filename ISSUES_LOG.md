# Issues Log

| ID | Date | Symptom | Root Cause | Fix | Status |
|----|------|---------|------------|-----|--------|
| 1 | 2026-01-02 | Typing in TaskEditor is irregular - letters disappearing, random newlines when typing fast | Race condition: debounced save triggers global state update, which calls `setContent` on the TipTap editor while user is still typing, resetting editor content mid-keystroke | Added `lastSavedContentRef` to track last saved content. Skip `setContent` in sync useEffect if user is focused AND incoming content matches our last save (i.e., our own echo) | ✅ Fixed |
