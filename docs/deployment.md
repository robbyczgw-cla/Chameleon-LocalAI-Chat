# 🚀 Deployment Guide

How to deploy Chameleon Chat to production.

---

## Vercel (Recommended) ⚡

### Why Vercel?

- **Zero-config** deployment
- Built by Next.js team
- **Edge runtime** support (crucial for our API routes)
- Free SSL/HTTPS
- Preview deployments for PRs
- Free tier: Perfect for side projects

### Deploy to Vercel

**1. Connect Repository**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

**2. Set Environment Variables**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: your-anon-key

vercel env add NEXT_PUBLIC_OPENROUTER_API_KEY
# Paste: sk-or-v1-...

# Optional: Search providers
vercel env add NEXT_PUBLIC_TAVILY_API_KEY
vercel env add NEXT_PUBLIC_SERPER_API_KEY
```

**3. Deploy**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Automatic Deployments

**Setup GitHub integration:**

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel auto-detects Next.js
4. Add environment variables in dashboard
5. Deploy!

**Now:**
- Push to `main` → Auto-deploy to production
- Open PR → Auto-deploy preview
- Commit to branch → Preview deployment

---

## Self-Hosted (Advanced) 🖥️

### Requirements

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+ (or Supabase)
- **HTTPS** certificate (Let's Encrypt)
- **PM2** or similar process manager

### Build for Production

```bash
# Install dependencies
npm install

# Build Next.js app
npm run build

# Output: .next/ directory
```

### Run Production Server

**Using Node.js:**
```bash
NODE_ENV=production npm start
# Runs on http://localhost:3000
```

**Using PM2 (recommended):**
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "chameleon-chat" -- start

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Proxy to Next.js (Chameleon Chat)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Streaming support
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
```

**Enable config:**
```bash
sudo ln -s /etc/nginx/sites-available/chameleon-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

---

## Railway 🚂

**1. Install Railway CLI:**
```bash
npm i -g @railway/cli
railway login
```

**2. Initialize project:**
```bash
railway init
```

**3. Add environment variables:**
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**4. Deploy:**
```bash
railway up
```

---

## Netlify 🌐

**1. Build settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`

**2. Add environment variables** in dashboard

**3. Deploy:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Note:** Netlify requires Next.js adapter for full support.

---

## Environment Variables

### Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (for AI models)
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
```

### Optional

```env
# Web search (choose one or both)
NEXT_PUBLIC_TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_SERPER_API_KEY=...

# Analytics (future)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry (error tracking)
SENTRY_DSN=https://...
```

---

## Post-Deployment Checklist

### 1. Database Setup

**Run migrations:**
```bash
# In Supabase dashboard
# SQL Editor → Run scripts in order (001-023)
```

**Enable RLS:**
- All tables should have RLS enabled
- Check policies are active

**Verify auth:**
- Test signup/login
- Check profile auto-creation trigger

### 2. Test Core Features

- [ ] Sign up new account
- [ ] Create chat
- [ ] Send message (should stream)
- [ ] Change persona
- [ ] Toggle themes
- [ ] Web search (if API keys set)
- [ ] AI Debate mode
- [ ] Cost tracker
- [ ] Export training data

### 3. Performance Check

```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --view

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+
```

### 4. Security Review

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables not exposed
- [ ] RLS policies active
- [ ] CORS configured correctly
- [ ] CSP headers set (next.config.js)
- [ ] Rate limiting enabled (future)

### 5. Monitoring

**Vercel Analytics:**
- Automatically enabled on Vercel
- View in dashboard

**Supabase Logs:**
- Database → Logs
- Monitor slow queries

**Error tracking:**
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure sentry.client.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Domain Configuration

### Custom Domain (Vercel)

1. Go to project settings
2. Domains → Add Domain
3. Enter: `your-domain.com`
4. Add DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. Wait for propagation (~5 minutes)

### Custom Domain (Self-Hosted)

1. Point A record to your server IP
2. Configure Nginx (see above)
3. Get SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## Scaling Considerations

### Current Architecture

- **Edge functions** (global CDN)
- **Supabase** (handles up to 50k concurrent connections)
- **OpenRouter** (no rate limits on most models)

**Can handle:**
- 10,000+ users
- 100,000+ messages/day
- 1,000+ concurrent chats

### When to Scale

**Vertical scaling:**
- Upgrade Supabase plan (more connections)
- Add read replicas
- Enable connection pooling

**Horizontal scaling:**
- Multiple Next.js instances (load balancer)
- Redis cache for sessions
- Separate API servers

**Database optimization:**
- Add more indexes
- Partition large tables
- Archive old data

---

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Environment Variables Not Working

```bash
# Verify in Vercel dashboard
vercel env pull

# Or check locally
cat .env.local
```

### Streaming Not Working

- Check: Edge runtime enabled (`export const runtime = 'edge'`)
- Check: CORS headers in API routes
- Check: Proxy/CDN not buffering responses

### Database Connection Issues

- Check: Supabase project not paused
- Check: RLS policies not blocking access
- Check: Connection pooling configured

### High API Costs

- Check: Cost tracker dashboard
- Check: Users not abusing expensive models
- Consider: Model limits per user tier
- Consider: Rate limiting

---

## Backup Strategy

### Automated

- **Supabase:** Daily backups (7-day retention)
- **Vercel:** Git-based deployments (rollback anytime)

### Manual Backup

```bash
# Database
supabase db dump > backup_$(date +%Y%m%d).sql

# Code
git push --all origin

# User data
# Export from Supabase dashboard
```

### Disaster Recovery

1. **Code:** Redeploy from Git
2. **Database:** Restore from Supabase backup
3. **Environment:** Reconfigure variables
4. **DNS:** Point to new deployment

**Recovery Time Objective (RTO):** < 1 hour

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check API usage/costs
- Monitor performance metrics

**Monthly:**
- Update dependencies (`npm update`)
- Review database size
- Clean up old archived chats (optional)

**Quarterly:**
- Audit security (dependencies, RLS)
- Performance optimization
- Feature usage analytics

### Updates

```bash
# Update Next.js
npm install next@latest react@latest react-dom@latest

# Update all dependencies
npm update

# Check for breaking changes
npm outdated

# Test locally
npm run dev

# Deploy
vercel --prod
```

---

**🎉 Your app is now live! Monitor, maintain, and iterate!**
