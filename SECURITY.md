# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Chameleon Chat, please report it responsibly:

1. **Do NOT** open a public issue
2. Create a [private security advisory](https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat/security/advisories/new)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Architecture

### Local-First Design

Chameleon Chat is designed with **maximum privacy** in mind:

| Data | Storage Location | Transmitted To |
|------|------------------|----------------|
| Chats & Messages | Local SQLite | Never |
| Settings | Local SQLite | Never |
| AI Memories | Local SQLite | Never |
| API Keys | Local SQLite | Only to their APIs |

### What We DON'T Collect

- ❌ No telemetry
- ❌ No analytics
- ❌ No crash reports
- ❌ No cloud sync
- ❌ No tracking cookies
- ❌ No user registration

## API Key Security

### How Keys Are Handled

1. **Storage**: Keys are stored in your local SQLite database (`./data/chameleon.db`)
2. **Transmission**: Keys are only sent to their respective APIs:
   - OpenRouter keys → OpenRouter API
   - Tavily keys → Tavily API
   - etc.
3. **Exposure**: Keys are never logged, never sent to our servers (we have none)

### Best Practices

#### For Users

- ✅ **DO**: Use separate API keys for development/production
- ✅ **DO**: Set spending limits on your API provider accounts
- ✅ **DO**: Rotate keys if you suspect they're compromised
- ❌ **DON'T**: Share your API keys
- ❌ **DON'T**: Commit `.env.local` to version control

#### For Developers

- ✅ **DO**: Use `.env.local` for development (gitignored)
- ✅ **DO**: Keep `.gitignore` updated
- ✅ **DO**: Run `npm audit` regularly
- ❌ **DON'T**: Commit the `data/` folder
- ❌ **DON'T**: Hardcode API keys

## Database Security

### SQLite Database Location

```
./data/chameleon.db
```

This file contains:
- All your conversations
- Settings and preferences
- AI memories
- Stored API keys

### Recommendations

1. **Backup regularly**: `cp ./data/chameleon.db ~/backup/`
2. **Don't share**: Never send this file to others
3. **Encrypt if needed**: Use disk encryption for sensitive data
4. **Gitignore**: The `data/` folder is already in `.gitignore`

## Third-Party Services

When you use external APIs, your prompts/data are sent to:

| Service | Data Sent | Privacy Policy |
|---------|-----------|----------------|
| OpenRouter | Prompts, messages | [openrouter.ai/privacy](https://openrouter.ai/privacy) |
| LM Studio | Prompts (local) | Stays on your machine |
| Tavily | Search queries | [tavily.com/privacy](https://tavily.com/privacy) |
| Serper | Search queries | [serper.dev/privacy](https://serper.dev/privacy) |
| Exa | Search queries | [exa.ai/privacy](https://exa.ai/privacy) |

### Using Local Models (Most Private)

For maximum privacy, use **LM Studio**:
- All inference happens on your machine
- No data leaves your computer
- No API keys needed
- Completely offline capable

## Network Security

### Default Configuration

- Server binds to `localhost:3000` only
- No external network access by default
- No incoming connections accepted

### If Exposing to Network

If you need to access from other devices:

```bash
# This exposes the server - use with caution
npm run dev -- -H 0.0.0.0
```

⚠️ **Warning**: Only do this on trusted networks. Consider:
- Using a VPN
- Setting up HTTPS
- Adding authentication

## Dependency Security

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Update all dependencies
npm update
```

## Secure Deployment Checklist

- [ ] `data/` folder is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in code
- [ ] Dependencies are up to date
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Database is backed up
- [ ] Using HTTPS if network-exposed

## Responsible Disclosure

We appreciate responsible disclosure and will:
- Acknowledge receipt within 48 hours
- Provide an estimated timeline for fixes
- Credit reporters (unless they prefer anonymity)
- Not take legal action against good-faith researchers

---

Thank you for helping keep Chameleon Chat secure! 🦎
