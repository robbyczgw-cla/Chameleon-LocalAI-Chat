<div align="center">

<img src="public/chameleon-logo.jpg" alt="Chameleon Chat Logo" width="280"/>

# Chameleon Chat

### *Adapt to Any Conversation*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local-green?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![LM Studio](https://img.shields.io/badge/LM%20Studio-Supported-purple?style=for-the-badge)](https://lmstudio.ai/)

**A local-first, privacy-focused AI chat application with 18+ personas, 100+ models, and zero cloud dependency.**

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

---

**100% Local • 100% Private • 100% Yours**

</div>

## Why Chameleon?

Like a chameleon adapting to its environment, this AI chat transforms to match your needs. Whether you want a coding mentor, creative writing partner, language tutor, or just a friendly conversationalist — Chameleon adapts.

<table>
<tr>
<td align="center" width="25%">

### 🔒
**Privacy First**

Your data stays on your machine. No cloud. No tracking.

</td>
<td align="center" width="25%">

### 🖥️
**Local Models**

Full LM Studio integration. Run AI offline.

</td>
<td align="center" width="25%">

### 🎭
**18+ Personas**

From developer to chef. Each with unique style.

</td>
<td align="center" width="25%">

### 💰
**Cost Tracking**

Know exactly what you spend on AI.

</td>
</tr>
</table>

---

## What Makes This Different?

This is the **Local-First Edition** - optimized for maximum privacy:

| Feature | Cloud Apps | Chameleon |
|---------|------------|-----------|
| **Database** | Cloud servers | **SQLite** (your machine) |
| **Auth** | Required login | **None** (single-user) |
| **AI Provider** | Cloud only | **Local + Cloud** |
| **Data Location** | Their servers | **Your machine** |
| **Privacy** | Trust them | **Trust yourself** |

---

## Features

### 🎭 Intelligent Personas
Choose from **18+ AI personalities**, each with unique communication styles:

<table>
<tr>
<td><strong>🦎 Cami</strong><br/>Friendly default assistant</td>
<td><strong>⭐ Nova</strong><br/>Creative storyteller</td>
<td><strong>💻 Dev</strong><br/>Expert programmer</td>
<td><strong>🎓 Professor</strong><br/>Academic mentor</td>
</tr>
<tr>
<td><strong>👨‍🍳 Chef Marco</strong><br/>Italian cuisine expert</td>
<td><strong>🧘 Zen</strong><br/>Meditation guide</td>
<td><strong>🚀 Startup Sam</strong><br/>Entrepreneur</td>
<td><strong>🎵 Aria</strong><br/>Songwriter</td>
</tr>
</table>

*...and 10+ more specialized personas!*

### 🤖 100+ AI Models
Access models from every major provider through OpenRouter:

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-5 |
| **Anthropic** | Claude 3.5, Claude 4 Sonnet/Opus |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash |
| **xAI** | Grok 4, Grok 4.1 Fast |
| **Meta** | Llama 4 Maverick/Scout |
| **Open Source** | Mixtral, Qwen, DeepSeek |
| **Local** | Any LM Studio model |

### 🖥️ Local-First Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chameleon Chat                        │
│                   (Your Browser)                         │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   LM Studio     │     │   OpenRouter    │
│   (Local AI)    │     │   (Cloud AI)    │
│  Your Machine   │     │   Optional      │
└─────────────────┘     └─────────────────┘
          │
┌─────────────────────────────────────────────────────────┐
│                   SQLite Database                        │
│               ./data/chameleon.db                        │
│                  (Your machine)                          │
└─────────────────────────────────────────────────────────┘
```

### 📊 Analytics & Tracking

- **Cost Tracker** - Per-model spending breakdown
- **Token Counter** - Real-time usage monitoring
- **Context Window Meter** - Visual token usage
- **Performance Stats** - Tokens/second, TTFT metrics
- **Streaming Visualization** - Live progress during generation

### 💡 Smart Features

| Feature | Description |
|---------|-------------|
| **AI Memory** | Long-term context persistence |
| **Message Editing** | Edit and regenerate responses |
| **Draft Auto-Save** | Never lose your work |
| **Full-Text Search** | Find anything in chats |
| **Export Options** | Markdown, JSON, HTML, Training Data |
| **Reasoning Display** | See the model's thinking |
| **Web Search** | Tavily, Serper, Exa integration |
| **Image Generation** | DALL-E 2/3 integration |
| **Voice Input/Output** | Whisper + TTS support |
| **AI Debates** | Watch two models debate topics |
| **Model Comparison** | Compare responses side-by-side |

### 🎨 Rich Content

| Feature | Description |
|---------|-------------|
| **Mermaid Diagrams** | Auto-rendered flowcharts, sequences |
| **Math Rendering** | LaTeX/KaTeX support |
| **Rich Tables** | Sortable, searchable tables |
| **Timelines** | Visual timeline displays |
| **Polls** | Interactive voting |
| **Progress Bars** | Visual progress indicators |

---

## Quick Start

### One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/robbyczgw-cla/Chameleon-LocalAI-Chat/main/scripts/install.sh | bash
```

### Manual Install

```bash
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
npm install
npm run dev
```

### Using Make

```bash
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
make install
make dev
```

### Using Docker

```bash
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
docker-compose up -d
```

Open http://localhost:3000 - **That's it!**

---

## Installation Options

| Method | Command | Best For |
|--------|---------|----------|
| **One-Line** | `curl ... \| bash` | Quickest start |
| **npm** | `npm install && npm run dev` | Development |
| **Make** | `make dev` | Power users |
| **Docker** | `docker-compose up -d` | Production/isolation |

### Prerequisites

- **Node.js** 18+ (or Docker)
- **LM Studio** (optional, for local AI)

### With LM Studio (Free Local AI)

1. Download [LM Studio](https://lmstudio.ai/)
2. Load a model (Qwen 3 8B, Llama 3.1, etc.)
3. Start the local server (port 1234)
4. Select a `local/` model in Chameleon

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed instructions.

---

## API Keys

Chameleon works with multiple providers. All keys are stored **locally** on your machine:

| Provider | Get Key | Required? |
|----------|---------|-----------|
| [LM Studio](https://lmstudio.ai/) | Free download | **Recommended** |
| [OpenRouter](https://openrouter.ai/keys) | Free signup | For cloud models |
| [Tavily](https://tavily.com/) | Free tier | For web search |
| [Serper](https://serper.dev/) | Free tier | For Google search |
| [Exa](https://exa.ai/) | Free tier | For neural search |

> **Tip**: Start with just LM Studio for completely free, offline AI!

---

## Data & Privacy

### Where is my data?

```
./data/chameleon.db  ← All your chats, settings, memories
```

**That's it.** One file. On your machine. No cloud sync. No telemetry.

### Backup

```bash
cp ./data/chameleon.db ~/backup/chameleon-$(date +%Y%m%d).db
```

### Restore

```bash
cp ~/backup/chameleon.db ./data/chameleon.db
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Installation Guide](docs/INSTALLATION.md) | Detailed setup instructions |
| [User Guide](docs/user-guide.md) | How to use all features |
| [API Reference](docs/api.md) | API endpoints and usage |
| [Architecture](docs/ARCHITECTURE.md) | System design overview |
| [Personas](docs/personas.md) | All 18+ personas explained |
| [Contributing](CONTRIBUTING.md) | How to contribute |
| [Changelog](CHANGELOG.md) | Version history |

---

## Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 16 + React 19 |
| **Language** | TypeScript 5 |
| **Database** | SQLite (better-sqlite3) |
| **Local AI** | LM Studio |
| **Cloud AI** | OpenRouter |
| **Styling** | Tailwind CSS 4.1 |
| **Components** | shadcn/ui + Radix |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [LM Studio](https://lmstudio.ai/) - Local AI inference
- [OpenRouter](https://openrouter.ai/) - Cloud AI gateway
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite for Node.js

---

<div align="center">

**[⬆ Back to Top](#chameleon-chat)**

---

<img src="public/chameleon-logo.jpg" alt="Chameleon" width="60"/>

**Your conversations. Your machine. Your control.**

Made with 🦎 love

</div>
