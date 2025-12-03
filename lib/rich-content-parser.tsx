import { MermaidDiagram } from "@/components/rich-content/mermaid-diagram"
import { MathRenderer } from "@/components/rich-content/math-renderer"
import { Poll, type PollData } from "@/components/rich-content/poll"
import { Timeline, type TimelineEvent } from "@/components/rich-content/timeline"
import { ProgressBar } from "@/components/rich-content/progress-bar"
import { ComparisonCard, type ComparisonOption } from "@/components/rich-content/comparison-card"
import { RichTable, type RichTableData } from "@/components/rich-content/rich-table"

/**
 * Parse and extract rich content tags from markdown text
 */
export class RichContentParser {
  private static idCounter = 0

  /**
   * Parse [POLL] tags
   * Format: [POLL]{"question": "...", "options": [...], "multiSelect": false}[/POLL]
   */
  static parsePoll(text: string): { content: string; polls: Array<{ id: string; poll: PollData; position: number }> } {
    const polls: Array<{ id: string; poll: PollData; position: number }> = []
    const pollRegex = /\[POLL\]([\s\S]*?)\[\/POLL\]/g

    let content = text
    let match

    while ((match = pollRegex.exec(text)) !== null) {
      try {
        const pollData = JSON.parse(match[1].trim()) as PollData
        const id = `poll-${Date.now()}-${this.idCounter++}`
        polls.push({ id, poll: pollData, position: match.index })

        // Replace with placeholder
        content = content.replace(match[0], `__POLL_${id}__`)
      } catch (err) {
        console.error("Failed to parse poll:", err)
      }
    }

    return { content, polls }
  }

  /**
   * Parse [TIMELINE] tags
   * Format: [TIMELINE]- 2020: Event 1\n- 2021: Event 2[/TIMELINE]
   */
  static parseTimeline(text: string): { content: string; timelines: Array<{ id: string; events: TimelineEvent[]; position: number }> } {
    const timelines: Array<{ id: string; events: TimelineEvent[]; position: number }> = []
    const timelineRegex = /\[TIMELINE\]([\s\S]*?)\[\/TIMELINE\]/g

    let content = text
    let match

    while ((match = timelineRegex.exec(text)) !== null) {
      const lines = match[1].trim().split("\n")
      const events: TimelineEvent[] = []

      for (const line of lines) {
        const trimmed = line.trim().replace(/^[-*]\s*/, "")
        const colonIndex = trimmed.indexOf(":")

        if (colonIndex > 0) {
          const date = trimmed.substring(0, colonIndex).trim()
          const title = trimmed.substring(colonIndex + 1).trim()
          events.push({ date, title })
        }
      }

      if (events.length > 0) {
        const id = `timeline-${Date.now()}-${this.idCounter++}`
        timelines.push({ id, events, position: match.index })
        content = content.replace(match[0], `__TIMELINE_${id}__`)
      }
    }

    return { content, timelines }
  }

  /**
   * Parse [PROGRESS] tags
   * Format: [PROGRESS value=75 max=100 label="Loading..."]
   */
  static parseProgress(text: string): { content: string; progressBars: Array<{ id: string; props: any; position: number }> } {
    const progressBars: Array<{ id: string; props: any; position: number }> = []
    const progressRegex = /\[PROGRESS\s+([^\]]+)\]/g

    let content = text
    let match

    while ((match = progressRegex.exec(text)) !== null) {
      const attrs = match[1]
      const valueMatch = attrs.match(/value=(\d+)/)
      const maxMatch = attrs.match(/max=(\d+)/)
      const labelMatch = attrs.match(/label="([^"]*)"/)

      const props = {
        value: valueMatch ? parseInt(valueMatch[1]) : 0,
        max: maxMatch ? parseInt(maxMatch[1]) : 100,
        label: labelMatch ? labelMatch[1] : undefined,
      }

      const id = `progress-${Date.now()}-${this.idCounter++}`
      progressBars.push({ id, props, position: match.index })
      content = content.replace(match[0], `__PROGRESS_${id}__`)
    }

    return { content, progressBars }
  }

  /**
   * Parse [COMPARE] tags
   * Format: [COMPARE]## Option A\n- Pro 1\n- Con 1\n\n## Option B\n- Pro 1[/COMPARE]
   */
  static parseComparison(text: string): { content: string; comparisons: Array<{ id: string; options: ComparisonOption[]; position: number }> } {
    const comparisons: Array<{ id: string; options: ComparisonOption[]; position: number }> = []
    const compareRegex = /\[COMPARE\]([\s\S]*?)\[\/COMPARE\]/g

    let content = text
    let match

    while ((match = compareRegex.exec(text)) !== null) {
      const sections = match[1].split(/##\s+/).filter((s) => s.trim())
      const options: ComparisonOption[] = []

      for (const section of sections) {
        const lines = section.split("\n")
        const title = lines[0].trim()
        const items = lines
          .slice(1)
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => {
            const text = line.trim().replace(/^[-*]\s*/, "")
            // Determine if it's a pro or con (simple heuristic: contains negative words = con)
            const negativeWords = ["con", "disadvantage", "slow", "expensive", "hard", "difficult", "bad"]
            const type = negativeWords.some((word) => text.toLowerCase().includes(word)) ? "con" : "pro"
            return { text, type }
          })

        if (title && items.length > 0) {
          options.push({ title, items })
        }
      }

      if (options.length > 0) {
        const id = `compare-${Date.now()}-${this.idCounter++}`
        comparisons.push({ id, options, position: match.index })
        content = content.replace(match[0], `__COMPARE_${id}__`)
      }
    }

    return { content, comparisons }
  }

  /**
   * Parse [TABLE] tags with sortable/searchable attributes
   * Format: [TABLE sortable searchable]\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |[/TABLE]
   */
  static parseTable(text: string): { content: string; tables: Array<{ id: string; data: RichTableData; position: number }> } {
    const tables: Array<{ id: string; data: RichTableData; position: number }> = []
    const tableRegex = /\[TABLE([^\]]*)\]([\s\S]*?)\[\/TABLE\]/g

    let content = text
    let match

    while ((match = tableRegex.exec(text)) !== null) {
      const attrs = match[1] || ""
      const sortable = attrs.includes("sortable")
      const searchable = attrs.includes("searchable")
      const tableContent = match[2].trim()

      // Parse markdown table
      const lines = tableContent.split("\n").filter((l) => l.trim())
      if (lines.length < 2) continue

      const headers = lines[0]
        .split("|")
        .filter((h) => h.trim())
        .map((h) => h.trim())

      const rows = lines
        .slice(2) // Skip header separator line
        .map((line) =>
          line
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim())
        )
        .filter((row) => row.length > 0)

      if (headers.length > 0 && rows.length > 0) {
        const id = `table-${Date.now()}-${this.idCounter++}`
        tables.push({
          id,
          data: { headers, rows, sortable, searchable },
          position: match.index,
        })
        content = content.replace(match[0], `__TABLE_${id}__`)
      }
    }

    return { content, tables }
  }

  /**
   * Parse all rich content from text
   */
  static parseAll(text: string) {
    const { content: c1, polls } = this.parsePoll(text)
    const { content: c2, timelines } = this.parseTimeline(c1)
    const { content: c3, progressBars } = this.parseProgress(c2)
    const { content: c4, comparisons } = this.parseComparison(c3)
    const { content: c5, tables } = this.parseTable(c4)

    return {
      content: c5,
      richContent: {
        polls,
        timelines,
        progressBars,
        comparisons,
        tables,
      },
    }
  }

  /**
   * Render rich content component by placeholder ID
   */
  static renderComponent(placeholder: string, richContent: any) {
    // Poll
    if (placeholder.startsWith("__POLL_")) {
      const id = placeholder.replace("__POLL_", "").replace("__", "")
      const poll = richContent.polls.find((p: any) => p.id === id)
      if (poll) {
        return <Poll key={id} pollId={id} poll={poll.poll} />
      }
    }

    // Timeline
    if (placeholder.startsWith("__TIMELINE_")) {
      const id = placeholder.replace("__TIMELINE_", "").replace("__", "")
      const timeline = richContent.timelines.find((t: any) => t.id === id)
      if (timeline) {
        return <Timeline key={id} events={timeline.events} />
      }
    }

    // Progress
    if (placeholder.startsWith("__PROGRESS_")) {
      const id = placeholder.replace("__PROGRESS_", "").replace("__", "")
      const progress = richContent.progressBars.find((p: any) => p.id === id)
      if (progress) {
        return <ProgressBar key={id} {...progress.props} />
      }
    }

    // Comparison
    if (placeholder.startsWith("__COMPARE_")) {
      const id = placeholder.replace("__COMPARE_", "").replace("__", "")
      const comparison = richContent.comparisons.find((c: any) => c.id === id)
      if (comparison) {
        return <ComparisonCard key={id} options={comparison.options} />
      }
    }

    // Table
    if (placeholder.startsWith("__TABLE_")) {
      const id = placeholder.replace("__TABLE_", "").replace("__", "")
      const table = richContent.tables.find((t: any) => t.id === id)
      if (table) {
        return <RichTable key={id} data={table.data} />
      }
    }

    return null
  }
}
