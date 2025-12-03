"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, Target, AlertCircle, BookOpen, Clock, FileText, Quote } from "lucide-react"
import { type ResponseAnalysis } from "@/lib/response-analyzer"
import { cn } from "@/lib/utils"

interface ResponseAnalysisPanelProps {
  analysis: ResponseAnalysis
  className?: string
}

export function ResponseAnalysisPanel({ analysis, className }: ResponseAnalysisPanelProps) {
  const getSentimentColor = () => {
    if (analysis.sentiment === "positive") return "bg-green-500"
    if (analysis.sentiment === "negative") return "bg-red-500"
    return "bg-gray-500"
  }

  const getConfidenceColor = () => {
    if (analysis.confidence === "high") return "text-green-600 dark:text-green-400"
    if (analysis.confidence === "low") return "text-red-600 dark:text-red-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  const getComplexityColor = () => {
    if (analysis.complexity === "simple") return "text-green-600 dark:text-green-400"
    if (analysis.complexity === "complex") return "text-orange-600 dark:text-orange-400"
    return "text-blue-600 dark:text-blue-400"
  }

  return (
    <Card className={cn("p-3 md:p-4 space-y-3 bg-muted/30 border-border/60", className)}>
      <h4 className="text-xs md:text-sm font-semibold flex items-center gap-2">
        <Target className="h-3.5 w-3.5 md:h-4 md:w-4" />
        Response Analysis
      </h4>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Sentiment */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getSentimentColor())} />
            <span className="font-medium capitalize">{analysis.sentiment}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Confidence</span>
          </div>
          <span className={cn("font-medium capitalize", getConfidenceColor())}>{analysis.confidence}</span>
        </div>

        {/* Word Count */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Words</span>
          </div>
          <span className="font-mono font-medium">{analysis.wordCount.toLocaleString()}</span>
        </div>

        {/* Reading Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Read Time</span>
          </div>
          <span className="font-medium">{analysis.readingTimeMinutes} min</span>
        </div>

        {/* Complexity */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Complexity</span>
          </div>
          <span className={cn("font-medium capitalize", getComplexityColor())}>{analysis.complexity}</span>
        </div>

        {/* Citations Count */}
        {analysis.citations.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Quote className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Citations</span>
            </div>
            <span className="font-medium">{analysis.citations.length}</span>
          </div>
        )}
      </div>

      {/* Hedging Phrases */}
      {analysis.hedgingPhrases.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              Hedging Detected ({analysis.hedgingPhrases.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.hedgingPhrases.slice(0, 5).map((phrase, idx) => (
              <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                &quot;{phrase}&quot;
              </Badge>
            ))}
            {analysis.hedgingPhrases.length > 5 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{analysis.hedgingPhrases.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tone */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Tone</span>
        <div className="flex flex-wrap gap-1">
          {analysis.tone.map((t, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 capitalize">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
