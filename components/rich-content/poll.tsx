"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PollData {
  question: string
  options: string[]
  multiSelect?: boolean
  expiresAt?: string
}

interface PollProps {
  poll: PollData
  pollId: string
  className?: string
}

export function Poll({ poll, pollId, className }: PollProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [votes, setVotes] = useState<Record<number, number>>({})
  const [hasVoted, setHasVoted] = useState(false)

  // Load votes from localStorage
  useEffect(() => {
    const savedVotes = localStorage.getItem(`poll-votes-${pollId}`)
    const savedSelected = localStorage.getItem(`poll-selected-${pollId}`)

    if (savedVotes) {
      setVotes(JSON.parse(savedVotes))
    }
    if (savedSelected) {
      setSelected(new Set(JSON.parse(savedSelected)))
      setHasVoted(true)
    }
  }, [pollId])

  const handleToggle = (index: number) => {
    if (hasVoted) return

    setSelected((prev) => {
      const next = new Set(prev)
      if (poll.multiSelect) {
        if (next.has(index)) {
          next.delete(index)
        } else {
          next.add(index)
        }
      } else {
        next.clear()
        next.add(index)
      }
      return next
    })
  }

  const handleVote = () => {
    if (selected.size === 0) return

    const newVotes = { ...votes }
    selected.forEach((index) => {
      newVotes[index] = (newVotes[index] || 0) + 1
    })

    setVotes(newVotes)
    setHasVoted(true)

    // Save to localStorage
    localStorage.setItem(`poll-votes-${pollId}`, JSON.stringify(newVotes))
    localStorage.setItem(`poll-selected-${pollId}`, JSON.stringify([...selected]))
  }

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0)
  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false

  return (
    <Card className={`p-4 my-4 ${className || ""}`}>
      <h3 className="font-semibold text-lg mb-4">{poll.question}</h3>

      <div className="space-y-2 mb-4">
        {poll.options.map((option, index) => {
          const voteCount = votes[index] || 0
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
          const isSelected = selected.has(index)

          return (
            <button
              key={index}
              onClick={() => handleToggle(index)}
              disabled={hasVoted || isExpired}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden",
                hasVoted || isExpired ? "cursor-default" : "cursor-pointer hover:border-primary",
                isSelected && !hasVoted && "border-primary bg-primary/5"
              )}
            >
              {hasVoted && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{option}</span>
                </div>

                {hasVoted && (
                  <div className="text-sm text-muted-foreground">
                    {voteCount} ({percentage.toFixed(0)}%)
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!hasVoted && !isExpired && (
        <Button
          onClick={handleVote}
          disabled={selected.size === 0}
          className="w-full"
          size="sm"
        >
          Vote
        </Button>
      )}

      {hasVoted && (
        <p className="text-xs text-muted-foreground text-center">
          Total votes: {totalVotes}
        </p>
      )}

      {isExpired && (
        <p className="text-xs text-destructive text-center">
          Poll expired
        </p>
      )}

      {poll.multiSelect && !hasVoted && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Select multiple options
        </p>
      )}
    </Card>
  )
}
