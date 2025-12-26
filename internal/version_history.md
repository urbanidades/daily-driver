# Version History

## v1.0.0 - Initial Release
- **Status**: Completed ✅
- **Release Date**: 2025-12-18
- **Summary**: Full local React app with Daily Driver branding, purple theme, and AI description tools.

## v1.1.0 - The "Notion" Overhaul
- **Status**: Completed ✅
- **Release Date**: 2025-12-18
- **Summary**: Authentication, rich text editor, Notion-style UI, and AI enhancement features.
- **Features**:
  - [x] Supabase Auth (Email/Password, Magic Link)
  - [x] TipTap Rich Text Editor with slash commands
  - [x] Full-page Task Workspace with property sidebar
  - [x] Priority System (Urgent, High, Normal, Low)
  - [x] AI Enhancement with preview modal
  - [x] Vercel Deployment

## v1.2.0 - Complete Identity
- **Status**: Completed ✅
- **Release Date**: 2025-12-18
- **Summary**: Full OAuth support for Google and GitHub authentication.
- **Features**:
  - [x] Google OAuth login
  - [x] GitHub OAuth login

## v1.3.0 - Dashboard Redesign
- **Status**: Completed ✅
- **Release Date**: 2025-12-18
- **Summary**: Major UI overhaul with calendar dashboard, project categories, and drag-and-drop.
- **Features**:
  - [x] New Dashboard replacing ProjectList at home route
  - [x] Left sidebar with Work/Personal project categories
  - [x] Calendar view showing tasks from all visible projects
  - [x] Project visibility toggles (eye icon)
  - [x] Drag-and-drop between project types
  - [x] Fixed header positioning and new logos
  - [x] Compact header and sidebars with rounded corners

## v1.4.0 - AI Slash Commands
- **Status**: Completed ✅
- **Release Date**: 2025-12-19
- **Summary**: Inline AI prompting via slash commands with preview modal.
- **Features**:
  - [x] `/AI Prompt` slash command with inline input box
  - [x] AI responses show preview modal (Accept/Keep Both/Decline)
  - [x] `promptAI()` function with no follow-up questions system prompt
  - [x] Context-aware labels for prompt vs enhance modes
  - [x] User prompt stored and displayed in Keep Both

## v1.5.0 - Real-time & Premium Editor
- **Status**: Completed ✅
- **Release Date**: 2025-12-22
- **Summary**: Real-time multi-device sync, new User Settings dashboard, and major editor experience polish.
- **Features**:
  - [x] **Supabase Realtime**: Live multi-device sync for projects and tasks.
  - [x] **New Settings Page**: Monitor AI usage credits and personal activity stats.
  - [x] **Syntax Highlighting**: Beautiful code blocks with language auto-detection.
  - [x] **Premium Slash Menu**: Notion-style menu with icons and helpful descriptions.
  - [x] **Text Highlighting**: Mark important insights with custom highlights.
  - [x] **Smart Auto-save**: Title and content sync instantly without manual saving.
  - [x] **UI Polish**: Notion-like checkboxes and perfect title alignment.

## v1.6.0 - Advanced Editor Blocks
- **Status**: Completed ✅
- **Release Date**: 2025-12-22
- **Summary**: Major editor power-ups with Collapsible Toggles and Drag-and-Drop Image handling.
- **Features**:
  - [x] **Toggle Blocks**: Create collapsible sections with `/toggle` or `>`.
  - [x] **Image Uploads**: Drag & drop or paste images directly into the editor.
  - [x] **Supabase Storage**: Secure cloud storage for all your task images.
  - [x] **Resize Handles**: Interactive resizing for images directly in the editor.
  - [x] **Image Slash Command**: Quick upload via `/image` command.

## v1.7.0 - Mobile App Foundation
- **Status**: Completed ✅
- **Release Date**: 2025-12-26
- **Summary**: Transforming Daily Driver into a native mobile app using Capacitor.
- **Features**:
  - [x] **Capacitor Setup**: iOS and Android native project scaffolding.
  - [x] **Safe Area CSS**: Support for device notches and home indicators.
  - [x] **Bottom Navigation**: Native-feeling tab bar for mobile.
  - [x] **Mobile Header**: Compact header with safe-area padding.
  - [x] **Horizontal Projects**: Touch-friendly scrollable project list.
  - [x] **Deep Linking**: Supabase OAuth for native apps (`com.dailydriver.app`).
  - [x] **App Icons & Splash**: Branded app assets.

## v1.8.0 - Mobile Polish
- **Status**: Planned 🗓️
- **Summary**: Native mobile interactions and UI refinements.
- **Features**:
  - [ ] **Mobile Toolbar**: Notion-style bar with (+) expander to hide keyboard.
  - [ ] **Project Renaming**: UI to edit project names.
  - [ ] **Haptic Feedback**: Vibration on interactions (drag, check, nav).
  - [ ] **Pull-to-Refresh**: Reload dashboard data on pull.
  - [ ] **Swipe Actions**: Swipe tasks to Delete/Complete.
  - [ ] **Dynamic Status Bar**: Match status bar color with theme.

## v1.9.0 - AI Power-Ups
- **Status**: Planned 🗓️
- **Summary**: "Bring Your Own Key" for unlimited AI usage and model selection.
- **Features**:
  - [ ] **BYOK Settings**: Forms to save OpenAI/Gemini/Claude keys.
  - [ ] **Model Selector**: Choose active model (GPT-4o, GPT-5.2, Claude 4.5, etc.).
  - [ ] **Unified AI Service**: Multi-provider architecture.
