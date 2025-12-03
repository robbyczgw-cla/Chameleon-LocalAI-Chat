export interface CategorizedFollowUp {
  category: 'quick' | 'deep' | 'related'
  label: string
  icon: string
  text: string
}

export interface ParsedMessage {
  content: string
  followUps: string[]
  categorizedFollowUps: CategorizedFollowUp[]
  suggestedPrompts: string[]
}

const CATEGORY_CONFIG = {
  quick: { label: 'Schnell', icon: '⚡' },
  deep: { label: 'Tiefer', icon: '🧠' },
  related: { label: 'Verwandt', icon: '🔗' }
}

/**
 * Parse categorized follow-ups from line-based format
 * Supports formats like:
 *
 * quick: prompt1 | prompt2
 * deep: prompt3 | prompt4
 *
 * OR multi-line:
 *
 * quick:
 *   - What are your favorite things?
 *   - Can you help me with something?
 * deep:
 *   * Tell me more about...
 */
function parseLineBasedFormat(innerContent: string): CategorizedFollowUp[] {
  const categorizedFollowUps: CategorizedFollowUp[] = []
  const lines = innerContent.split('\n')
  let currentCategory: 'quick' | 'deep' | 'related' | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Check if this line is a category header (e.g., "quick:", "deep:", "related:")
    const categoryMatch = trimmedLine.match(/^(quick|deep|related)\s*:\s*(.*)$/i)

    if (categoryMatch) {
      const categoryName = categoryMatch[1].toLowerCase() as 'quick' | 'deep' | 'related'
      const restOfLine = categoryMatch[2].trim()
      currentCategory = categoryName

      // Check if there are pipe-separated values on the same line
      if (restOfLine) {
        const prompts = restOfLine.split('|').map(s => s.trim()).filter(s => s.length > 0)
        prompts.forEach(prompt => {
          categorizedFollowUps.push({
            category: categoryName,
            label: CATEGORY_CONFIG[categoryName].label,
            icon: CATEGORY_CONFIG[categoryName].icon,
            text: cleanPromptText(prompt)
          })
        })
      }
    } else if (currentCategory) {
      // This is a prompt line under the current category
      // Remove leading bullets, dashes, asterisks, numbers
      const cleanedPrompt = cleanPromptText(trimmedLine)
      if (cleanedPrompt.length > 0) {
        categorizedFollowUps.push({
          category: currentCategory,
          label: CATEGORY_CONFIG[currentCategory].label,
          icon: CATEGORY_CONFIG[currentCategory].icon,
          text: cleanedPrompt
        })
      }
    }
  }

  return categorizedFollowUps
}

/**
 * Clean prompt text by removing list markers, quotes, etc.
 */
function cleanPromptText(text: string): string {
  return text
    // Remove leading bullets, dashes, asterisks, numbers with dots/parens
    .replace(/^[\s]*[-*•·▪▸►]\s*/, '')
    .replace(/^[\s]*\d+[.)]\s*/, '')
    // Remove surrounding quotes
    .replace(/^["'`]+|["'`]+$/g, '')
    // Remove trailing punctuation if it's just a question marker repeated
    .replace(/\?{2,}$/, '?')
    .trim()
}

/**
 * Try to extract JSON from potentially malformed content
 */
function tryParseJSON(content: string): any | null {
  // First try direct parse
  try {
    return JSON.parse(content)
  } catch (e) {
    // Try to find JSON object within the content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e2) {
        // Try fixing common issues: single quotes, trailing commas
        try {
          const fixed = jsonMatch[0]
            .replace(/'/g, '"')
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/(\w+):/g, '"$1":')
          return JSON.parse(fixed)
        } catch (e3) {
          return null
        }
      }
    }
    return null
  }
}

export function parseFollowUps(content: string): ParsedMessage {
  let cleanContent = content

  // Extract follow-up questions (AI asks user) from [FOLLOWUP]...[/FOLLOWUP] tags
  // Use a more flexible regex that handles newlines and whitespace
  const followUpRegex = /\[FOLLOWUP\]([\s\S]*?)\[\/FOLLOWUP\]/gi
  const followUpMatches = content.match(followUpRegex)
  const followUps: string[] = []
  const categorizedFollowUps: CategorizedFollowUp[] = []

  if (followUpMatches && followUpMatches.length > 0) {
    followUpMatches.forEach(match => {
      // Remove the entire match from content
      cleanContent = cleanContent.replace(match, '').trim()

      // Extract inner content
      const innerContent = match
        .replace(/\[FOLLOWUP\]/gi, '')
        .replace(/\[\/FOLLOWUP\]/gi, '')
        .trim()

      if (!innerContent) return

      // Strategy 1: Try to parse as JSON (structured format from capable models)
      const parsed = tryParseJSON(innerContent)
      if (parsed && typeof parsed === 'object') {
        // Check if it's the categorized format
        if (parsed.quick || parsed.deep || parsed.related) {
          Object.entries(parsed).forEach(([category, suggestions]) => {
            if (Array.isArray(suggestions) && (category === 'quick' || category === 'deep' || category === 'related')) {
              suggestions.forEach((suggestion: string) => {
                const trimmed = cleanPromptText(String(suggestion))
                if (trimmed.length > 0) {
                  categorizedFollowUps.push({
                    category: category as 'quick' | 'deep' | 'related',
                    label: CATEGORY_CONFIG[category].label,
                    icon: CATEGORY_CONFIG[category].icon,
                    text: trimmed
                  })
                }
              })
            }
          })
          return
        }
      }

      // Strategy 2: Try line-based format (for local models)
      // Check if content contains category headers
      if (/^(quick|deep|related)\s*:/im.test(innerContent)) {
        const lineBasedResults = parseLineBasedFormat(innerContent)
        if (lineBasedResults.length > 0) {
          categorizedFollowUps.push(...lineBasedResults)
          return
        }
      }

      // Strategy 3: Fallback to pipe-separated format (simple list)
      const suggestions = innerContent
        .split(/[|,\n]/)
        .map(s => cleanPromptText(s))
        .filter(s => s.length > 0 && s.length < 200) // Filter out too long or empty

      if (suggestions.length > 0) {
        // Distribute to categories if we have multiple
        suggestions.forEach((suggestion, index) => {
          const categories: Array<'quick' | 'deep' | 'related'> = ['quick', 'deep', 'related']
          const category = categories[index % 3]
          categorizedFollowUps.push({
            category,
            label: CATEGORY_CONFIG[category].label,
            icon: CATEGORY_CONFIG[category].icon,
            text: suggestion
          })
        })
        // Also add to legacy followUps array
        followUps.push(...suggestions)
      }
    })
  }

  // Also try to find follow-ups that might be outside of tags (some models ignore tags)
  // Look for patterns like "Follow-up questions:" or "Suggested questions:"
  if (categorizedFollowUps.length === 0) {
    const informalPatterns = [
      /(?:follow[- ]?up|weitere|zusätzliche)\s*(?:fragen|questions?)?\s*:?\s*([\s\S]*?)(?=\n\n|$)/gi,
      /(?:you (?:might|could|may) (?:also )?ask|sie könnten auch fragen)\s*:?\s*([\s\S]*?)(?=\n\n|$)/gi
    ]

    for (const pattern of informalPatterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          const lines = match[1].split('\n')
            .map(l => cleanPromptText(l))
            .filter(l => l.length > 5 && l.length < 200)

          if (lines.length > 0) {
            lines.forEach((line, index) => {
              const categories: Array<'quick' | 'deep' | 'related'> = ['quick', 'deep', 'related']
              const category = categories[index % 3]
              categorizedFollowUps.push({
                category,
                label: CATEGORY_CONFIG[category].label,
                icon: CATEGORY_CONFIG[category].icon,
                text: line
              })
            })
            // Remove the matched section from clean content
            cleanContent = cleanContent.replace(match[0], '').trim()
          }
        }
      }
    }
  }

  // Extract suggested prompts (user could ask AI) from [SUGGESTED]...[/SUGGESTED] tags
  const suggestedRegex = /\[SUGGESTED\]([\s\S]*?)\[\/SUGGESTED\]/gi
  const suggestedMatches = content.match(suggestedRegex)
  const suggestedPrompts: string[] = []

  if (suggestedMatches && suggestedMatches.length > 0) {
    suggestedMatches.forEach(match => {
      cleanContent = cleanContent.replace(match, '').trim()
      const innerContent = match
        .replace(/\[SUGGESTED\]/gi, '')
        .replace(/\[\/SUGGESTED\]/gi, '')
        .trim()
      const suggestions = innerContent
        .split(/[|,\n]/)
        .map(s => cleanPromptText(s))
        .filter(s => s.length > 0)
      suggestedPrompts.push(...suggestions)
    })
  }

  // Clean up any remaining artifacts
  cleanContent = cleanContent
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .trim()

  return {
    content: cleanContent,
    followUps: followUps.slice(0, 3), // Max 3 follow-up questions (old format)
    categorizedFollowUps: categorizedFollowUps.slice(0, 9), // Max 9 categorized (3 per category)
    suggestedPrompts: suggestedPrompts.slice(0, 3) // Max 3 suggested prompts
  }
}
