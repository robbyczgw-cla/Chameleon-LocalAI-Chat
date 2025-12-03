# 🎨 Rich Content Guide

Chameleon AI Chat supports advanced rich content rendering. This guide shows you all available formats.

---

## 📊 Mermaid Diagrams

Create flowcharts, sequence diagrams, and more using Mermaid syntax.

### Flowchart Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

### Sequence Diagram Example

\`\`\`mermaid
sequenceDiagram
    participant User
    participant AI
    participant API

    User->>AI: Send message
    AI->>API: Call OpenRouter
    API-->>AI: Stream response
    AI-->>User: Display result
\`\`\`

### Gantt Chart Example

\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Research           :2025-01-01, 7d
    Design             :7d
    section Development
    Frontend           :2025-01-15, 14d
    Backend            :14d
\`\`\`

### Class Diagram Example

\`\`\`mermaid
classDiagram
    class Chat {
        +String id
        +Message[] messages
        +Date createdAt
        +addMessage()
        +updateTitle()
    }
    class Message {
        +String id
        +String content
        +String role
    }
    Chat "1" --> "*" Message
\`\`\`

---

## 🔢 Math Rendering (LaTeX/KaTeX)

Write mathematical equations using LaTeX syntax.

### Inline Math

The famous equation is $E = mc^2$, and the quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$.

### Block Math

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
$$

---

## 📊 Interactive Polls

Create polls that users can vote on. Votes are saved in localStorage.

### Basic Poll

[POLL]
{
  "question": "Which programming language do you prefer?",
  "options": ["Python", "JavaScript", "TypeScript", "Rust", "Go"],
  "multiSelect": false
}
[/POLL]

### Multi-Select Poll

[POLL]
{
  "question": "Which AI features are most important? (Select multiple)",
  "options": ["Cost tracking", "Voice input", "Web search", "Image generation", "Advanced memory"],
  "multiSelect": true
}
[/POLL]

### Poll with Expiry

[POLL]
{
  "question": "Should we add mobile app support?",
  "options": ["Yes, iOS", "Yes, Android", "Yes, both", "No"],
  "multiSelect": false,
  "expiresAt": "2025-12-31"
}
[/POLL]

---

## 📅 Timeline

Display events in a visual timeline.

[TIMELINE]
- 2020: Founded company
- 2021: Series A funding ($10M)
- 2022: Launched MVP
- 2023: Reached 10k users
- 2024: Series B funding ($50M)
- 2025: Global expansion
[/TIMELINE]

### Project Timeline

[TIMELINE]
- Week 1: Research and planning
- Week 2: Design mockups
- Week 3-4: Frontend development
- Week 5-6: Backend integration
- Week 7: Testing
- Week 8: Launch 🚀
[/TIMELINE]

---

## 📈 Progress Bars

Show progress with visual bars.

### Basic Progress

[PROGRESS value=75 max=100 label="Project Completion"]

### Multiple Progress Bars

[PROGRESS value=90 max=100 label="Frontend Development"]

[PROGRESS value=65 max=100 label="Backend Development"]

[PROGRESS value=40 max=100 label="Testing"]

[PROGRESS value=15 max=100 label="Documentation"]

---

## ⚖️ Comparison Cards

Compare options side-by-side with pros and cons.

[COMPARE]
## React Native

- Cross-platform code sharing
- Large community and ecosystem
- Hot reload during development
- Slightly slower than native
- Larger app size
- Some features require native bridges

## Native (Swift/Kotlin)

- Best performance
- Full access to platform APIs
- Smaller app size
- Requires two separate codebases
- Longer development time
- Higher maintenance cost
[/COMPARE]

### Three-Way Comparison

[COMPARE]
## Option A

- Fast implementation
- Lower cost
- Limited scalability
- Basic features only

## Option B

- Moderate complexity
- Balanced performance
- Good scalability
- Standard feature set

## Option C

- Complex implementation
- Higher cost
- Excellent scalability
- Advanced features
- Future-proof architecture
[/COMPARE]

---

## 📊 Interactive Tables

Create sortable and searchable tables.

### Sortable Table

[TABLE sortable]
| Model | Speed | Cost | Quality |
|-------|-------|------|---------|
| GPT-4 Turbo | Medium | $0.01 | Excellent |
| Claude 3 Sonnet | Fast | $0.003 | Very Good |
| Gemini Pro | Fast | $0.0005 | Good |
| Llama 3 70B | Fast | $0.0008 | Very Good |
| Mistral Large | Medium | $0.008 | Excellent |
[/TABLE]

### Sortable & Searchable Table

[TABLE sortable searchable]
| Cryptocurrency | Price | Change 24h | Market Cap |
|---------------|-------|-----------|-----------|
| Bitcoin (BTC) | $95,000 | +2.3% | $1.8T |
| Ethereum (ETH) | $3,200 | +5.1% | $380B |
| Solana (SOL) | $98 | +8.7% | $42B |
| Cardano (ADA) | $0.52 | -1.2% | $18B |
| Polkadot (DOT) | $7.15 | +3.4% | $9B |
[/TABLE]

### Feature Comparison Table

[TABLE sortable searchable]
| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| AI Models | 5 | 50+ | 100+ |
| Cost Tracking | ✓ | ✓ | ✓ |
| Web Search | - | ✓ | ✓ |
| Voice Input | - | ✓ | ✓ |
| API Access | - | - | ✓ |
| Priority Support | - | - | ✓ |
| Custom Models | - | - | ✓ |
| Price/Month | $0 | $20 | $99 |
[/TABLE]

---

## 🎯 Combining Multiple Formats

You can combine different rich content types in a single message!

### Example: Product Roadmap

## Q1 2025 Product Roadmap

### Timeline

[TIMELINE]
- Jan: Mobile app beta
- Feb: Voice features
- Mar: Advanced memory system
- Apr: Team collaboration
[/TIMELINE]

### Development Progress

[PROGRESS value=85 max=100 label="Mobile App (iOS)"]
[PROGRESS value=70 max=100 label="Mobile App (Android)"]
[PROGRESS value=95 max=100 label="Voice Features"]
[PROGRESS value=45 max=100 label="Team Features"]

### Architecture Decision

[COMPARE]
## React Native

- 70% code sharing
- Faster time to market
- Single codebase

## Native Apps

- Best performance
- Platform-specific UX
- Two separate teams needed
[/COMPARE]

### Team Vote

[POLL]
{
  "question": "Which approach should we take?",
  "options": ["React Native", "Native (both platforms)", "Web app only"],
  "multiSelect": false
}
[/POLL]

---

## 🧮 Complex Math Example

Solving the heat equation:

$$
\frac{\partial u}{\partial t} = \alpha \nabla^2 u
$$

Where:
- $u(x,y,z,t)$ is temperature
- $\alpha$ is thermal diffusivity
- $\nabla^2$ is the Laplacian operator

The solution in 1D is:

$$
u(x,t) = \frac{1}{\sqrt{4\pi\alpha t}} \int_{-\infty}^{\infty} f(y) e^{-\frac{(x-y)^2}{4\alpha t}} dy
$$

---

## 🎓 Tips for Best Results

### Mermaid Diagrams
- Keep diagrams simple and focused
- Use descriptive node labels
- Test complex diagrams before using

### Math Equations
- Use `$...$` for inline math
- Use `$$...$$` for block equations
- Check LaTeX syntax if rendering fails

### Interactive Elements
- Polls work best with 3-6 options
- Timelines should be chronological
- Tables work best with <10 columns

### Performance
- Large diagrams may take a moment to render
- Complex math is cached for performance
- Polls save votes to localStorage

---

## 🚀 How to Use

Simply include the special syntax in your AI responses:

1. **Mermaid**: Use code blocks with `mermaid` language
2. **Math**: Use `$...$` (inline) or `$$...$$` (block)
3. **Polls**: Use `[POLL]...JSON...[/POLL]`
4. **Timeline**: Use `[TIMELINE]- Date: Event[/TIMELINE]`
5. **Progress**: Use `[PROGRESS value=X max=Y label="..."]`
6. **Comparison**: Use `[COMPARE]## Title\n- Item[/COMPARE]`
7. **Tables**: Use `[TABLE sortable searchable]| Header |[/TABLE]`

The AI will automatically render these as beautiful, interactive components!

---

**Built with ❤️ for Chameleon AI Chat**
