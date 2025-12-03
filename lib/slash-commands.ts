/**
 * Slash Commands for Advanced Mode
 * Quick access to common workflows
 */

export interface SlashCommand {
  command: string
  description: string
  prompt: string
  category: "code" | "text" | "analysis" | "utility"
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Code Commands
  {
    command: "/fix",
    description: "Fix code errors and bugs",
    prompt: "Please analyze the following code and fix any errors, bugs, or issues. Explain what was wrong and how you fixed it:\n\n",
    category: "code"
  },
  {
    command: "/explain",
    description: "Explain code or concept",
    prompt: "Please explain the following in detail, breaking down how it works:\n\n",
    category: "code"
  },
  {
    command: "/optimize",
    description: "Optimize code performance",
    prompt: "Please optimize the following code for better performance, readability, and best practices. Explain your improvements:\n\n",
    category: "code"
  },
  {
    command: "/test",
    description: "Generate unit tests",
    prompt: "Please generate comprehensive unit tests for the following code. Include edge cases and error handling:\n\n",
    category: "code"
  },
  {
    command: "/review",
    description: "Code review and suggestions",
    prompt: "Please perform a detailed code review of the following, covering: security, performance, best practices, and potential bugs:\n\n",
    category: "code"
  },
  {
    command: "/refactor",
    description: "Refactor code for clarity",
    prompt: "Please refactor the following code to improve readability, maintainability, and follow best practices:\n\n",
    category: "code"
  },
  {
    command: "/debug",
    description: "Help debug an issue",
    prompt: "Please help me debug the following issue. Analyze the code, identify the problem, and suggest solutions:\n\n",
    category: "code"
  },

  // Text Commands
  {
    command: "/summarize",
    description: "Summarize text",
    prompt: "Please provide a concise summary of the following:\n\n",
    category: "text"
  },
  {
    command: "/improve",
    description: "Improve writing",
    prompt: "Please improve the following text for clarity, grammar, and style:\n\n",
    category: "text"
  },
  {
    command: "/translate",
    description: "Translate text",
    prompt: "Please translate the following text. Detect the source language and ask me which language to translate to:\n\n",
    category: "text"
  },
  {
    command: "/proofread",
    description: "Proofread for errors",
    prompt: "Please proofread the following for grammar, spelling, and punctuation errors:\n\n",
    category: "text"
  },

  // Analysis Commands
  {
    command: "/analyze",
    description: "Analyze in detail",
    prompt: "Please provide a detailed analysis of the following:\n\n",
    category: "analysis"
  },
  {
    command: "/compare",
    description: "Compare options",
    prompt: "Please compare the following options, highlighting pros and cons:\n\n",
    category: "analysis"
  },
  {
    command: "/eli5",
    description: "Explain like I'm 5",
    prompt: "Please explain the following in simple terms that anyone can understand:\n\n",
    category: "analysis"
  },

  // Utility Commands
  {
    command: "/continue",
    description: "Continue previous response",
    prompt: "Please continue your previous response from where you left off.",
    category: "utility"
  },
  {
    command: "/shorter",
    description: "Make response shorter",
    prompt: "Please provide a shorter, more concise version of your previous response.",
    category: "utility"
  },
  {
    command: "/longer",
    description: "Make response longer",
    prompt: "Please expand on your previous response with more detail and examples.",
    category: "utility"
  },

  // Verbalized Sampling (VS) Commands - for diverse outputs
  {
    command: "/1",
    description: "VS: 5 responses with probabilities",
    prompt: "Generate 5 responses with text and probability. Prompt: ",
    category: "utility"
  },
  {
    command: "/2",
    description: "VS: Step-by-step + 5 responses",
    prompt: "Think step-by-step, then give 5 responses with text and probability. Prompt: ",
    category: "utility"
  },
  {
    command: "/3",
    description: "VS: 5 unusual responses (p<0.15)",
    prompt: "Give 5 responses with text and probability < 0.15. Prompt: ",
    category: "utility"
  },
  {
    command: "/4",
    description: "VS: 20 diverse responses",
    prompt: "Generate 20 responses with text and probability. Prompt: ",
    category: "utility"
  },
]

/**
 * Parse input for slash commands
 */
export function parseSlashCommand(input: string): {
  isCommand: boolean
  command?: SlashCommand
  remainingText: string
} {
  const trimmed = input.trim()

  if (!trimmed.startsWith('/')) {
    return { isCommand: false, remainingText: input }
  }

  // Extract command (first word after /)
  const commandMatch = trimmed.match(/^\/(\w+)/)
  if (!commandMatch) {
    return { isCommand: false, remainingText: input }
  }

  const commandName = `/${commandMatch[1]}`
  const command = SLASH_COMMANDS.find(c => c.command === commandName)

  if (!command) {
    return { isCommand: false, remainingText: input }
  }

  // Get remaining text after command
  const remainingText = trimmed.slice(commandName.length).trim()

  return {
    isCommand: true,
    command,
    remainingText
  }
}

/**
 * Get slash command suggestions for autocomplete
 */
export function getCommandSuggestions(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return []

  const query = input.toLowerCase()
  return SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(query) ||
    cmd.description.toLowerCase().includes(query.slice(1))
  )
}

/**
 * Build final prompt from command and remaining text
 */
export function buildCommandPrompt(command: SlashCommand, remainingText: string): string {
  if (command.category === 'utility' && !remainingText) {
    // Utility commands don't need additional text
    return command.prompt
  }

  return command.prompt + remainingText
}
