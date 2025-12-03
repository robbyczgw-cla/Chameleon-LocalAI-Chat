# Reasoning Modes in Chameleon AI Chat

## Overview

This document provides comprehensive information about reasoning/thinking modes across different AI models available through OpenRouter, including how to activate them, which models support them, and potential auto-activation strategies.

**Last Updated:** December 1, 2025
**DeepSeek 3.2 Release Date:** December 1, 2025

---

## Table of Contents

1. [What is Reasoning Mode?](#what-is-reasoning-mode)
2. [OpenRouter Reasoning API](#openrouter-reasoning-api)
3. [Supported Models](#supported-models)
4. [Implementation in Chameleon](#implementation-in-chameleon)
5. [How Different AI Labs Handle Reasoning](#how-different-ai-labs-handle-reasoning)
6. [Auto-Activation Research](#auto-activation-research)
7. [Technical Details](#technical-details)
8. [Best Practices](#best-practices)
9. [Future Enhancements](#future-enhancements)

---

## What is Reasoning Mode?

Reasoning mode (also called "thinking mode" or "extended reasoning") allows AI models to show their internal thought process before providing a final answer. This is particularly useful for:

- **Complex Problem Solving** - Math, logic, coding challenges
- **Step-by-Step Analysis** - Breaking down complex questions
- **Transparent Decision Making** - Understanding why the AI chose a particular answer
- **Quality Improvement** - Models often give better answers when using reasoning

### Key Characteristics

**Chain-of-Thought (CoT) Reasoning:**
- Model "thinks out loud" before answering
- Shows intermediate reasoning steps
- Can catch and correct its own mistakes
- Generally produces higher quality responses

**Visible vs Hidden Reasoning:**
- Some models stream reasoning tokens visibly
- Others use reasoning internally but don't expose it
- OpenRouter provides control over both approaches

---

## OpenRouter Reasoning API

### Modern Approach: `reasoning` Parameter Object

OpenRouter provides a unified `reasoning` parameter object that works across different model families:

```typescript
{
  "model": "deepseek/deepseek-r1",
  "messages": [...],
  "reasoning": {
    "effort": "medium",  // "low" | "medium" | "high"
    "max_tokens": 8000,  // Optional: limit reasoning tokens
    "exclude": false     // Optional: use reasoning but don't return it
  },
  "include_reasoning": true  // Required to receive reasoning tokens
}
```

### Parameter Breakdown

**1. `reasoning.effort`** (Supported by OpenAI o-series, o3-series, GPT-5, Grok)
- `"low"` - Quick reasoning, ~20-40% of max_tokens
- `"medium"` - Balanced reasoning, ~40-60% of max_tokens ⭐ **Recommended**
- `"high"` - Deep reasoning, ~60-80% of max_tokens

**2. `reasoning.max_tokens`**
- Directly specifies maximum reasoning tokens
- Useful for budget control
- Overrides effort-based allocation

**3. `reasoning.exclude`**
- `true` - Model uses reasoning internally, doesn't return it
- `false` - Returns reasoning tokens in response (default)
- Useful for improving quality without showing thinking

**4. `include_reasoning`** (CRITICAL!)
- Must be set to `true` to receive reasoning tokens
- Without this, reasoning won't be returned even if model generates it
- Works with both modern and legacy models

### Legacy Approach

For older implementations or models:
```typescript
{
  "include_reasoning": true
}
```

### Response Format

When reasoning is enabled, responses include:

```typescript
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "The final answer...",
      "reasoning": "Let me think through this step by step..."
    },
    "delta": {  // In streaming mode
      "reasoning_content": "Step 1: ..."  // Streamed reasoning
    }
  }]
}
```

---

## Supported Models

### ✅ Confirmed Reasoning Support (as of Dec 1, 2025)

#### **OpenAI o-series** (Native Reasoning)
- `openai/o1` - Full reasoning with configurable effort
- `openai/o1-mini` - Faster, lighter reasoning
- `openai/o1-preview` - Preview version
- `openai/o3-mini` - Latest mini version with reasoning

**Characteristics:**
- Supports `reasoning.effort`: low/medium/high
- Returns `reasoning_content` in streaming
- Best for complex problem-solving
- Higher cost per token

#### **DeepSeek R1 Series** (Open Source Reasoning)
- `deepseek/deepseek-r1` - Full R1 model
- `deepseek/deepseek-r1:free` - Free tier access
- `deepseek/deepseek-r1-0528` - Updated version (May 2025)
- `deepseek/deepseek-r1-0528:free` - Free updated version
- `deepseek/deepseek-reasoner` - Specialized reasoning variant
- `deepseek/deepseek-v3.2` - **NEW!** Released Dec 1, 2025 ⭐
- `deepseek/deepseek-v3.2:free` - Free tier DeepSeek 3.2

**Characteristics:**
- MIT licensed, fully open source
- 671B parameters (37B active per inference)
- Performance on par with OpenAI o1
- Fully open reasoning tokens
- Supports `include_reasoning: true`
- Excellent for distillation and research

**DeepSeek 3.2 Highlights:**
- Released December 1, 2025
- Enhanced reasoning capabilities
- Reduced hallucination rate
- Better function calling support
- Improved "vibe coding" experience

#### **Grok Series** (xAI)
- `x-ai/grok-4.1-fast` - Default model, 2M context
- `x-ai/grok-4` - Full Grok 4
- `x-ai/grok-4-fast` - Faster variant

**Characteristics:**
- Supports `reasoning.effort`: low/medium/high
- 2M token context window
- Real-time web knowledge
- Good balance of speed and quality

#### **Qwen/Alibaba Models** (Thinking Mode)
- `qwen/qwen3-235b-a22b-thinking-2507` - Large thinking model
- `qwen/qwen-2.5-coder-32b-instruct` - Coding with thinking
- `qwen/qwq-32b-preview` - Preview with thinking

**Characteristics:**
- Toggle thinking mode on/off
- Strong multilingual support
- Excellent for coding tasks

#### **Google Gemini Thinking**
- `google/gemini-2.0-flash-thinking-exp-01-21` - Experimental thinking
- `google/gemini-2.0-flash-thinking-exp` - Latest experimental

**Characteristics:**
- Fast inference with thinking
- Multimodal support
- Good for vision + reasoning tasks

#### **MoonShot Kimi**
- `moonshotai/kimi-k2-thinking` - K2 with thinking mode

**Characteristics:**
- Chinese AI lab (MoonShot)
- Strong reasoning capabilities
- Competitive pricing

### ⚠️ Partial Reasoning Support

These models support the `reasoning` parameter but don't stream reasoning separately:

- `anthropic/claude-4.5-sonnet-20250929` - Integrates thinking into response
- `anthropic/claude-opus-4.1` - Integrates thinking into response
- `google/gemini-2.5-pro` - Uses reasoning internally

**Behavior:**
- Accepts `reasoning` parameter
- Uses it to improve response quality
- Doesn't return separate `reasoning_content`
- Thinking is integrated into the main response

### ❌ No Reasoning Support (Yet)

Standard instruction-following models:
- GPT-4 Turbo, GPT-4o
- Claude 3.5 Haiku
- Llama models
- Most open-source chat models

**Behavior:**
- `reasoning` parameter is **gracefully ignored**
- No error thrown
- Operates normally as instruction-following model

---

## Implementation in Chameleon

### Design Philosophy

**Universal Reasoning Toggle:**
- Reasoning toggle is available for **ALL models**
- OpenRouter gracefully ignores the parameter if model doesn't support it
- No need to restrict by model - let OpenRouter handle compatibility
- User can experiment with any model

### API Route Implementation

**Location:** `app/api/chat/route.ts`

```typescript
// Add reasoning parameter if enabled (for all models)
if (reasoning) {
  openRouterBody.reasoning = { effort: "medium" }
  // CRITICAL: OpenRouter requires include_reasoning to actually return reasoning tokens
  openRouterBody.include_reasoning = true
}
```

**Key Points:**
- Uses `"medium"` effort (balanced approach)
- Always includes `include_reasoning: true`
- Passed to OpenRouter regardless of model
- OpenRouter handles model compatibility

### UI Implementation

**Location:** `components/chat-input.tsx`, `components/blocks-chat-input.tsx`

```typescript
// Reasoning toggle is now available for ALL models
// OpenRouter gracefully ignores the reasoning parameter if model doesn't support it
const modelSupportsReasoning = true // Always true - let OpenRouter handle model compatibility
```

**Previous Behavior (Removed):**
```typescript
// ❌ OLD: Restricted to specific models
const REASONING_MODELS = new Set([...])
const modelSupportsReasoning = REASONING_MODELS.has(model)
```

**Current Behavior:**
```typescript
// ✅ NEW: Available for all models
const modelSupportsReasoning = true
```

### Reasoning Toggle Features

**Persistence:**
- State saved to localStorage: `chameleon-reasoning-enabled`
- Persists across sessions
- Default: `false` (off)

**UI Placement:**
- Brain icon (🧠) in chat input toolbar
- Active state: highlighted button
- Inactive state: ghost button
- Tooltip: "Extended reasoning"

**Visual Feedback:**
- Real-time reasoning display during streaming
- Amber-colored card with pulsing lightbulb icon
- Scrollable reasoning content
- Token count display
- Collapsible sections

### Known Reasoning Models List

**Location:** `lib/openrouter.ts`

```typescript
export const REASONING_MODELS_KNOWN = new Set([
  // OpenAI o-series
  "openai/o1", "openai/o1-mini", "openai/o3-mini",

  // DeepSeek R1 series (including 3.2!)
  "deepseek/deepseek-r1", "deepseek/deepseek-v3.2",

  // Grok models
  "x-ai/grok-4.1-fast", "x-ai/grok-4",

  // Qwen thinking
  "qwen/qwen3-235b-a22b-thinking-2507",

  // Gemini thinking
  "google/gemini-2.0-flash-thinking-exp",

  // Kimi thinking
  "moonshotai/kimi-k2-thinking",

  // ... and more
])
```

**Purpose:**
- Documentation only
- Not used for UI restrictions
- Helps users know which models have confirmed support
- Updated as new reasoning models are released

---

## How Different AI Labs Handle Reasoning

### OpenAI (o-series, o3-series)

**Approach:**
- Native reasoning built into model architecture
- Configurable effort levels (low/medium/high)
- Returns reasoning as separate stream

**API Format:**
```json
{
  "reasoning": { "effort": "high" },
  "include_reasoning": true
}
```

**Response:**
```json
{
  "choices": [{
    "message": {
      "reasoning": "Let me think through this...",
      "content": "The answer is..."
    }
  }]
}
```

**Cost Model:**
- Reasoning tokens counted separately
- Generally more expensive than completion tokens
- Effort level affects token usage

---

### DeepSeek (R1, V3.2)

**Approach:**
- Open-source reasoning model
- Fully transparent reasoning tokens
- MIT licensed for distillation

**API Format:**
```json
{
  "include_reasoning": true
}
```

**Response:**
```json
{
  "choices": [{
    "delta": {
      "reasoning_content": "Step 1: Analyze the problem..."
    }
  }]
}
```

**Cost Model:**
- Very affordable ($0.14 per 1M tokens for V3)
- Free tier available for R1
- Reasoning tokens included in pricing

**V3.2 Improvements (Dec 1, 2025):**
- Better reasoning accuracy
- Reduced hallucinations
- Enhanced function calling
- Improved coding assistance

---

### xAI (Grok)

**Approach:**
- Configurable reasoning effort
- Real-time web knowledge integration
- 2M token context window

**API Format:**
```json
{
  "reasoning": { "effort": "medium" },
  "include_reasoning": true
}
```

**Special Features:**
- Can reason about real-time information
- Excellent for current events + reasoning
- Large context allows complex reasoning chains

---

### Alibaba (Qwen)

**Approach:**
- Discrete "thinking mode" toggle
- Separate thinking and non-thinking variants
- Strong multilingual reasoning

**API Format:**
```json
{
  "include_reasoning": true
}
```

**Models:**
- `qwen3-235b-a22b-thinking-2507` - Always in thinking mode
- `qwq-32b-preview` - Experimental thinking
- `qwen-2.5-coder-32b-instruct` - Coding with thinking

---

### Google (Gemini)

**Approach:**
- Experimental thinking models
- Flash variants for speed
- Multimodal reasoning (vision + text)

**API Format:**
```json
{
  "include_reasoning": true
}
```

**Characteristics:**
- Fast inference even with reasoning
- Good for vision + reasoning tasks
- Experimental status (subject to change)

---

### Anthropic (Claude)

**Approach:**
- Integrated reasoning (not streamed separately)
- Uses reasoning to improve response quality
- No separate reasoning tokens

**API Format:**
```json
{
  "reasoning": { "effort": "high" }
}
```

**Response:**
- Reasoning integrated into main response
- No separate `reasoning_content` field
- Can still benefit from reasoning parameter

---

## Auto-Activation Research

### Question: Can Reasoning Be Auto-Activated Like Search?

**Summary:** Yes, but with caveats. Several strategies exist, each with trade-offs.

---

### Strategy 1: Heuristic-Based Activation

**Similar to Auto-Search Implementation**

Activate reasoning when detecting:
- Math problems: `\d+[\+\-\*/]\d+`, `calculate`, `solve`, `equation`
- Logic puzzles: `if.*then`, `therefore`, `prove`, `logical`
- Complex questions: `why`, `how does`, `explain`, `analyze`
- Coding challenges: `algorithm`, `optimize`, `implement`, `debug`
- Multi-step problems: `step by step`, `first.*then`, `process`

**Implementation:**
```typescript
function shouldAutoEnableReasoning(userMessage: string): boolean {
  const text = userMessage.toLowerCase()

  // Math and calculations
  if (/\d+\s*[\+\-\*/]\s*\d+/.test(text)) return true
  if (/calculate|solve|equation|formula/i.test(text)) return true

  // Logic and reasoning
  if (/prove|theorem|logical|deduce|infer/i.test(text)) return true

  // Complex analysis
  if (/analyze|compare|evaluate|assess/i.test(text)) return true

  // Step-by-step processes
  if (/step by step|walkthrough|process|procedure/i.test(text)) return true

  // Coding challenges
  if (/algorithm|optimize|complexity|implement/i.test(text)) return true

  return false
}
```

**Pros:**
- Fast, no API calls
- Works offline
- Predictable behavior
- Low latency

**Cons:**
- Can miss nuanced cases
- False positives possible
- Requires manual rule tuning
- Language-dependent

---

### Strategy 2: LLM-Based Classification

**Use Fast Model to Decide**

Send user message to fast classifier model:
```typescript
async function shouldAutoEnableReasoningLLM(
  userMessage: string,
  apiKey: string
): Promise<boolean> {
  const prompt = `Analyze this user message and determine if it requires deep reasoning, step-by-step thinking, or complex problem-solving.

User message: "${userMessage}"

Respond with ONLY "yes" or "no".

Examples of YES (needs reasoning):
- "Solve: If x + 5 = 12, what is x?"
- "Explain why the sky is blue at a molecular level"
- "What's the most efficient algorithm for sorting 1 million numbers?"
- "Walk me through how to debug a memory leak"

Examples of NO (simple/factual):
- "What's the capital of France?"
- "Translate 'hello' to Spanish"
- "What's the weather like?"
- "Tell me a joke"

Decision:`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "x-ai/grok-4.1-fast", // Fast, cheap model for classification
      messages: [{ role: "user", content: prompt }],
      max_tokens: 5,
      temperature: 0.1
    })
  })

  const data = await response.json()
  const decision = data.choices[0].message.content.trim().toLowerCase()
  return decision === "yes"
}
```

**Pros:**
- More accurate than heuristics
- Handles nuance and context
- Multilingual support
- Adapts to edge cases

**Cons:**
- Additional API call (latency + cost)
- Requires API key
- Offline capability lost
- Complexity increases

---

### Strategy 3: Model-Aware Auto-Activation

**Enable Based on Model Capabilities**

```typescript
function shouldAutoEnableReasoningForModel(
  modelId: string,
  userMessage: string
): boolean {
  // Always auto-enable for reasoning-optimized models
  if (REASONING_MODELS_KNOWN.has(modelId)) {
    // These models are built for reasoning - use it
    return true
  }

  // For general models, use heuristics
  return shouldAutoEnableReasoning(userMessage)
}
```

**Pros:**
- Leverages model strengths
- No false negatives for reasoning models
- Simple logic
- No extra API calls

**Cons:**
- Reasoning models might be overused
- Cost implications for expensive models
- Users might want control

---

### Strategy 4: Adaptive Learning

**Learn from User Behavior**

Track when users manually enable/disable reasoning:
```typescript
interface ReasoningPattern {
  messagePattern: string
  userEnabledReasoning: boolean
  timestamp: number
}

class ReasoningLearner {
  patterns: ReasoningPattern[] = []

  recordUserChoice(message: string, enabled: boolean) {
    this.patterns.push({
      messagePattern: this.extractPattern(message),
      userEnabledReasoning: enabled,
      timestamp: Date.now()
    })
  }

  predictShouldEnable(message: string): boolean {
    // Find similar past messages
    const similar = this.findSimilarPatterns(message)

    // Calculate probability based on past behavior
    const enabledCount = similar.filter(p => p.userEnabledReasoning).length
    return (enabledCount / similar.length) > 0.5
  }

  private extractPattern(message: string): string {
    // Extract key features: question words, math symbols, complexity markers
    return message.toLowerCase()
      .replace(/\d+/g, 'NUM')
      .replace(/[a-z]+/g, 'WORD')
  }

  private findSimilarPatterns(message: string): ReasoningPattern[] {
    const pattern = this.extractPattern(message)
    return this.patterns.filter(p =>
      this.similarity(p.messagePattern, pattern) > 0.7
    )
  }
}
```

**Pros:**
- Personalized to user habits
- Improves over time
- Respects user preferences
- No API calls

**Cons:**
- Requires usage history
- Cold start problem
- Privacy concerns (stores message patterns)
- Complex implementation

---

### Strategy 5: Hybrid Approach (Recommended)

**Combine Multiple Strategies**

```typescript
async function shouldAutoEnableReasoningHybrid(
  userMessage: string,
  modelId: string,
  apiKey: string,
  userHistory?: ReasoningLearner
): Promise<boolean> {
  // 1. Check user history first (if available)
  if (userHistory && userHistory.hasEnoughData()) {
    const prediction = userHistory.predictShouldEnable(userMessage)
    if (prediction !== null) return prediction
  }

  // 2. Model-aware: Always enable for reasoning-optimized models
  if (REASONING_MODELS_KNOWN.has(modelId)) {
    // But still check if message is too simple
    if (isSimpleQuery(userMessage)) return false
    return true
  }

  // 3. Heuristic check for obvious cases
  const heuristicDecision = shouldAutoEnableReasoning(userMessage)
  if (heuristicDecision) return true

  // 4. For borderline cases, use LLM classification
  if (isBorderlineComplexity(userMessage)) {
    return await shouldAutoEnableReasoningLLM(userMessage, apiKey)
  }

  // 5. Default to off for simple queries
  return false
}

function isSimpleQuery(message: string): boolean {
  // Very short queries are usually simple
  if (message.length < 20) return true

  // Single-word queries
  if (!/\s/.test(message.trim())) return true

  // Common simple patterns
  const simplePatterns = [
    /^(what|who|when|where)\s+is\s+/i,
    /^translate/i,
    /^define/i,
    /^what's\s+the\s+(weather|time)/i
  ]

  return simplePatterns.some(p => p.test(message))
}

function isBorderlineComplexity(message: string): boolean {
  // Not obviously simple, not obviously complex
  // Use LLM to decide
  const wordCount = message.split(/\s+/).length
  return wordCount > 10 && wordCount < 50
}
```

**Pros:**
- Best of all approaches
- Graceful degradation
- Balances accuracy and speed
- Personalized yet robust

**Cons:**
- Most complex to implement
- Requires all strategies
- More maintenance

---

### Recommendation

**For Chameleon AI Chat:**

**Phase 1: Heuristic-Based (Immediate)**
- Implement `shouldAutoEnableReasoning()` with keyword detection
- Low complexity, high value
- Similar to existing auto-search implementation
- No additional API calls

**Phase 2: Model-Aware Enhancement**
- Auto-enable for models in `REASONING_MODELS_KNOWN`
- Combine with heuristics to avoid overuse
- Add user setting: "Auto-enable reasoning for complex queries"

**Phase 3: User Learning (Future)**
- Track user manual toggles
- Build personalized activation patterns
- Privacy-focused (store patterns, not full messages)

---

### Implementation Example

**Settings:**
```typescript
interface ExperimentalSettings {
  // ... existing settings
  autoEnableReasoning?: boolean // Default: false
  reasoningAutoMode?: "heuristic" | "model-aware" | "hybrid" // Default: "heuristic"
}
```

**Chat Input:**
```typescript
const shouldEnableReasoning = useMemo(() => {
  // Manual override always wins
  if (reasoningEnabled) return true

  // Check auto-enable setting
  if (!settings.experimental?.autoEnableReasoning) return false

  // Apply selected strategy
  const mode = settings.experimental?.reasoningAutoMode || "heuristic"
  switch (mode) {
    case "heuristic":
      return shouldAutoEnableReasoning(input)
    case "model-aware":
      return shouldAutoEnableReasoningForModel(selectedModel, input)
    case "hybrid":
      return shouldAutoEnableReasoningHybrid(input, selectedModel, apiKey)
    default:
      return false
  }
}, [input, reasoningEnabled, settings, selectedModel])
```

---

## Technical Details

### Reasoning Token Streaming

**Client-Side Processing:**

```typescript
// lib/openrouter.ts
export async function streamChatMessage(
  messages: ChatMessage[],
  model: string,
  onChunk: (content: string) => void,
  options: {
    reasoning?: boolean
    onReasoning?: (reasoning: string) => void
    // ... other options
  }
): Promise<void> {
  // ... fetch setup ...

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue
    const data = line.slice(6)
    if (data === "[DONE]") continue

    const parsed = JSON.parse(data)
    const delta = parsed.choices?.[0]?.delta

    // Handle reasoning content
    if (delta?.reasoning_content && options.onReasoning) {
      options.onReasoning(delta.reasoning_content)
    }

    // Handle regular content
    if (delta?.content) {
      onChunk(delta.content)
    }
  }
}
```

### Reasoning Display Component

**Location:** `components/message-status.tsx`

```typescript
{showReasoningTokens && streamingDetails.reasoningContent && (
  <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
        Extended Thinking
      </p>
      <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 font-mono max-h-32 overflow-y-auto">
        {streamingDetails.reasoningContent}
      </div>
      {streamingDetails.reasoningTokens && (
        <p className="text-xs text-amber-600/60 dark:text-amber-400/60 mt-1">
          {streamingDetails.reasoningTokens} reasoning tokens
        </p>
      )}
    </div>
  </div>
)}
```

### Cost Tracking

**Reasoning tokens are tracked separately:**

```typescript
// In message stats
tokens: {
  prompt: number
  completion: number
  total: number
  reasoning?: number // Separate reasoning token count
}
```

---

## Best Practices

### When to Use Reasoning Mode

**✅ Good Use Cases:**
- Complex math problems
- Multi-step logical reasoning
- Code debugging and optimization
- Analytical tasks requiring evidence
- Explaining complex concepts
- Planning and strategy development

**❌ Poor Use Cases:**
- Simple factual queries ("What's the capital of France?")
- Translation tasks
- Creative writing (unless analysis is needed)
- General chitchat
- Quick lookups

### Cost Optimization

**Reasoning tokens can be expensive. Optimize by:**

1. **Use `effort: "low"` or `"medium"`**
   - Reserve "high" for truly complex tasks
   - Medium is good default

2. **Set `reasoning.max_tokens`**
   - Cap reasoning budget
   - Prevents runaway costs

3. **Use `reasoning.exclude: true` when appropriate**
   - Get quality benefits without displaying reasoning
   - Saves on output token costs

4. **Choose the right model:**
   - DeepSeek R1: Most cost-effective reasoning
   - Grok: Good balance of cost and quality
   - o1/o3: Premium but most capable

### User Experience

**Transparency:**
- Show reasoning toggle prominently
- Display reasoning tokens in real-time
- Include reasoning in message stats
- Make it collapsible to reduce clutter

**Performance:**
- Reasoning can slow initial response time
- Show progress indicators
- Stream reasoning separately from answer
- Allow users to skip reasoning display

**Education:**
- Explain what reasoning mode does
- Show examples of good use cases
- Provide cost estimates
- Allow easy experimentation

---

## Future Enhancements

### Potential Features

**1. Reasoning Quality Indicators**
- Analyze reasoning for logical consistency
- Flag contradictions or circular reasoning
- Provide confidence scores

**2. Reasoning Compression**
- Summarize long reasoning chains
- Extract key decision points
- Show "reasoning summary" vs "full reasoning"

**3. Interactive Reasoning**
- Allow users to question reasoning steps
- Branch reasoning at decision points
- "What if" scenarios

**4. Reasoning Analytics**
- Track reasoning usage patterns
- Identify tasks that benefit most
- Optimize effort levels automatically

**5. Collaborative Reasoning**
- Multiple models reason together
- Compare reasoning approaches
- Ensemble reasoning for critical decisions

---

## Research Sources

This document is based on research from:

- [OpenRouter Reasoning Tokens Documentation](https://openrouter.ai/docs/use-cases/reasoning-tokens)
- [OpenRouter API Reference](https://openrouter.ai/docs/api/reference/overview)
- [DeepSeek R1 on OpenRouter](https://openrouter.ai/deepseek/deepseek-r1)
- [DeepSeek R1 Free API Guide](https://www.cursor-ide.com/blog/deepseek-r1-free-api-guide-2025)
- [OpenRouter Reasoning Announcement](https://openrouter.ai/announcements/reasoning-tokens-for-thinking-models)
- [GitHub: OpenRouter include_reasoning Discussion](https://github.com/continuedev/continue/issues/3946)
- [OpenRouter API Parameters](https://openrouter.ai/docs/api/reference/parameters)

---

## Conclusion

Reasoning modes represent a significant advancement in AI capabilities, allowing models to "show their work" and improve answer quality through explicit chain-of-thought processing. Chameleon AI Chat now supports reasoning across all models via OpenRouter, with graceful degradation for models that don't support it.

**Key Takeaways:**

✅ **Universal Toggle** - Reasoning available for all models, OpenRouter handles compatibility
✅ **Graceful Fallback** - Unsupported models simply ignore the parameter
✅ **New Models Supported** - DeepSeek 3.2 (Dec 1, 2025) and growing list
✅ **Auto-Activation Possible** - Multiple strategies available, heuristic recommended for Phase 1
✅ **Cost-Effective Options** - DeepSeek R1 provides open-source reasoning at low cost
✅ **Transparent UX** - Real-time reasoning display with collapsible interface

The future of AI reasoning is bright, with more models adopting transparent thinking and OpenRouter providing a unified API to access them all.

---

**Document Version:** 1.0
**Last Updated:** December 1, 2025
**Author:** Chameleon AI Chat Development Team
