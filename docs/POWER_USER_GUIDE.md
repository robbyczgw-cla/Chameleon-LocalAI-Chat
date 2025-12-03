# ⚡ Chameleon AI Chat - Power User Guide

Welcome, power user! This guide reveals the advanced features, hidden shortcuts, and optimization techniques that make Chameleon a professional-grade AI interface.

## Table of Contents

1. [Quick Start for Power Users](#quick-start-for-power-users)
2. [Advanced Chat Features](#advanced-chat-features)
3. [Persona Mastery](#persona-mastery)
4. [Memory System Deep Dive](#memory-system-deep-dive)
5. [Model Comparison Techniques](#model-comparison-techniques)
6. [AI Discussion Mode](#ai-discussion-mode)
7. [RAG & Document Intelligence](#rag--document-intelligence)
8. [Voice & Multimodal Input](#voice--multimodal-input)
9. [Prompt Engineering Helpers](#prompt-engineering-helpers)
10. [Cost Optimization Strategies](#cost-optimization-strategies)
11. [Keyboard Shortcuts (Current)](#keyboard-shortcuts-current)
12. [API Integration](#api-integration)
13. [Privacy & Security](#privacy--security)
14. [Performance Tuning](#performance-tuning)
15. [Tips & Tricks](#tips--tricks)

---

## Quick Start for Power Users

### Essential Settings

1. **Get your API keys**:
   - OpenRouter (required): https://openrouter.ai/keys
   - Tavily (optional, web search): https://tavily.com
   - Serper (optional, Google search): https://serper.dev
   - OpenAI (optional, Whisper voice): https://platform.openai.com/api-keys

2. **Configure settings** → Advanced Settings:
   ```
   Temperature: 0.7 (balanced) | 0.2 (precise) | 1.0 (creative)
   Max Tokens: 16000+ (for long responses)
   Top P: 1.0 (default)
   Frequency Penalty: 0.0-0.5 (reduce repetition)
   Presence Penalty: 0.0-0.5 (encourage new topics)
   ```

3. **Enable power features**:
   - ✅ Memory System (Settings → Memory)
   - ✅ Detailed Stats (shows tokens, cost, performance)
   - ✅ Keyboard Shortcuts (coming soon)
   - ✅ Prompt Inspector

---

## Advanced Chat Features

### 1. Streaming Responses

**What**: See AI responses word-by-word as they're generated.

**Why**: Faster perceived latency, can stop mid-response if needed.

**How**: Automatic! All responses stream by default.

**Tip**: Watch for the "⏸️ Stop" button while generating - click to cancel mid-stream.

---

### 2. Message Regeneration

**What**: Regenerate the last AI response with different parameters.

**How**:
1. Hover over any AI message
2. Click the "↻ Regenerate" button
3. AI generates a new response

**Use cases**:
- Got a boring response? Regenerate for a better one.
- Testing different models (change model before regenerating)
- Trying different temperatures

---

### 3. Message Editing

**What**: Edit your previous messages and regenerate from that point.

**How**:
1. Hover over your message
2. Click "✏️ Edit"
3. Modify text
4. Press Enter

**Use cases**:
- Fix typos without restarting conversation
- Refine your prompt mid-conversation
- Experiment with different phrasing

---

### 4. Conversation Branching

**What**: Explore alternate conversation paths from any message.

**How**:
1. Click on any message in history
2. "Branch from here" option appears
3. Creates new conversation path
4. Switch between branches anytime

**Use cases**:
- Test different approaches without losing original
- Explore multiple solutions simultaneously
- Save different versions of creative work

---

### 5. Web Search Integration

**What**: Inject real-time web search results into AI context.

**Providers**:
- **Tavily** - AI-optimized search, best for research
- **Serper** - Google Search API, best for fresh data
- **Exa** - Semantic search via OpenRouter `:online`

**How**:
1. Click "🌐 Web Search" button in chat input
2. Or prepend message with `/search`
3. AI receives search results + answers question

**Advanced**:
```
Settings → Search Provider → Tavily
  - Search Depth: "advanced" (more thorough)
  - Max Results: 10 (more context)
  - Include Images: true
  - Include Answer: true (Tavily's AI summary)
  - Domain Filters: Include/exclude specific sites
```

**Use cases**:
- Current events ("What happened in the news today?")
- Research ("Find papers on quantum computing")
- Fact-checking ("Verify this claim: ...")

---

## Persona Mastery

### Understanding Personas

Each persona has:
- **System Prompt**: Instructions that define personality
- **Theme**: Visual styling
- **Memory Context**: Persona-specific memories
- **Conversation Style**: Tone, verbosity, formatting

### Built-in Personas

| Persona | Best For | Model Recommendation |
|---------|----------|---------------------|
| **Cami** (Default) | General tasks, adaptive conversations | Claude Sonnet, Grok 4 |
| **Expert** | In-depth technical explanations | Claude Opus, GPT-4 Turbo |
| **Coder** | Programming, debugging, code review | Claude Sonnet, GPT-4, Grok 4 |
| **Concise** | Quick answers, no fluff | Grok 4 Fast, Claude Haiku |
| **Creative** | Brainstorming, ideation | GPT-4, Claude Opus |
| **Teacher** | Learning new concepts (ELI5 style) | GPT-4, Claude Sonnet |
| **Nova** | Cyberpunk vibe, tech discussions | Grok 4, Llama 3.3 |
| **Mythos** | Storytelling, world-building | Claude Opus, GPT-4 |
| **Cogito** | Philosophy, existential questions | Claude Opus |
| **Nihilo** | Philosophical nihilism with humor | Grok 4, Claude Sonnet |

### Persona Switching Strategies

**Tactic 1: Persona Chaining**
```
1. Start with Cami (research a topic)
2. Switch to Expert (deep dive)
3. Switch to Concise (summarize findings)
```

**Tactic 2: Dual Persona Comparison**
```
1. Ask Expert: "Explain quantum computing"
2. Switch chat, ask Teacher: "Explain quantum computing"
3. Compare explanations
```

**Tactic 3: Creative Personas for Brainstorming**
```
1. Creative: Generate 10 ideas
2. Cogito: Philosophically evaluate ideas
3. Expert: Technical feasibility analysis
4. Cami: Synthesize final recommendation
```

---

## Memory System Deep Dive

### How It Works

The memory system maintains **long-term context** across conversations without burning tokens.

**Memory Types**:
- **Preference**: User likes/dislikes ("User prefers Python over JavaScript")
- **Fact**: Factual info ("User works as a software engineer at XYZ Corp")
- **Context**: Background info ("User is building a SaaS product")
- **Skill**: User abilities ("User knows React, TypeScript, Go")
- **Goal**: User objectives ("User wants to learn machine learning")

**Importance Levels**:
- **1 (Low)**: Background info, rarely relevant
- **2 (Medium)**: Frequently relevant context
- **3 (High)**: Critical information, always include

### Enabling Memory

1. Settings → Memory System
2. Enable: ✅
3. Configure:
   - Auto-extract: true (AI learns automatically)
   - Max in context: 5-10 (more = better context, higher tokens)
   - Importance threshold: 2 (only medium+ memories)

### Manual Memory Management

**Add memories**:
1. Click "🧠 Memory" button
2. "Add Memory"
3. Fill in:
   - Type: fact/preference/skill/goal/context
   - Content: "User prefers concise answers"
   - Category (optional): "communication"
   - Importance: 1-3

**Edit/Delete memories**:
- Search memories by keyword
- Filter by type/importance
- Click ✏️ to edit, 🗑️ to delete

### Memory Search

**Keyword search**: Searches content + category
**Type filter**: Show only preferences/facts/etc.
**Importance filter**: Show only high-priority memories

### Advanced: Memory Injection

Memories are automatically injected into system prompts:

```xml
<user_memory>
Preferences: User prefers concise answers; User likes dark mode
Facts: User is a software engineer; User knows Python, JavaScript
Skills: User is proficient in React, TypeScript
Goals: User wants to learn Rust
</user_memory>
```

**Customization**:
- Memories are retrieved via **keyword matching + importance scoring + recency**
- Top N memories (configured in settings) are included
- Access count tracks which memories are most useful

**Pro tip**: Manually create high-importance memories for critical context that should *always* be included.

---

## Model Comparison Techniques

### The Feature

Run the **same prompt** through 2-4 different models simultaneously and compare responses.

**Use cases**:
- Quality comparison (which model gives better answers?)
- Speed comparison (which is fastest?)
- Cost comparison (which is cheapest for this task?)
- Consensus-building (what do multiple models agree on?)

### How to Use

1. Click "⚡ Model Comparison" button
2. Select 2-4 models (recommended combinations below)
3. Choose layout: 2-column, 3-column, or 4-column
4. Type prompt once, send to all models

**Recommended Combos**:

**Quality vs Speed**:
- Claude Sonnet 3.5 (quality)
- Grok 4 Fast (speed)
- GPT-4 Turbo (balance)

**Best of Class**:
- Claude Opus (Anthropic best)
- GPT-4 Turbo (OpenAI best)
- Grok 4 (X.AI best)
- Llama 3.3 70B (Meta best)

**Cost Optimization**:
- Grok 4 Fast ($0.10/M tokens)
- Claude Haiku ($0.25/M tokens)
- GPT-3.5 Turbo ($0.50/M tokens)
- GPT-4 Turbo ($10/M tokens)

### Advanced Features

**Independent Threads**: Each model has its own conversation thread - can continue chatting per-model.

**Shared Input**: Type once, send to all models with one click.

**Performance Stats**:
- Tokens/second (throughput)
- Time to first token (TTFT / latency)
- Total cost
- Total tokens

**History**: Save comparison sessions for later reference.

---

## AI Discussion Mode

### What It Does

Two AI models discuss a topic and share their **genuine perspectives** (not forced debate).

**Before (Old Debate Mode)**:
- Model 1: ALWAYS argues FOR
- Model 2: ALWAYS argues AGAINST
- Predictable, artificial

**After (Discussion Mode)**:
- Model 1: Shares authentic opinion
- Model 2: Shares authentic opinion (can agree/disagree/be nuanced)
- Judge: Evaluates authenticity and insight, not "winning"

### How to Use

1. Click "🗣️ AI Discussion"
2. Choose topic category: Philosophy / Tech / Science / Society / Custom
   - Or type custom topic
3. Select discussion style:
   - **Freestyle**: Casual, free-flowing
   - **Oxford**: Formal, structured
   - **Socratic**: Question-driven exploration
4. Select 2 models (different models = different perspectives)
5. Optional: Select judge model
6. Click "Start Discussion"

### Strategy Guide

**For genuine disagreement**:
- Use models from different families (Claude vs Grok vs GPT)
- Choose philosophical topics
- Expect nuanced, thoughtful discussion

**For technical analysis**:
- Use same model family with different sizes (GPT-4 vs GPT-4 Turbo)
- Tech/science topics
- Compare depth vs efficiency

**For creative exploration**:
- Use creative models (Claude Opus, GPT-4)
- Society/philosophy topics
- Get diverse perspectives

### Example Topics

**Philosophy**:
- "Is free will an illusion?"
- "What is the meaning of life?"
- "Should AI have rights?"

**Tech**:
- "Is blockchain technology overhyped?"
- "Will AGI be achieved in our lifetime?"
- "Vim vs Emacs"

**Science**:
- "Many-worlds vs Copenhagen interpretation of quantum mechanics"
- "Is consciousness emergent or fundamental?"

**Society**:
- "Universal Basic Income: pros and cons"
- "Remote work vs office work"

### Judge Configuration

**Judge Model**: Should be high-quality (Claude Opus, GPT-4 Turbo)

**Scoring Criteria**:
- **Authenticity**: How genuine is the perspective?
- **Depth**: How thoughtful and detailed?
- **Engagement**: How well does it engage with the other model's points?
- **Insight**: Any novel ideas or perspectives?

**Pro tip**: Use the same model for both discussants to see how much variation exists within a single model!

---

## RAG & Document Intelligence

### What is RAG?

**Retrieval Augmented Generation**: Upload documents → AI searches them → Provides answers grounded in your docs.

**Use cases**:
- Research papers: "Summarize findings on topic X"
- Codebase docs: "How do I implement feature Y?"
- User manuals: "How to configure Z?"
- Meeting notes: "What was decided about the budget?"

### Setting Up RAG

1. Click "📁 Documents" button
2. "Create Collection"
3. Name it (e.g., "Research Papers", "Project Docs")
4. Upload files:
   - PDF
   - TXT
   - Markdown (.md)
   - JSON
   - Images (with vision models)

### How It Works

```
1. Upload PDF → Text extracted
2. Text chunked (500-token segments)
3. Each chunk embedded (vector representation)
4. Stored in IndexedDB (client-side)

When you ask a question:
5. Question embedded
6. Cosine similarity search
7. Top 5 most relevant chunks retrieved
8. Injected into AI prompt
9. AI answers using your documents
```

### Best Practices

**Document Preparation**:
- Clean, well-formatted documents work best
- OCR scanned PDFs before uploading
- Break huge documents into sections

**Query Techniques**:
- Be specific: "What does the paper say about X?" ✅
- Not: "Tell me about the paper" ❌
- Use technical terms from the document

**Model Selection**:
- Use **large context models** (Claude Opus, GPT-4 Turbo, Gemini Pro)
- They can handle more retrieved chunks
- Better at synthesizing information

### Advanced: Custom Embedding Models

By default, Chameleon uses OpenRouter's embedding API.

**Future**: Support for local embeddings (sentence-transformers) for privacy.

---

## Voice & Multimodal Input

### Voice Input (Whisper)

**What**: Speak instead of type. Uses OpenAI Whisper for transcription.

**Setup**:
1. Add OpenAI API key (Settings → API Keys)
2. Click 🎤 microphone button
3. Grant browser permission
4. Speak
5. Click Stop
6. Transcription appears in input box

**Tips**:
- Speak clearly and at moderate pace
- Works in 50+ languages
- Transcription is very accurate
- Works on mobile PWA too!

**Troubleshooting**:
- **Permission denied (Android PWA)**: Go to Chrome → ⋮ Menu → Site Settings → Microphone → Allow
- **Permission denied (Desktop)**: Click 🔒 in address bar → Site Settings → Microphone

### Voice Output (TTS)

**What**: AI reads responses aloud.

**How**:
1. Click 🔊 speaker button on any message
2. Uses browser's built-in Text-to-Speech

**Customization** (Settings → Voice):
- Voice: Select from browser voices
- Rate: 0.1-10 (1.0 = normal speed)
- Pitch: 0-2 (1.0 = normal pitch)

**Pro tip**: Different browsers have different voices. Chrome has Google voices, Safari has Siri voices.

### Multimodal Input (Vision)

**What**: Send images + text prompts to vision-capable models.

**Supported models**:
- GPT-4 Turbo Vision
- Claude 3.5 Sonnet
- Gemini Pro Vision
- Grok 2 Vision

**How**:
1. Click 📎 attachment button
2. Select image (JPG, PNG, WebP)
3. Type question about the image
4. Send

**Use cases**:
- "Describe this screenshot"
- "What's in this photo?"
- "Explain this diagram"
- "Find the bug in this code screenshot"
- "What does this chart show?"

**Pro tip**: Use vision models for debugging UI issues - send screenshot, ask "what's wrong?"

---

## Prompt Engineering Helpers

### Prompt Inspector

**What**: See the *exact* prompt sent to the AI, including:
- System prompt
- Persona instructions
- Memory context
- RAG chunks
- Conversation history

**How**:
1. After receiving a response, click "🔍 Inspect Prompt"
2. See full prompt in modal

**Use cases**:
- Debug why AI responded unexpectedly
- Learn how to write better prompts
- See how persona/memory affects output

### Prompt Templates

**What**: Save and reuse common prompts.

**How**:
1. Settings → Prompt Templates
2. Click "Add Template"
3. Fill in:
   - Name: "Code Review"
   - Category: "Development"
   - Content: "Review this code for bugs, performance issues, and best practices:\n\n{CODE}"
   - Variables: ["CODE"]

**Using templates**:
1. Type `/` in chat input
2. Select template
3. Fill in variables
4. Send

**Built-in templates**:
- Code review
- Explain like I'm 5
- Summarize
- Translate
- Debug error
- Write tests

**Pro tip**: Create templates for your most common workflows!

---

## Cost Optimization Strategies

### Understanding Costs

OpenRouter charges per million tokens:
- **Input tokens**: Your prompts
- **Output tokens**: AI responses

**Pricing tiers** (approximate):
- **Ultra cheap**: $0.10-0.50/M tokens (Grok 4 Fast, Claude Haiku)
- **Cheap**: $0.50-2/M tokens (GPT-3.5, Llama 3.3)
- **Mid**: $2-5/M tokens (GPT-4o mini, Claude Sonnet)
- **Premium**: $5-15/M tokens (GPT-4 Turbo, Claude Opus)

### Cost Tracking

Chameleon tracks cost automatically:
1. Settings → Show Detailed Stats: ✅
2. Every message shows:
   - Tokens used (prompt + completion)
   - Estimated cost in USD
   - Tokens/second
   - Time to first token

**View analytics**:
- Click "📊 Statistics" button
- See:
  - Total cost (all time, this week, today)
  - Cost by model
  - Token usage over time

### Cost Optimization Techniques

**1. Use Cheap Models for Simple Tasks**

| Task | Model | Cost |
|------|-------|------|
| Quick questions | Grok 4 Fast | $0.10/M |
| Summarization | Claude Haiku | $0.25/M |
| Code completion | GPT-3.5 Turbo | $0.50/M |

**2. Use Expensive Models for Complex Tasks**

| Task | Model | Cost |
|------|-------|------|
| Creative writing | Claude Opus | $15/M |
| Code review | GPT-4 Turbo | $10/M |
| Research | Claude Sonnet | $3/M |

**3. Optimize Prompt Length**

- **Remove unnecessary context**: Don't include whole conversation if not needed
- **Disable memory** for one-off questions
- **Disable RAG** when not needed
- **Limit max tokens**: Set to 1000 for short answers instead of 16000

**4. Use Model Comparison Wisely**

Running 4 models = 4x cost. Only use when comparing is necessary.

**5. Leverage Free Tier Models**

Some models on OpenRouter have free tiers:
- Meta Llama 3.3 70B (free, rate-limited)
- Google Gemini 2.0 Flash (free, rate-limited)

**6. Batch Requests**

Instead of:
```
Message 1: "What is X?"
Message 2: "What is Y?"
Message 3: "What is Z?"
```

Do:
```
Message 1: "Explain X, Y, and Z"
```

Saves on conversation history overhead.

---

## Keyboard Shortcuts (Current)

**Note**: Full keyboard shortcut system coming in Phase 1 (Q1 2025).

**Currently available**:
- `Ctrl/Cmd + Enter`: Send message
- `Esc`: Close dialogs
- `Ctrl/Cmd + K`: Search chats (in search dialog)

**Coming soon**:
- `Ctrl/Cmd + N`: New chat
- `Ctrl/Cmd + B`: Toggle sidebar
- `Ctrl/Cmd + P`: Persona selector
- `Ctrl/Cmd + /`: Command palette
- `Ctrl/Cmd + 1-4`: Switch modes
- `?`: Show shortcuts overlay

---

## API Integration

### OpenRouter Configuration

**Model Selection**:
- 100+ models available
- Filter by: Provider, Pricing, Context Length
- Sort by: Cost, Popularity, Context Length

**Pro models** (custom pricing):
- Some models have free tier
- Some require credits
- Check OpenRouter dashboard for limits

**Best practices**:
1. Set spending limits on OpenRouter dashboard
2. Monitor usage weekly
3. Use model fallbacks (Chameleon doesn't support this yet - future feature)

### Custom System Prompts

Override persona system prompts:

1. Settings → Advanced → System Prompt
2. Enter custom prompt:
```
You are a helpful AI assistant specializing in Rust programming.
Always provide code examples and explain memory safety concepts.
Be concise but thorough.
```

3. This overrides all persona prompts

**Pro tip**: Create persona-specific custom prompts by switching persona, then modifying system prompt.

---

## Privacy & Security

### Where Your Data Lives

**Client-side (Your Browser)**:
- Conversations (localStorage)
- API keys (localStorage, encrypted)
- RAG embeddings (IndexedDB)
- Settings (localStorage)

**Server-side (Supabase)**:
- User account (email, password hash)
- Conversations (backed up)
- Settings (synced)
- API keys (encrypted with AES-256)

**Not stored**:
- Your prompts are NOT sent to Chameleon servers
- Your prompts go directly from browser → OpenRouter → AI provider
- No logging, no analytics, no tracking

### API Key Security

**Triple-layer protection**:
1. **Client-side protection**: Prevents accidental clearing
2. **Server-side preservation**: Database fetch before save
3. **Database RLS**: Row-level security (you can only access your own keys)

**Best practices**:
- Use OpenRouter keys (not direct API keys) - single point of control
- Set spending limits on OpenRouter
- Rotate keys periodically
- Never share keys in screenshots or screen recordings

### Data Export

**Export all data**:
1. Settings → Export Data
2. Downloads JSON file with:
   - All conversations
   - All settings
   - All memories
   - (Does NOT include API keys)

**Import data**:
1. Settings → Import Data
2. Select exported JSON file

---

## Performance Tuning

### Browser Performance

**Best browsers** (in order):
1. Chrome/Edge (Chromium) - Best WebAssembly, IndexedDB performance
2. Safari - Good, but slower IndexedDB
3. Firefox - Good, but some PWA limitations

**Optimization**:
- Enable hardware acceleration (browser settings)
- Close unused tabs (each Chameleon tab uses ~100MB RAM)
- Clear browser cache monthly

### PWA (Progressive Web App)

**Install as app**:
- **Desktop**: Click browser address bar → "Install Chameleon AI Chat"
- **Mobile**: Menu → "Add to Home Screen"

**Benefits**:
- Faster startup
- Offline support (cached UI)
- Standalone window (no browser UI)
- Better mobile experience

### Network Optimization

**For slow connections**:
- Use fast models (Grok 4 Fast, Claude Haiku)
- Reduce max tokens
- Disable detailed stats
- Disable web search when not needed

**For metered connections**:
- Chameleon is lightweight (~800KB initial bundle)
- Streaming responses are efficient (delta encoding)
- Images/PDFs are the largest data transfer

---

## Tips & Tricks

### 1. Use Different Chats for Different Topics

Don't mix work and personal in one chat. Create separate chats:
- Work - Project Alpha
- Personal - Creative Writing
- Learning - Rust Tutorial
- Debug - Bug Investigation

**Why**: Keeps context clean, easier to find conversations later.

---

### 2. Pin Important Chats

Hover over chat in sidebar → Click 📌 pin icon

Pinned chats stay at the top.

---

### 3. Organize with Folders

1. Click "📁 New Folder"
2. Name it (e.g., "Work", "Learning", "Projects")
3. Drag chats into folders

---

### 4. Use Search to Find Old Conversations

1. Click "🔍 Search Chats"
2. Type keyword
3. Filters by:
   - Chat title
   - Message content
   - Model used

---

### 5. Experiment with Temperature

**Temperature = creativity/randomness**

- **0.0-0.3**: Deterministic, factual, consistent (coding, math, technical)
- **0.4-0.7**: Balanced (general conversation)
- **0.8-1.0**: Creative, varied (writing, brainstorming)
- **1.0+**: Very creative, sometimes nonsensical

**Try this**:
1. Ask the same question 5 times at temp=0.2 → Nearly identical answers
2. Ask the same question 5 times at temp=1.0 → Very different answers

---

### 6. Use Frequency/Presence Penalty

**Frequency Penalty** (0.0-2.0):
- Reduces repetition of specific words
- Higher = less repetition
- Use for: Creative writing, avoiding redundancy

**Presence Penalty** (0.0-2.0):
- Encourages discussing new topics
- Higher = more topic diversity
- Use for: Brainstorming, idea generation

---

### 7. Compare Model Families

Different AI companies have different strengths:

| Company | Strengths |
|---------|-----------|
| **Anthropic (Claude)** | Nuanced, thoughtful, long-context, code |
| **OpenAI (GPT)** | Creative, general-purpose, multimodal |
| **X.AI (Grok)** | Fast, efficient, up-to-date (real-time training) |
| **Meta (Llama)** | Open-source, good for code, cheap |
| **Google (Gemini)** | Multimodal, fast, large context |

**Pro tip**: Run model comparison with 1 model from each company to see different "thinking styles."

---

### 8. Create a "Scratch Chat"

Create a chat called "Scratch" or "Test" for:
- Testing prompts
- Experimenting with models
- One-off questions
- Quick calculations

Delete it when full.

---

### 9. Use Prompt Inspector to Learn

After every interesting response:
1. Click "🔍 Inspect Prompt"
2. See how Chameleon constructed the prompt
3. Learn prompt engineering by example

---

### 10. Leverage Conversation History

AI can see entire conversation. Use this:

**Instead of**:
```
User: What is React?
AI: [explains React]
User: What are React hooks?
AI: [explains hooks]
User: Give me an example of useState
```

**Do this**:
```
User: What is React?
AI: [explains React]
User: Explain hooks in that framework
AI: [explains hooks, references React from earlier]
User: Give me an example of the state hook
AI: [gives useState example]
```

**Why**: More natural, uses context, saves tokens.

---

### 11. Clear Context When Switching Topics

If conversation drifts, start new chat. Don't confuse AI with mixed context.

**Bad**:
```
[Long conversation about Python]
User: Now let's talk about cars
[AI confused, still thinks about Python analogies]
```

**Good**:
```
[Long conversation about Python]
[Start new chat]
User: Let's talk about cars
[Clean context]
```

---

### 12. Use Different Models in Same Conversation

1. Ask question with GPT-4 Turbo (deep analysis)
2. Switch to Grok 4 Fast
3. Ask "Summarize the above in 3 bullets"

Mix and match models based on task.

---

### 13. Memory System as Your "Second Brain"

Instead of searching old chats, use memories:

1. After learning something important, click "🧠 Memory"
2. Add memory: "User learned that React hooks can't be called conditionally"
3. Later, AI automatically remembers this across ALL chats

---

### 14. Use RAG for Personal Knowledge Base

Upload:
- Meeting notes
- Research papers
- Code documentation
- Recipes
- Anything you reference often

Ask questions naturally: "What did we decide about the API redesign?"

---

### 15. Mobile Power User Tips

**On mobile PWA**:
- Install as app for better experience
- Use voice input (faster than typing)
- Swipe to delete messages
- Long-press for message options
- Use mobile-optimized 2-column model comparison

---

## Conclusion

Chameleon is built for **you** - the power user who demands:
- Control over every parameter
- Transparency into AI behavior
- Cost efficiency
- Privacy and data ownership
- Professional-grade features

Keep exploring. Keep adapting. Like a chameleon.

---

**Questions? Feedback? Feature requests?**

GitHub: https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat/issues

**Happy chatting!** 🦎
