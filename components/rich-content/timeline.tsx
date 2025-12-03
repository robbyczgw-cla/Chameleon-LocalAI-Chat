"use client"

import { Card } from "@/components/ui/card"
import { Circle } from "lucide-react"

export interface TimelineEvent {
  date: string
  title: string
  description?: string
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <Card className={`p-6 my-4 ${className || ""}`}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative pl-8">
              {/* Dot */}
              <div className="absolute left-0 top-1 flex items-center justify-center">
                <Circle className="h-4 w-4 fill-primary text-primary" />
              </div>

              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-sm font-bold text-primary">{event.date}</span>
                  <span className="font-semibold">{event.title}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
