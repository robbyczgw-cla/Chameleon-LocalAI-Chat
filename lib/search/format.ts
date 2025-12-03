/**
 * Unified Search Result Formatting
 * Single implementation used by all search providers
 */

import type { SearchResult, SearchResponse } from "./types"

/**
 * Format search results for LLM context (standard format)
 */
export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map(
      (result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
${result.content}
${result.publishedDate ? `Published: ${result.publishedDate}` : ""}
`
    )
    .join("\n---\n")
}

/**
 * Format search results with highlights (for Exa/RAG)
 */
export function formatSearchResultsWithHighlights(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      let formatted = `
[${index + 1}] ${result.title}
URL: ${result.url}`

      if (result.highlights?.length) {
        formatted += `\nKey Points:\n${result.highlights.map(h => `• ${h}`).join("\n")}`
      }

      if (result.content && result.content !== result.highlights?.join(" ")) {
        const contentPreview = result.content.length > 1500
          ? result.content.substring(0, 1500) + "..."
          : result.content
        formatted += `\nContent: ${contentPreview}`
      }

      if (result.summary) {
        formatted += `\nSummary: ${result.summary}`
      }

      if (result.publishedDate) {
        formatted += `\nPublished: ${result.publishedDate}`
      }

      return formatted
    })
    .join("\n\n---\n")
}

/**
 * Format search results as compact list
 */
export function formatSearchResultsCompact(results: SearchResult[]): string {
  return results
    .map((result, index) =>
      `[${index + 1}] ${result.title} - ${result.url}`
    )
    .join("\n")
}

/**
 * Build search context for LLM prompt
 */
export function buildSearchContext(
  response: SearchResponse,
  options: {
    includeImages?: boolean
    language?: "en" | "de"
  } = {}
): string {
  const { includeImages = false, language = "de" } = options

  const labels = {
    de: {
      searchFor: "Websuchergebnisse für",
      summary: "Zusammenfassung",
      results: "Detaillierte Ergebnisse",
      images: "Bilder",
      optimized: "Optimierte Suche",
      instruction: "Bitte verwenden Sie die obigen Websuchergebnisse, um eine genaue und aktuelle Antwort auf die Frage des Benutzers zu geben.",
      imageInstruction: " Bei Bildern bitte die URLs im Markdown-Format einbinden: ![Beschreibung](URL)"
    },
    en: {
      searchFor: "Web search results for",
      summary: "Summary",
      results: "Detailed results",
      images: "Images",
      optimized: "Optimized search",
      instruction: "Please use the above web search results to provide an accurate and up-to-date answer to the user's question.",
      imageInstruction: " For images, please include URLs in Markdown format: ![Description](URL)"
    }
  }

  const l = labels[language]
  const providerEmoji = {
    tavily: "🌐",
    serper: "🔍",
    exa: "🔮"
  }

  let context = `${providerEmoji[response.provider]} ${l.searchFor}: "${response.query}"\n`

  // Add Exa autoprompt if available
  if (response.metadata?.autoprompt) {
    context += `(${l.optimized}: "${response.metadata.autoprompt}")\n`
  }
  context += "\n"

  // Add answer/summary if available
  if (response.answer) {
    context += `${l.summary}: ${response.answer}\n\n`
  }

  // Add results - use highlights format for Exa, standard for others
  if (response.provider === "exa") {
    context += `${l.results}:\n${formatSearchResultsWithHighlights(response.results)}`
  } else {
    context += `${l.results}:\n${formatSearchResults(response.results)}`
  }

  // Add images if available (as markdown images for rendering)
  if (includeImages && response.images?.length) {
    context += `\n\n📸 ${l.images}:\n${response.images.slice(0, 5).map((img, i) => `![${l.images} ${i + 1}](${img})`).join('\n\n')}`
  }

  context += `\n\n${l.instruction}${includeImages && response.images?.length ? l.imageInstruction : ''}`

  return context
}
