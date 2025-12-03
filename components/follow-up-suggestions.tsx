"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { CategorizedFollowUp } from "@/lib/follow-up-parser"

interface FollowUpSuggestionsProps {
  suggestions?: string[]
  categorizedSuggestions?: CategorizedFollowUp[]
  onSelect: (suggestion: string) => void
}

export function FollowUpSuggestions({ suggestions, categorizedSuggestions, onSelect }: FollowUpSuggestionsProps) {
  // If we have categorized suggestions, use those
  if (categorizedSuggestions && categorizedSuggestions.length > 0) {
    // Group by category
    const grouped = categorizedSuggestions.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, CategorizedFollowUp[]>)

    const categoryOrder: Array<'quick' | 'deep' | 'related'> = ['quick', 'deep', 'related']

    return (
      <div className="mt-3 space-y-2">
        {categoryOrder.map((category) => {
          const items = grouped[category]
          if (!items || items.length === 0) return null

          return (
            <div key={category} className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground/70 mr-1">
                {items[0].icon} {items[0].label}:
              </span>
              {items.map((item, index) => (
                <Button
                  key={`${category}-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(item.text)}
                  className="group h-auto py-1.5 px-3 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all animate-in fade-in-50 slide-in-from-left-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    {item.text}
                  </span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // Fallback to old format
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="group h-auto py-2 px-3 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <span className="text-xs text-muted-foreground group-hover:text-foreground">
            {suggestion}
          </span>
          <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      ))}
    </div>
  )
}
