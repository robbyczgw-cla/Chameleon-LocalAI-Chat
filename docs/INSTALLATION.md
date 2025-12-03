# Installation Guide

Complete guide to setting up Chameleon Chat on your machine.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [LM Studio Setup](#lm-studio-setup)
- [API Key Configuration](#api-key-configuration)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
npm install
npm run dev
```

Open http://localhost:3000 and you're ready!

## Prerequisites

### Required

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18+ (20+ recommended) | Runtime environment |
| **npm** or **pnpm** | Latest | Package manager |
| **Git** | Latest | Version control |

### Optional

| Software | Purpose |
|----------|---------|
| **LM Studio** | Local AI model inference |
| **Docker** | Containerized deployment |

### Check Your Setup

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be v9.0.0 or higher

# Check Git
git --version
```

## Installation Methods

### Method 1: Development Mode (Recommended for Testing)

```bash
# Clone the repository
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat

# Install dependencies
npm install

# Start development server
npm run dev
```

Development server runs at http://localhost:3000 with hot reload.

### Method 2: Production Build

```bash
# Clone and install
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
npm install

# Build for production
npm run build

# Start production server
npm start
```

Production server runs at http://localhost:3000.

### Method 3: Docker

```bash
# Build image
docker build -t chameleon-chat .

# Run container
docker run -p 3000:3000 -v chameleon-data:/app/data chameleon-chat
```

The `-v` flag persists your database between container restarts.

### Method 4: Using pnpm (Faster)

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Clone and install
git clone https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat
pnpm install

# Start
pnpm dev
```

## LM Studio Setup

LM Studio enables completely free, offline AI inference.

### Step 1: Download LM Studio

1. Go to [lmstudio.ai](https://lmstudio.ai/)
2. Download for your OS (macOS, Windows, Linux)
3. Install and launch

### Step 2: Download a Model

Recommended models for different hardware:

| RAM | Recommended Model |
|-----|-------------------|
| 8GB | Qwen 2.5 3B, Phi-3 Mini |
| 16GB | Llama 3.1 8B, Mistral 7B |
| 32GB+ | Qwen 2.5 32B, Llama 3.1 70B |

In LM Studio:
1. Click "Search" or browse models
2. Select a model (e.g., "Qwen 2.5 7B Instruct")
3. Click "Download"

### Step 3: Start the Server

1. Go to the "Local Server" tab (left sidebar)
2. Select your downloaded model
3. Click "Start Server"
4. Server runs at `http://localhost:1234`

### Step 4: Use in Chameleon

1. Open Chameleon Chat
2. Click the model selector
3. Choose any model starting with `local/`
4. Your requests now go to LM Studio!

### LM Studio Tips

- **GPU Acceleration**: Enable "GPU Offload" for faster inference
- **Context Length**: Increase for longer conversations
- **Temperature**: Lower (0.1-0.3) for factual, higher (0.7-1.0) for creative

## API Key Configuration

API keys are stored locally in your browser and SQLite database.

### In-App Configuration (Recommended)

1. Open Chameleon Chat
2. Click the ⚙️ Settings icon
3. Go to "API Keys" section
4. Enter your keys

### Environment Variables (Optional)

Create `.env.local` in the project root:

```env
# Optional - Pre-fill API keys
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_SERPER_API_KEY=...

# Custom LM Studio endpoint (default: http://localhost:1234/v1)
LM_STUDIO_ENDPOINT=http://localhost:1234/v1
```

### Getting API Keys

| Provider | Sign Up | Free Tier |
|----------|---------|-----------|
| [OpenRouter](https://openrouter.ai/keys) | Google/GitHub | $1 free credit |
| [Tavily](https://tavily.com/) | Email | 1000 searches/month |
| [Serper](https://serper.dev/) | Email | 2500 searches |
| [Exa](https://exa.ai/) | Email | 1000 searches/month |

## Database Location

Your data is stored in:

```
./data/chameleon.db
```

This SQLite file contains:
- All your chats
- Settings and preferences
- AI memories
- Conversation metadata

### Backup

```bash
cp ./data/chameleon.db ~/backup/chameleon-backup.db
```

### Reset

To start fresh:
```bash
rm -rf ./data/
npm run dev  # New database created automatically
```

## Troubleshooting

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Port 3000 already in use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### LM Studio connection failed

1. Ensure LM Studio server is running (green indicator)
2. Check the endpoint: `http://localhost:1234/v1`
3. Verify CORS is enabled in LM Studio settings
4. Try restarting LM Studio

### SQLite build errors (Apple Silicon)

```bash
# If you see native module errors on M1/M2:
npm rebuild better-sqlite3
```

### Slow first load

The first load compiles all pages. Subsequent loads are much faster.

```bash
# Pre-build for faster loads
npm run build
npm start
```

### Clear cache

```bash
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

## System Requirements

### Minimum

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 500MB (app) + model size
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 20.04+

### Recommended (with local AI)

- **CPU**: 4+ cores
- **RAM**: 16GB+
- **GPU**: 6GB+ VRAM (for GPU acceleration)
- **Storage**: 20GB+ (for models)

## Next Steps

1. [User Guide](user-guide.md) - Learn all features
2. [Personas Guide](personas.md) - Explore AI personalities
3. [API Reference](api.md) - For developers

---

Need help? [Open an issue](https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat/issues)
