# Changelog

All notable changes to Chameleon Chat are documented in this file.

This project is currently in **alpha stage** (v0.x). APIs and features may change.

---

## [0.8.0-alpha] - 2025-12-03

### Unified Visualization System
- **Streaming Visualization** - Real-time display of AI generation progress
  - Phase indicators (thinking, searching, reasoning, generating)
  - Token count and tokens/second display
  - Time-to-first-token (TTFT) metrics
  - Search query and provider display
  - Reasoning token tracking
  - Model info display
  - Files: `components/chat-messages.tsx`, `contexts/app-context.tsx`

- **Visualization Settings Panel** - Centralized control for all visual features
  - 3 presets: Minimal, Balanced, Maximum
  - Collapsible sections for organized settings
  - Per-feature toggles for streaming, analytics, rich content
  - Files: `components/visualization-settings-panel.tsx`

### UI Improvements
- **New Logo** - Beautiful chameleon brand identity
- **Cleaned Up Menus** - Removed empty "Schnellaktionen" section
- **Removed Cookie Banner** - Simplified local-first experience

### Bug Fixes
- Fixed Quick Actions menu removing unused music toggle
- Cleaned up unused imports and props

### Developer Experience
- Added `StreamingState` type for tracking generation progress
- Enhanced context with streaming state management
- Added GitHub templates for issues and PRs
- Comprehensive README overhaul
- Added CONTRIBUTING.md guide
- Added INSTALLATION.md guide
- Created .env.example template

---

## [0.7.0-alpha] - 2025-11-26

### Message Editing & Content Management
- **Message Editing** - Edit your sent messages with inline editor
  - Click edit icon on any user message
  - AI automatically re-generates response after edit
  - Save/Cancel buttons for confirmation
- **Draft Auto-Save** - Never lose your work
  - Auto-saves to localStorage every 500ms
  - Per-chat drafts with 24-hour expiry
  - Automatic restoration when returning to chat
  - Files: `hooks/use-draft.ts`

### Search & Discovery
- **Full-Text Search** - Search all chat content, not just titles
  - Inverted index for O(1) lookups (1-5ms vs 50-200ms)
  - Real-time results as you type
  - Relevance scoring (titles rank higher)
  - Minimum 3 characters to trigger
  - Files: `lib/search-service.ts`, `components/chat-sidebar.tsx`

### AI-Powered Features
- **Smart Chat Titles** - AI generates concise titles from first message
  - Uses `openai/gpt-oss-20b` (privacy-focused open-source model)
  - 2-6 word titles, no quotes or trailing punctuation
  - Background generation (non-blocking)
  - Fallback to truncated message on failure
  - Files: `lib/title-generator.ts`
- **Title Animation** - Subtle slide-in effect when title appears
  - GPU-friendly CSS animation (no JS loops)
  - Primary color highlight that fades
  - Respects `prefers-reduced-motion`
  - 1.2s duration with smooth easing

### PWA Stability
- **Image Compression** - Auto-compress uploads to prevent crashes
  - Max 1920x1080, 80% quality
  - WebP format with JPEG fallback
  - ~90% size reduction for large images
  - Skip compression for small images (<100KB) and SVGs
  - Files: `lib/file-handler.ts`
- **Memory Optimization** - Strip historical images from API requests
  - Prevents memory accumulation in long conversations
  - Placeholder text: "[Previous image was shared here]"
  - Critical for PWA stability
  - Files: `lib/multimodal-utils.ts`
- **Touch Device Fix** - Action buttons visible on iPad/tablets
  - Uses `@media(hover:hover)` instead of screen width
  - Works on all touch-enabled devices

### Bug Fixes
- Fixed `[object Object]` bug for image conversation titles
- Fixed context compression model (now uses `grok-4.1-fast`)
- Removed missing UI component dependencies

---

## [0.6.0-alpha] - 2025-11-24

### Context Window Management
- **Context Window Meter** - Visual indicator of token usage
  - Shows current/max tokens for selected model
  - Color-coded warnings (green/yellow/red)
  - Compact mode for input area
  - Files: `components/context-window-meter.tsx`
- **Auto-Compression** - Automatic context summarization
  - Triggers at 80% context usage
  - Uses fast model for compression
  - Preserves conversation flow

### Pet Companion System
- **Tamagotchi Experience** - Interactive pet companion
  - Multiple pet types (Cat, Dog, Dragon, Robot, etc.)
  - Mood system based on chat activity
  - Stats: Happiness, Energy, Friendship
  - LLM integration for pet responses
  - Files: `components/pet-companion.tsx`, `lib/pet-system.ts`
- **Pet Modes** - Optional integration levels
  - Observer mode (watches silently)
  - Reactive mode (occasional comments)
  - Active mode (participates in chat)

### Performance
- **Performance Mode Toggle** - GPU optimization settings
  - Reduces animations for lower-end devices
  - Disables blur effects when enabled

---

## [0.5.0-alpha] - 2025-11-20

### Simple Mode
- **Simple Mode** - Cleaner, persona-focused experience
  - Simplified UI for casual users
  - Persona-based tips instead of feature overload
  - Streamlined settings dialog
  - Files: `components/simple-chat-app.tsx`, `components/simple-chat-input.tsx`
- **Mode Selection** - First-time user dialog
  - Choose between Simple and Advanced mode
  - Skip for existing users
  - Persistent preference

### Gamification (Simple Mode)
- **Achievements System** - Unlock badges for milestones
  - First chat, streak days, message counts
  - Visual achievement cards
- **Streaks** - Track daily chat activity
- **Quick Start Personas** - Curated persona suggestions

### Voice Features
- **OpenAI TTS** - High-quality text-to-speech
  - 6 premium voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
  - Speed and voice selection
  - Files: `lib/openai-tts.ts`
- **Browser TTS Fallback** - Free alternative
  - 30+ system voices
  - Voice testing in settings
- **Whisper Integration** - Voice input transcription
  - OpenAI Whisper API
  - Microphone permission handling
  - Files: `lib/voice.ts`

### PWA Enhancements
- **Native-Feel PWA** - Touch optimizations
  - Haptic feedback on interactions
  - GPU acceleration
  - Smooth animations
  - Files: `lib/haptics.ts`
- **Microphone Permissions** - Better handling
  - Permission tester in settings
  - CSP headers for audio

### Internationalization
- **Image Generation** - DALL-E integration in Simple Mode
- **Chat Deletion** - Per-chat delete in Simple Mode
- **Web Search Settings** - Configure in Simple Mode

---

## [0.4.0-alpha] - 2025-11-15

### UI Refresh
- **Paper-Mint Theme** - New default theme
  - Soft, readable color palette
  - Improved contrast ratios
- **Neo Blueprint Theme** - Alternative dark theme
  - Technical aesthetic
  - High contrast
- **Modern Shell** - Updated chrome
  - Blended sidebar
  - Tighter spacing
  - Bridge elements

### Persona Expansion
- **5 New Personas**
  - Pixel (retro game dev)
  - Chef Marco (Italian cuisine)
  - Zen (meditation guide)
  - Startup Sam (entrepreneur)
  - Aria (songwriter)
- **Translations** - All personas in DE/EN/ES

### Model Updates
- **Grok 4.1 Support** - New default model
  - `grok-4.1-fast` as default
  - Vision model detection
  - Reasoning toggle support
- **Reasoning Display** - Collapsible thinking sections
  - Shows model's reasoning process
  - Toggle in chat input

### Bug Fixes
- Fixed reasoning format for OpenRouter
- Fixed cost tracker pricing (per 1M tokens)
- Reduced verbose console logging

---

## [0.3.0-alpha] - 2025-11-10

### Memory System
- **AI Memory** - Long-term context persistence
  - Store preferences, facts, skills, goals
  - Automatic extraction from conversations
  - Importance scoring (1-3)
  - Relevance-based retrieval
  - Files: `lib/memory-service.ts`
- **Memory Hub** - Management interface
  - View, edit, delete memories
  - Category filtering
  - i18n translations

### Discussion Mode
- **AI Discussion** - Multi-model debates (renamed from Debate)
  - Choose 2 models to discuss topics
  - 2-5 round conversations
  - Real-time streaming
  - Vote for winner
  - Mobile-friendly UI

### Model Comparison
- **Side-by-Side** - Compare model responses
  - Same prompt to multiple models
  - Visual comparison
  - Mobile navigation

### Security & Stability
- **API Key Protection** - Critical fixes
  - Prevent keys from being cleared
  - Bulletproof updateSettings
  - PWA mode protection
  - Files: `contexts/app-context.tsx`
- **Search Provider Visibility** - Show which API is used

---

## [0.2.0-alpha] - 2025-11-05

### PWA & Mobile
- **Mobile-First UI** - WhatsApp-style experience
  - Bottom navigation (5 buttons)
  - Settings in mobile nav
  - Compact layout
- **PWA Icons** - Chameleon logo branding
- **Glassmorphism UI** - Premium visual effects
  - Backdrop blur
  - Smooth animations
  - Modern aesthetics

### Security
- **Content Security Policy** - HTTP headers
  - Strict CSP rules
  - Rate limiting preparation
- **Supabase Integration** - NULL value handling
  - Prevent key overwrites
  - Proper merge logic

### Bug Fixes
- Fixed personas and default system prompt
- Fixed FOLLOWUP format parsing
- Translated German UI text to English
- Fixed login page layout
- Fixed footer link accessibility

---

## [0.1.0-alpha] - 2025-11-01

### Initial Release
- **Core Chat** - Basic chat functionality
  - Message streaming
  - OpenRouter integration
  - Multiple model support
- **Personas** - 18+ AI personalities
  - Cami, Nova, Dev, Professor, etc.
  - Unique system prompts
  - Communication styles
- **Cost Tracking** - LLM spending analytics
  - Per-model breakdown
  - Token counting
  - Monthly projections
- **Training Data Export** - JSONL/JSON export
  - Fine-tuning format
  - Conversation selection
- **Web Search** - Tavily & Serper integration
  - Real-time search
  - Citation support
- **File Upload** - Document handling
  - Text, image, PDF support
  - Drag & drop
- **Authentication** - Supabase auth
  - Email/password
  - Profile system
- **Themes** - Dark/Light mode
- **Languages** - DE/EN/ES support

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.8.0-alpha | 2025-12-03 | Streaming visualization, unified settings, new logo, GitHub release |
| 0.7.0-alpha | 2025-11-26 | Message editing, full-text search, AI titles, PWA stability |
| 0.6.0-alpha | 2025-11-24 | Context window meter, pet companion, performance mode |
| 0.5.0-alpha | 2025-11-20 | Simple Mode, TTS, gamification, PWA enhancements |
| 0.4.0-alpha | 2025-11-15 | UI refresh, new personas, Grok 4.1, reasoning display |
| 0.3.0-alpha | 2025-11-10 | Memory system, discussion mode, model comparison |
| 0.2.0-alpha | 2025-11-05 | PWA, mobile UI, security fixes, glassmorphism |
| 0.1.0-alpha | 2025-11-01 | Initial release with core features |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this project.

## License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">

**[View Full Documentation](docs/)**

</div>
