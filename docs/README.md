# 📚 Chameleon AI Chat - Documentation

Welcome to the Chameleon AI Chat documentation! This directory contains comprehensive guides for users, developers, and contributors.

## 🏠 Local-First Architecture

**Chameleon is a 100% local-first, privacy-focused AI chat app:**

- **SQLite Database**: All your data stored locally in `chameleon.db`
- **LM Studio Integration**: Run AI models locally on your Mac (Apple Silicon optimized)
- **OpenRouter Fallback**: Optional cloud models when you need more power
- **No Cloud Required**: Works completely offline with local models
- **Your Data, Your Control**: No telemetry, no cloud sync, no accounts needed

## 📖 Table of Contents

### For Users

1. **[POWER_USER_GUIDE.md](./POWER_USER_GUIDE.md)** ⚡
   - Quick start guide
   - LM Studio setup
   - Advanced features
   - Keyboard shortcuts
   - Cost optimization
   - Tips & tricks
   - **Start here if you want to master Chameleon!**

### For Developers

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** 🏗️
   - Local-first architecture
   - SQLite database schema
   - LM Studio integration
   - Technology stack
   - Directory structure
   - Core systems explained
   - Performance optimizations
   - **Read this to understand how Chameleon works**

### For Dreamers

3. **[CHAMELEON_VISION.md](./CHAMELEON_VISION.md)** 🦎
   - Origin story
   - Privacy-first philosophy
   - Design principles
   - Why local-first?
   - **Read this to understand the soul of Chameleon**

---

## Quick Navigation

### I want to...

**...learn how to use Chameleon like a pro**
→ [POWER_USER_GUIDE.md](./POWER_USER_GUIDE.md)

**...understand the codebase**
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

**...contribute a new feature**
→ [CONTRIBUTING.md](../CONTRIBUTING.md)

**...understand the vision**
→ [CHAMELEON_VISION.md](./CHAMELEON_VISION.md)

---

## Recent Updates

### 2025-12-01

✅ **Streaming Visualization System**
- Added streaming phase indicators (thinking, searching, reasoning, generating)
- Visual feedback for AI response generation
- Local-first compatible (works with LM Studio and OpenRouter)

✅ **Dialog Viewport Safety**
- Portal to document.body for proper z-index layering
- Viewport-safe height caps (no more cut-off dialogs)
- Nested dialog support with proper z-index hierarchy

✅ **Performance & UX Fixes**
- Removed deprecated background agents feature
- Improved chat layout and message display
- Better vision model handling

### 2025-11-19

✅ **Local-First Architecture**
- SQLite database for all persistent data
- LM Studio integration for local AI models
- Works completely offline
- All data stays on your machine

✅ **Comprehensive Documentation Created**
- Updated for local-first architecture
- LM Studio setup guides
- SQLite database schema

---

## Documentation Standards

When contributing documentation:

1. **Use clear headings**: H2 for major sections, H3 for subsections
2. **Include code examples**: Always show, don't just tell
3. **Add use cases**: Explain *why*, not just *how*
4. **Keep it updated**: When you change code, update docs
5. **Be beginner-friendly**: Don't assume knowledge
6. **Add Table of Contents**: For documents >500 lines

---

## File Sizes

| Document | Lines | Topics Covered |
|----------|-------|----------------|
| POWER_USER_GUIDE.md | ~800 | User features, tips, shortcuts |
| ARCHITECTURE.md | ~800 | Technical details, schema, systems |
| CHAMELEON_VISION.md | ~400 | Philosophy, origin story |

---

## Contributing to Docs

Found an error? Have a suggestion? Want to add a guide?

1. Fork the repository
2. Edit the relevant `.md` file in `docs/`
3. Submit a pull request
4. Tag with `documentation` label

---

## External Resources

- **Main README**: [../README.md](../README.md)
- **LM Studio**: https://lmstudio.ai/ (local AI models)
- **OpenRouter Docs**: https://openrouter.ai/docs (cloud models)
- **MCP Protocol**: https://modelcontextprotocol.io/

---

## License

All documentation is MIT licensed, same as the code.

**You are free to**:
- Copy and redistribute
- Remix, transform, and build upon
- Use for commercial purposes

**Under the condition that**:
- You provide attribution
- You include the MIT license

---

**Happy learning, building, and adapting!** 🦎
