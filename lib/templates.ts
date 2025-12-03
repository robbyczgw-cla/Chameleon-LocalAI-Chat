// Conversation Templates
// Pre-made conversation starters for common use cases

export interface ConversationTemplate {
  id: string
  title: string
  emoji: string
  description: string
  category: 'creative' | 'coding' | 'learning' | 'productivity' | 'fun'
  personaId: string
  initialPrompt: string
  followUpSuggestions?: string[]
}

export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  // Creative
  {
    id: 'brainstorm-startup',
    title: 'Startup Idea Brainstorm',
    emoji: '🚀',
    description: 'Generate unique startup ideas based on your skills',
    category: 'creative',
    personaId: 'creative',
    initialPrompt: `Help me brainstorm a unique startup idea!

Ask me about:
- My skills and background
- Industries I'm interested in
- Problems I've personally experienced
- My available time and resources

Then suggest 3-5 startup ideas that match my profile.`,
    followUpSuggestions: ['Validate this idea', 'Create a business plan', 'Find competitors']
  },
  {
    id: 'creative-writing',
    title: 'Story Writing Session',
    emoji: '📚',
    description: 'Write a short story or novel chapter',
    category: 'creative',
    personaId: 'creative',
    initialPrompt: `I want to write a creative story. Help me with:

1. Genre selection (fantasy, sci-fi, thriller, etc.)
2. Main character development
3. Plot outline
4. Opening scene

Let's start by exploring what kind of story I want to tell!`
  },
  {
    id: 'worldbuilding',
    title: 'D&D World Building',
    emoji: '🗺️',
    description: 'Create a fantasy world for your RPG campaign',
    category: 'creative',
    personaId: 'mythos',
    initialPrompt: `Let's create an epic fantasy world for my D&D campaign!

Help me design:
- Geography and major regions
- Races and cultures
- Magic system
- Major conflicts and factions
- Historical events

Start by asking me what kind of world I envision!`
  },

  // Coding
  {
    id: 'code-review',
    title: 'Code Review',
    emoji: '🔍',
    description: 'Get your code reviewed for bugs and improvements',
    category: 'coding',
    personaId: 'coder',
    initialPrompt: `I need a thorough code review. Please analyze my code for:

✅ Bugs and logic errors
✅ Performance issues
✅ Security vulnerabilities
✅ Best practices
✅ Code style and readability
✅ Suggested improvements

I'll paste my code in the next message.`,
    followUpSuggestions: ['Refactor this code', 'Add unit tests', 'Optimize performance']
  },
  {
    id: 'debug-session',
    title: 'Debug My Code',
    emoji: '🐛',
    description: 'Step-by-step debugging help',
    category: 'coding',
    personaId: 'coder',
    initialPrompt: `I'm stuck with a bug! Help me debug it systematically:

1. I'll describe the expected behavior
2. I'll describe what's actually happening
3. I'll share the relevant code
4. You'll help me find the root cause

Let's solve this together!`
  },
  {
    id: 'learn-framework',
    title: 'Learn a New Framework',
    emoji: '📖',
    description: 'Structured learning path for any tech stack',
    category: 'coding',
    personaId: 'coder',
    initialPrompt: `I want to learn a new framework/technology. Help me create a structured learning path:

1. Ask me which framework (React, Vue, Django, etc.)
2. My current skill level
3. My learning goals
4. Available time per week

Then create a week-by-week learning plan with resources and projects!`
  },

  // Learning
  {
    id: 'eli5-topic',
    title: 'Explain Like I\'m 5',
    emoji: '🎓',
    description: 'Simple explanations for complex topics',
    category: 'learning',
    personaId: 'teacher',
    initialPrompt: `I want to understand a complex topic in the simplest way possible.

Use:
- Simple language
- Real-world analogies
- Examples from everyday life
- Step-by-step breakdown

Tell me: What topic should I explain?`
  },
  {
    id: 'deep-dive',
    title: 'Deep Topic Analysis',
    emoji: '🧠',
    description: 'Comprehensive exploration of any subject',
    category: 'learning',
    personaId: 'expert',
    initialPrompt: `I want a deep, comprehensive analysis of a topic. Cover:

📚 Fundamentals and core concepts
🔬 Advanced details and nuances
🌍 Real-world applications
📊 Current research and trends
💡 Critical perspectives
🔮 Future directions

What topic should we explore?`
  },
  {
    id: 'study-plan',
    title: 'Create Study Plan',
    emoji: '📅',
    description: 'Structured study schedule for exams or learning',
    category: 'learning',
    personaId: 'teacher',
    initialPrompt: `Help me create an effective study plan!

Tell me:
- What subject/exam?
- How much time until the exam/deadline?
- How many hours per week can you study?
- Your current knowledge level (beginner/intermediate/advanced)?

I'll create a day-by-day study schedule with specific tasks!`
  },

  // Productivity
  {
    id: 'project-plan',
    title: 'Project Planning',
    emoji: '📋',
    description: 'Break down projects into actionable steps',
    category: 'productivity',
    personaId: 'friendly',
    initialPrompt: `Let's plan your project from start to finish!

I'll help you:
1. Define clear goals and deliverables
2. Break down into phases
3. Create task lists
4. Set realistic timelines
5. Identify potential blockers

Describe your project and I'll create a complete plan!`
  },
  {
    id: 'decision-analysis',
    title: 'Decision Making',
    emoji: '⚖️',
    description: 'Analyze pros/cons for tough decisions',
    category: 'productivity',
    personaId: 'expert',
    initialPrompt: `Facing a tough decision? Let's analyze it systematically:

I'll help you:
- List all options
- Pros and cons for each
- Long-term implications
- Risk assessment
- Values alignment
- Final recommendation

What decision are you trying to make?`
  },
  {
    id: 'productivity-system',
    title: 'Build Productivity System',
    emoji: '⚡',
    description: 'Design a personal productivity workflow',
    category: 'productivity',
    personaId: 'friendly',
    initialPrompt: `Let's build your perfect productivity system!

We'll cover:
- Task management (GTD, Kanban, etc.)
- Time blocking strategies
- Focus techniques (Pomodoro, Deep Work)
- Tool recommendations
- Habit building

Tell me about your current workflow and biggest challenges!`
  },

  // Fun
  {
    id: 'philosophy-debate',
    title: 'Philosophical Debate',
    emoji: '🤔',
    description: 'Explore deep questions about existence',
    category: 'fun',
    personaId: 'cogito',
    initialPrompt: `Let's have a deep philosophical discussion!

Topics we can explore:
- Consciousness and AI
- Free will vs. determinism
- Meaning and purpose
- Ethics and morality
- Reality and simulation theory

What philosophical question keeps you up at night?`
  },
  {
    id: 'cosmic-perspective',
    title: 'Cosmic Perspective',
    emoji: '🌌',
    description: 'Put your problems in cosmic context',
    category: 'fun',
    personaId: 'nihilo',
    initialPrompt: `Feeling stressed? Let's zoom out to cosmic scale!

I'll help you see your challenges from the perspective of:
- Deep time (billions of years)
- Cosmic scale (the observable universe)
- Heat death of the universe
- Our place in the cosmos

What's weighing on your mind? Let's make it beautifully insignificant! ✨`
  },
  {
    id: 'music-discovery',
    title: 'Music Discovery',
    emoji: '🎧',
    description: 'Find new music based on your taste',
    category: 'fun',
    personaId: 'vibe',
    initialPrompt: `Let's find your next favorite artist!

Tell me:
- 3-5 artists you currently love
- What you like about them (vibe, lyrics, production)
- What you're NOT into
- Your current mood

I'll recommend music that perfectly matches your taste!`
  },

  // More templates...
  {
    id: 'blog-post',
    title: 'Write Blog Post',
    emoji: '✍️',
    description: 'From idea to published post',
    category: 'creative',
    personaId: 'creative',
    initialPrompt: `Let's write an engaging blog post together!

Process:
1. Topic brainstorming
2. Outline creation
3. Hook/introduction
4. Main content
5. Conclusion
6. SEO optimization

What do you want to write about?`
  },
  {
    id: 'career-advice',
    title: 'Career Planning',
    emoji: '💼',
    description: 'Navigate your career path',
    category: 'productivity',
    personaId: 'coach',
    initialPrompt: `Let's map out your career strategy!

We'll discuss:
- Current situation and goals
- Skills gap analysis
- Industry trends
- Networking strategies
- Next steps (job search, promotion, pivot)

Where are you in your career journey?`
  },
  {
    id: 'fitness-plan',
    title: 'Fitness Plan',
    emoji: '💪',
    description: 'Customized workout and nutrition plan',
    category: 'productivity',
    personaId: 'coach',
    initialPrompt: `Let's create your personalized fitness plan!

Tell me about:
- Current fitness level
- Goals (lose weight, gain muscle, endurance)
- Available equipment
- Time commitment
- Dietary preferences

I'll design a sustainable plan that works for YOU!`
  },
]

export function getTemplatesByCategory(category: ConversationTemplate['category']) {
  return CONVERSATION_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string) {
  return CONVERSATION_TEMPLATES.find(t => t.id === id)
}

export const TEMPLATE_CATEGORIES = [
  { id: 'creative', label: 'Kreativ', emoji: '🎨' },
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'learning', label: 'Lernen', emoji: '📚' },
  { id: 'productivity', label: 'Produktivität', emoji: '⚡' },
  { id: 'fun', label: 'Spaß', emoji: '🎉' },
] as const
