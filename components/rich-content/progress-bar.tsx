"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <Card className={`p-4 my-4 ${className || ""}`}>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}

      <Progress value={percentage} className="h-3" />

      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>
          {value} / {max}
        </span>
        {showPercentage && <span>{percentage}%</span>}
      </div>
    </Card>
  )
}
