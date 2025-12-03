/**
 * Response Analyzer - Analyzes AI responses for various metrics
 */

export interface ResponseAnalysis {
  sentiment: "positive" | "neutral" | "negative"
  confidence: "high" | "medium" | "low"
  hedgingPhrases: string[]
  citations: string[]
  wordCount: number
  readingTimeMinutes: number
  complexity: "simple" | "moderate" | "complex"
  tone: string[]
}

export class ResponseAnalyzer {
  static analyze(response: string): ResponseAnalysis {
    return {
      sentiment: this.detectSentiment(response),
      confidence: this.detectConfidence(response),
      hedgingPhrases: this.findHedgingPhrases(response),
      citations: this.findCitations(response),
      wordCount: this.countWords(response),
      readingTimeMinutes: this.estimateReadingTime(response),
      complexity: this.assessComplexity(response),
      tone: this.detectTone(response),
    }
  }

  private static detectSentiment(text: string): "positive" | "neutral" | "negative" {
    const positiveWords = [
      "gut",
      "toll",
      "perfekt",
      "ausgezeichnet",
      "wunderbar",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "fantastic",
      "helpful",
      "success",
      "correct",
    ]
    const negativeWords = [
      "schlecht",
      "problem",
      "fehler",
      "leider",
      "schwierig",
      "bad",
      "error",
      "wrong",
      "issue",
      "fail",
      "difficult",
      "unfortunately",
    ]

    const lowerText = text.toLowerCase()
    const posCount = positiveWords.filter((w) => lowerText.includes(w)).length
    const negCount = negativeWords.filter((w) => lowerText.includes(w)).length

    if (posCount > negCount) return "positive"
    if (negCount > posCount) return "negative"
    return "neutral"
  }

  private static detectConfidence(text: string): "high" | "medium" | "low" {
    const hedgingPhrases = this.findHedgingPhrases(text)

    if (hedgingPhrases.length === 0) return "high"
    if (hedgingPhrases.length <= 2) return "medium"
    return "low"
  }

  private static findHedgingPhrases(text: string): string[] {
    const phrases = [
      "möglicherweise",
      "vielleicht",
      "könnte",
      "würde",
      "eventuell",
      "wahrscheinlich",
      "ich denke",
      "ich glaube",
      "vermutlich",
      "might",
      "maybe",
      "possibly",
      "perhaps",
      "probably",
      "I think",
      "I believe",
      "could be",
      "may be",
      "seems like",
      "appears to",
    ]

    const lowerText = text.toLowerCase()
    return phrases.filter((phrase) => lowerText.includes(phrase.toLowerCase()))
  }

  private static findCitations(text: string): string[] {
    const citations: string[] = []

    // Find patterns like [1], (Source: ...), "According to..."
    const patterns = [
      /\[\d+\]/g,
      /\(Source:.*?\)/gi,
      /According to.*?[,.]/gi,
      /Research shows.*?[,.]/gi,
      /Studies indicate.*?[,.]/gi,
      /Based on.*?[,.]/gi,
    ]

    patterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) citations.push(...matches)
    })

    return citations
  }

  private static countWords(text: string): number {
    // Remove code blocks first
    const withoutCode = text.replace(/```[\s\S]*?```/g, "")
    return withoutCode.split(/\s+/).filter((w) => w.length > 0).length
  }

  private static estimateReadingTime(text: string): number {
    const wordsPerMinute = 200
    const words = this.countWords(text)
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }

  private static assessComplexity(text: string): "simple" | "moderate" | "complex" {
    const words = text.split(/\s+/).filter((w) => w.length > 0)
    if (words.length === 0) return "simple"

    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgSentenceLength = words.length / Math.max(sentences.length, 1)

    // Simple heuristic
    if (avgWordLength < 5 && avgSentenceLength < 15) return "simple"
    if (avgWordLength > 7 || avgSentenceLength > 25) return "complex"
    return "moderate"
  }

  private static detectTone(text: string): string[] {
    const tones: string[] = []
    const lowerText = text.toLowerCase()

    const toneIndicators = {
      professional: ["jedoch", "daher", "somit", "furthermore", "therefore", "consequently"],
      casual: ["hey", "cool", "ok", "yeah", "naja", "klar", "sure"],
      empathetic: ["verstehe", "nachvollziehen", "understand", "feel", "appreciate"],
      technical: ["implementierung", "konfiguration", "parameter", "interface", "function", "variable"],
      enthusiastic: ["!", "super", "toll", "awesome", "great!", "fantastic", "amazing"],
    }

    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      if (indicators.some((ind) => lowerText.includes(ind.toLowerCase()))) {
        tones.push(tone)
      }
    })

    return tones.length > 0 ? tones : ["neutral"]
  }
}
