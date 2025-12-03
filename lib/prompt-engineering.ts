/**
 * Prompt Engineering Helper
 * System prompt and utilities for improving user prompts
 */

export const PROMPT_ENGINEERING_SYSTEM_PROMPT = `You are an expert prompt engineering assistant. Your job is to transform vague, unclear, or basic prompts into highly effective, well-structured prompts that get better AI responses.

Apply these core techniques:

1. **Clarity & Specificity**: Make instructions crystal clear and specific
2. **Context**: Add relevant background information the AI needs
3. **Structure**: Use clear formatting, sections, and organization
4. **Role Assignment**: Give the AI a specific expert role when appropriate
5. **Output Format**: Specify exactly how the response should be formatted
6. **Constraints**: Define length, style, tone, and boundaries
7. **Examples**: Add few-shot examples when they help clarify the task
8. **Step-by-Step**: Break complex tasks into clear steps

**Important Guidelines:**
- Keep the core intent of the original prompt
- Make it 2-5x more effective, not just longer
- Use markdown formatting for structure
- Be concise but complete
- Focus on getting actionable, useful responses

**Output Format:**
Return ONLY the improved prompt. No explanation, no meta-commentary, just the enhanced prompt ready to use.`

export const PROMPT_ENGINEERING_TIPS = [
  {
    title: "Be Specific",
    description: "Vague prompts get vague answers. Define exactly what you need.",
    example: {
      bad: "Help me with code",
      good: "Review this Python function for bugs and suggest performance improvements"
    }
  },
  {
    title: "Add Context",
    description: "Give the AI background information to understand your situation.",
    example: {
      bad: "Write a marketing email",
      good: "Write a marketing email for a SaaS product launch, targeting B2B developers"
    }
  },
  {
    title: "Define the Format",
    description: "Specify how you want the response structured.",
    example: {
      bad: "Explain machine learning",
      good: "Explain machine learning in 3 bullet points, each under 50 words"
    }
  },
  {
    title: "Assign a Role",
    description: "Tell the AI what expert perspective to take.",
    example: {
      bad: "How do I invest?",
      good: "As a certified financial advisor, explain index fund investing for beginners"
    }
  },
  {
    title: "Use Examples",
    description: "Show examples of what you want (few-shot prompting).",
    example: {
      bad: "Summarize this",
      good: "Summarize this article. Example: 'Article about X argues Y because Z. Key insight: W.'"
    }
  },
  {
    title: "Set Constraints",
    description: "Define boundaries like length, complexity, or style.",
    example: {
      bad: "Explain quantum physics",
      good: "Explain quantum entanglement in 100 words, using analogies a 10-year-old would understand"
    }
  }
]

export const PROMPT_TEMPLATES = [
  // Code & Development
  {
    category: "Code Review",
    name: "Debug & Optimize Code",
    template: `Act as a senior software engineer with expertise in [LANGUAGE/FRAMEWORK].

Review this code and provide:
1. Bug identification with severity levels
2. Performance optimization suggestions
3. Best practices violations
4. Security concerns if any

Code:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Format your response with clear sections and code examples for fixes.`
  },
  {
    category: "Code",
    name: "Build Feature from Scratch",
    template: `Build a [FEATURE NAME] feature with the following requirements:

**Context**: [Describe the application/system]
**Requirements**:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Tech Stack**: [Language/Framework]
**Constraints**: [Performance, scalability, etc.]

Provide:
1. Architecture/design approach
2. Complete code with comments
3. Usage examples
4. Edge cases handled
5. Testing recommendations`
  },
  {
    category: "Code",
    name: "Refactor Legacy Code",
    template: `Refactor this legacy code following modern best practices:

\`\`\`
[PASTE LEGACY CODE]
\`\`\`

Requirements:
- Make it more readable and maintainable
- Apply design patterns where appropriate
- Add proper error handling
- Include type safety (if applicable)
- Document breaking changes

Show before/after comparison with explanations.`
  },
  {
    category: "Code",
    name: "Write Unit Tests",
    template: `Write comprehensive unit tests for this code:

\`\`\`
[YOUR CODE]
\`\`\`

Testing Framework: [Jest/PyTest/etc.]

Include:
1. Happy path tests
2. Edge cases
3. Error handling tests
4. Mock examples where needed
5. Test coverage aim: >80%

Follow AAA pattern (Arrange, Act, Assert).`
  },

  // Image Generation
  {
    category: "Image Creation",
    name: "Photorealistic Scene",
    template: `Create a photorealistic image of [SUBJECT/SCENE].

Details:
- Setting: [indoor/outdoor, location, time of day]
- Lighting: [natural, dramatic, soft, golden hour]
- Camera angle: [eye-level, bird's eye, low angle]
- Style: Photorealistic, high detail, 8K quality
- Mood: [peaceful, energetic, moody, vibrant]
- Color palette: [warm, cool, monochrome, vibrant]

Additional elements: [specify any specific objects, people, or details]`
  },
  {
    category: "Image Creation",
    name: "Artistic Illustration",
    template: `Illustrated [SUBJECT] in [ART STYLE] style.

Style details:
- Art style: [watercolor, oil painting, digital art, anime, comic book]
- Color scheme: [vibrant, pastel, dark, neon]
- Composition: [centered, rule of thirds, dynamic]
- Mood: [whimsical, dramatic, serene, energetic]

Technical specs:
- Detail level: [simple, moderate, highly detailed]
- Background: [solid color, detailed scene, abstract]
- Aspect ratio: [square, landscape, portrait]`
  },
  {
    category: "Image Creation",
    name: "Logo Design",
    template: `Design a modern logo for [COMPANY/BRAND NAME].

Brand identity:
- Industry: [tech, food, fashion, etc.]
- Target audience: [demographics]
- Brand personality: [professional, playful, luxury, minimal]
- Colors: [specify 2-3 brand colors or "suggest colors"]

Style preferences:
- Type: [wordmark, lettermark, icon, combination]
- Style: [minimal, geometric, organic, vintage]
- Must include: [specific elements if any]

Deliverable: Clean, scalable vector-style design on transparent background.`
  },
  {
    category: "Image Creation",
    name: "Product Mockup",
    template: `Create a product mockup for [PRODUCT TYPE].

Product details:
- Product: [describe the product]
- Setting: [lifestyle shot, studio, in-use scenario]
- Background: [white, gradient, lifestyle scene]
- Lighting: [professional, natural, dramatic]

Requirements:
- Show product clearly from [angle]
- Include [any specific props or context]
- Style: [clean, editorial, e-commerce]
- Mood: [luxurious, casual, professional]

Resolution: High quality, commercial use ready.`
  },
  {
    category: "Image Creation",
    name: "Character Design",
    template: `Design a character with these specifications:

**Character Profile**:
- Type: [human, creature, robot, fantasy being]
- Age/appearance: [describe]
- Personality traits: [list 3-4 traits]
- Role: [hero, villain, sidekick, etc.]

**Visual Style**:
- Art style: [realistic, cartoon, anime, stylized]
- Clothing/outfit: [describe style and details]
- Color palette: [specify or request suggestions]
- Distinctive features: [scars, accessories, etc.]

**Pose & Expression**:
- Pose: [action pose, standing, sitting]
- Expression: [happy, determined, mysterious]

Full body character sheet preferred.`
  },
  {
    category: "Image Creation",
    name: "Abstract Art",
    template: `Create an abstract art piece representing [CONCEPT/EMOTION].

Artistic direction:
- Theme: [geometric, fluid, minimalist, maximalist]
- Colors: [vibrant, monochrome, complementary, analogous]
- Composition: [balanced, chaotic, flowing, structured]
- Texture: [smooth, rough, layered, gradient]

Mood/feeling: [energetic, calm, mysterious, joyful]
Inspiration: [reference any art movements if desired]

Style: Modern abstract art, suitable for wall art/prints.`
  },

  // Writing & Content
  {
    category: "Writing",
    name: "Blog Post Outline",
    template: `Create a comprehensive blog post about [TOPIC].

Target audience: [describe reader]
Goal: [educate, inspire, convert, inform]
Keyword: [SEO keyword if any]

Include:
1. Attention-grabbing headline (5 options)
2. Meta description (under 160 chars)
3. Introduction hook
4. H2 section headings (5-7 sections)
5. Key points for each section
6. Conclusion with CTA
7. Estimated word count: [1000/1500/2000]

Tone: [professional, conversational, authoritative]`
  },
  {
    category: "Writing",
    name: "Social Media Posts",
    template: `Create [NUMBER] social media posts for [PLATFORM] about [TOPIC/PRODUCT].

Brand voice: [professional, fun, inspiring, educational]
Goal: [awareness, engagement, sales, education]

For each post include:
- Main copy (hook + body + CTA)
- Hashtags (5-10 relevant)
- Emoji usage: [minimal, moderate, heavy]
- Best posting time suggestion
- Image description/idea

Platform-specific optimization for [Instagram/LinkedIn/Twitter/Facebook].`
  },
  {
    category: "Writing",
    name: "Email Campaign",
    template: `Write a [TYPE] email for [PURPOSE].

Audience: [describe recipient]
Context: [explain situation/campaign]

Email structure:
- Subject line (3 variations, A/B test ready)
- Preview text (under 100 chars)
- Email body (personalized, conversational)
- Clear CTA
- P.S. or secondary CTA

Goals:
- Open rate target: [specify if known]
- Action desired: [click, reply, purchase]
- Tone: [warm, professional, urgent, friendly]

Length: [short/medium/long]`
  },

  // Business & Marketing
  {
    category: "Marketing",
    name: "Landing Page Copy",
    template: `Write high-converting landing page copy for [PRODUCT/SERVICE].

Product: [describe offering]
Target customer: [demographics, pain points]
Unique value proposition: [what makes it special]

Sections needed:
1. Hero headline + subheadline
2. Problem statement (pain points)
3. Solution (how product solves it)
4. Features & benefits (3-5 each)
5. Social proof/testimonials placeholder
6. Pricing/CTA section
7. FAQ (5-7 questions)
8. Final CTA

Tone: [benefit-focused, urgent, trustworthy]
Length: Full landing page structure`
  },
  {
    category: "Marketing",
    name: "Ad Copy (PPC/Social)",
    template: `Create [NUMBER] ad variations for [PLATFORM - Google/Facebook/LinkedIn].

Product/Service: [describe]
Audience: [demographics, interests]
Campaign goal: [awareness, consideration, conversion]

For each ad provide:
- Headline (under [character limit])
- Description/body copy
- CTA text
- Target keyword/interest (if applicable)

Ad types:
- Variation 1: [feature-focused]
- Variation 2: [benefit-focused]
- Variation 3: [problem-solution focused]

Include emoji where appropriate.`
  },
  {
    category: "Business",
    name: "Business Plan Section",
    template: `Write the [SECTION NAME] section for a business plan.

Business: [company name and description]
Industry: [specify]
Target market: [describe]

Section requirements:
[If Executive Summary: 1-2 pages covering business overview, market opportunity, competitive advantage, financial highlights]
[If Market Analysis: Target market size, demographics, trends, competition]
[If Financial Projections: Revenue model, cost structure, 3-year projections]

Tone: Professional, data-driven, investor-ready
Include: Specific metrics, realistic projections, clear value proposition`
  },

  // Analysis & Research
  {
    category: "Research",
    name: "Market Research Report",
    template: `Conduct market research analysis for [INDUSTRY/PRODUCT].

Research scope:
- Market size and growth trends
- Key players and competition
- Customer segments and behavior
- Market opportunities and gaps
- Risk factors and challenges

Deliver:
1. Executive summary
2. Market overview with data
3. Competitive landscape analysis
4. SWOT analysis
5. Recommendations
6. Data sources cited

Format: Professional report style, ~1500 words.`
  },
  {
    category: "Analysis",
    name: "SWOT Analysis",
    template: `Perform a detailed SWOT analysis for [COMPANY/PRODUCT/IDEA].

Context: [provide background information]

Analyze:
**Strengths**: Internal positive factors (5-7 points)
**Weaknesses**: Internal limiting factors (5-7 points)
**Opportunities**: External favorable conditions (5-7 points)
**Threats**: External risks and challenges (5-7 points)

For each point:
- Explain the factor
- Provide impact level (High/Medium/Low)
- Suggest action items

Present in clear structured format with actionable insights.`
  },

  // Learning & Education
  {
    category: "Learning",
    name: "Tutorial/How-To Guide",
    template: `Create a step-by-step tutorial on how to [TASK/SKILL].

Audience skill level: [beginner/intermediate/advanced]
Goal: [what they'll accomplish]

Structure:
1. Introduction (why this matters)
2. Prerequisites/requirements
3. Step-by-step instructions (numbered, detailed)
4. Common mistakes to avoid
5. Troubleshooting tips
6. Next steps/advanced tips

Include:
- Estimated time to complete
- Difficulty level
- Screenshots/diagrams descriptions where helpful
- Pro tips throughout

Length: Comprehensive guide, ~1000-1500 words.`
  },
  {
    category: "Learning",
    name: "Study Guide/Cheat Sheet",
    template: `Create a study guide/cheat sheet for [TOPIC].

Target audience: [students/professionals/beginners]
Purpose: [exam prep, quick reference, learning aid]

Include:
1. Key concepts (definitions)
2. Important formulas/rules
3. Common patterns/frameworks
4. Examples with solutions
5. Memory aids/mnemonics
6. Quick reference table
7. Practice questions (5-10)

Format: Scannable, organized, easy to memorize
Length: 1-2 pages max when printed`
  },

  // Existing templates
  {
    category: "Problem Solving",
    name: "Step-by-Step Solution",
    template: `I need help solving: [PROBLEM DESCRIPTION]

Context:
- Current situation: [describe current state]
- Goal: [desired outcome]
- Constraints: [limitations, requirements]

Please provide:
1. Problem analysis
2. Step-by-step solution
3. Potential challenges and how to address them
4. Success criteria

Be practical and actionable.`
  },
  {
    category: "Learning",
    name: "Explain Like I'm 5",
    template: `Explain [COMPLEX TOPIC] in simple terms.

Assume I have:
- Knowledge level: [beginner/intermediate/advanced in X]
- Age/background: [specify if relevant]

Use:
- Simple analogies
- Real-world examples
- Progressive complexity (start simple, build up)
- Avoid jargon or define it when necessary

Keep explanation under 300 words.`
  },
  {
    category: "Analysis",
    name: "Compare & Contrast",
    template: `Compare [OPTION A] vs [OPTION B] for [USE CASE/CONTEXT].

Analyze:
1. **Strengths**: What each excels at
2. **Weaknesses**: Limitations of each
3. **Use Cases**: When to choose each one
4. **Recommendation**: Which is better for [specific scenario] and why

Present in a clear table or structured format.`
  }
]

/**
 * Get a random helpful tip
 */
export function getRandomTip() {
  return PROMPT_ENGINEERING_TIPS[Math.floor(Math.random() * PROMPT_ENGINEERING_TIPS.length)]
}

/**
 * Improve a prompt using AI
 */
export async function improvePrompt(originalPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Chameleon Chat - Prompt Helper",
    },
    body: JSON.stringify({
      model: "x-ai/grok-4.1-fast", // Fast model for prompt engineering
      messages: [
        {
          role: "system",
          content: PROMPT_ENGINEERING_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: originalPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to improve prompt: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
