"use client"

import { useEffect, useRef, useState, useMemo, memo } from "react"
import mermaid from "mermaid"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Maximize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MermaidDiagramProps {
  chart: string
  className?: string
}

// Initialize mermaid only once
let mermaidInitialized = false

// Check if diagram looks complete (has proper structure)
function isDiagramComplete(chart: string): boolean {
  const trimmed = chart.trim()
  if (trimmed.length < 10) return false

  // Check for common diagram types and their completion patterns
  const hasFlowchart = /^(flowchart|graph)\s+(TD|TB|LR|RL|BT)/i.test(trimmed)
  const hasSequence = /^sequenceDiagram/i.test(trimmed)
  const hasPie = /^pie/i.test(trimmed)
  const hasGantt = /^gantt/i.test(trimmed)
  const hasTimeline = /^timeline/i.test(trimmed)
  const hasClass = /^classDiagram/i.test(trimmed)
  const hasState = /^stateDiagram/i.test(trimmed)
  const hasER = /^erDiagram/i.test(trimmed)

  if (!hasFlowchart && !hasSequence && !hasPie && !hasGantt &&
      !hasTimeline && !hasClass && !hasState && !hasER) {
    return false
  }

  // Check if it has at least some content after the declaration
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 2) return false

  // Check for incomplete brackets/braces
  const openBrackets = (trimmed.match(/\[/g) || []).length
  const closeBrackets = (trimmed.match(/\]/g) || []).length
  const openBraces = (trimmed.match(/\{/g) || []).length
  const closeBraces = (trimmed.match(/\}/g) || []).length
  const openParens = (trimmed.match(/\(/g) || []).length
  const closeParens = (trimmed.match(/\)/g) || []).length

  if (openBrackets !== closeBrackets) return false
  if (openBraces !== closeBraces) return false
  if (openParens !== closeParens) return false

  // Check if last line looks complete (not ending with arrow or pipe)
  const lastLine = lines[lines.length - 1].trim()
  if (lastLine.endsWith('-->') || lastLine.endsWith('->') ||
      lastLine.endsWith('|') || lastLine.endsWith(':')) {
    return false
  }

  return true
}

export const MermaidDiagram = memo(function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isRendering, setIsRendering] = useState(false)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRenderedChart = useRef<string>("")
  const { toast } = useToast()

  // Memoize the cleaned chart to avoid unnecessary processing
  const cleanChart = useMemo(() => chart.trim(), [chart])

  // Check if chart is complete enough to render
  const isComplete = useMemo(() => isDiagramComplete(cleanChart), [cleanChart])

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "var(--font-sans)",
        suppressErrors: true,
        logLevel: 5, // Only fatal errors
      })
      mermaidInitialized = true
    }

    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    // Don't render if:
    // - Chart is too short
    // - Chart is incomplete (still streaming)
    // - Same as last rendered chart
    if (!cleanChart || cleanChart.length < 10) {
      return
    }

    if (!isComplete) {
      // Show loading state while streaming
      if (!svg && !error) {
        setIsRendering(true)
      }
      return
    }

    if (cleanChart === lastRenderedChart.current) {
      return
    }

    // Debounce rendering to avoid rapid re-renders during streaming
    renderTimeoutRef.current = setTimeout(async () => {
      setIsRendering(true)

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart)
        setSvg(renderedSvg)
        setError("")
        lastRenderedChart.current = cleanChart
      } catch (err: any) {
        // Only log once per unique error, not spam
        if (err?.message && !err.message.includes('Parse error')) {
          console.error("Mermaid rendering error:", err)
        }
        setError(err?.message || "Failed to render diagram")
      } finally {
        setIsRendering(false)
      }

      // Cleanup error elements
      const errorDivs = document.querySelectorAll('[id^="d"]')
      errorDivs.forEach(div => {
        if (div.innerHTML?.includes?.('Syntax error')) {
          div.remove()
        }
      })
    }, 300) // 300ms debounce

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [cleanChart, isComplete])

  const handleDownload = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "diagram.svg"
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Diagram saved as SVG",
    })
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }

  // Show loading state while streaming/rendering
  if (isRendering && !svg) {
    return (
      <Card className="p-4 my-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Rendering diagram...</span>
        </div>
      </Card>
    )
  }

  if (error && !svg) {
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5 my-4">
        <p className="text-sm text-destructive">Diagram syntax error</p>
        <pre className="text-xs mt-2 text-muted-foreground overflow-x-auto max-h-20">{chart.substring(0, 200)}...</pre>
      </Card>
    )
  }

  if (!svg) {
    return null
  }

  return (
    <Card className="relative group overflow-hidden my-4">
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2"
          onClick={handleFullscreen}
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className={`p-4 flex items-center justify-center bg-muted/30 ${className || ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </Card>
  )
})
