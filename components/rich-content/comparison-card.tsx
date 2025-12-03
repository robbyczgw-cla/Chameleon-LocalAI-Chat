"use client"

import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

export interface ComparisonOption {
  title: string
  items: Array<{ text: string; type: "pro" | "con" }>
}

interface ComparisonCardProps {
  options: ComparisonOption[]
  className?: string
}

export function ComparisonCard({ options, className }: ComparisonCardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(options.length, 3)} gap-4 my-4 ${className || ""}`}>
      {options.map((option, index) => (
        <Card key={index} className="p-4">
          <h3 className="font-semibold text-lg mb-4 pb-2 border-b">{option.title}</h3>

          <div className="space-y-2">
            {option.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start gap-2">
                {item.type === "pro" ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
