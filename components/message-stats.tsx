"use client"

import type { Message } from "@/types"

interface MessageStatsProps {
  message: Message
}

export function MessageStats({ message }: MessageStatsProps) {
  if (!message.stats && !message.tokens) return null

  const { stats, tokens } = message

  // Calculate cost (rough estimates, adjust based on actual model pricing)
  const calculateCost = () => {
    if (!tokens) return null

    // Average pricing: $0.01 per 1K input tokens, $0.03 per 1K output tokens
    const inputCost = (tokens.prompt / 1000) * 0.01
    const outputCost = (tokens.completion / 1000) * 0.03
    const total = inputCost + outputCost

    return {
      input: inputCost.toFixed(4),
      output: outputCost.toFixed(4),
      total: total.toFixed(4)
    }
  }

  const cost = stats?.cost || (calculateCost()?.total ? parseFloat(calculateCost()!.total) : null)

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 text-xs font-mono space-y-2">
      <div className="font-semibold text-muted-foreground mb-2">📊 Detailed Stats</div>

      {/* Token Usage */}
      {tokens && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-muted-foreground">Input Tokens:</div>
          <div className="font-medium">{tokens.prompt.toLocaleString()}</div>

          <div className="text-muted-foreground">Output Tokens:</div>
          <div className="font-medium">{tokens.completion.toLocaleString()}</div>

          <div className="text-muted-foreground">Total Tokens:</div>
          <div className="font-medium">{tokens.total.toLocaleString()}</div>
        </div>
      )}

      {/* Cost */}
      {cost && (
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-x-4">
            <div className="text-muted-foreground">Cost:</div>
            <div className="font-medium text-green-600 dark:text-green-400">
              ${typeof cost === 'number' ? cost.toFixed(4) : cost}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <>
          {(stats.responseTime || stats.tokensPerSecond || stats.firstTokenTime) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">⚡ Performance</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.responseTime && (
                  <>
                    <div className="text-muted-foreground">Response Time:</div>
                    <div className="font-medium">{stats.responseTime.toFixed(2)}s</div>
                  </>
                )}

                {stats.tokensPerSecond && (
                  <>
                    <div className="text-muted-foreground">Tokens/sec:</div>
                    <div className="font-medium">{Math.round(stats.tokensPerSecond)} t/s</div>
                  </>
                )}

                {stats.firstTokenTime && (
                  <>
                    <div className="text-muted-foreground">First Token (TTFT):</div>
                    <div className="font-medium">{stats.firstTokenTime.toFixed(2)}s</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Model Info */}
          {(stats.model || stats.stopReason) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">🎛️ Generation</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.model && (
                  <>
                    <div className="text-muted-foreground">Model:</div>
                    <div className="font-medium truncate">{stats.model}</div>
                  </>
                )}

                {stats.stopReason && (
                  <>
                    <div className="text-muted-foreground">Stop Reason:</div>
                    <div className="font-medium">{stats.stopReason}</div>
                  </>
                )}

                {tokens && (
                  <>
                    <div className="text-muted-foreground">Token Efficiency:</div>
                    <div className="font-medium">
                      {((tokens.completion / tokens.total) * 100).toFixed(0)}% output
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search Stats */}
          {(stats.searchProvider || stats.searchResults !== undefined) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">🔍 Search</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.searchProvider && (
                  <>
                    <div className="text-muted-foreground">Provider:</div>
                    <div className="font-medium">{stats.searchProvider}</div>
                  </>
                )}

                {stats.searchResults !== undefined && (
                  <>
                    <div className="text-muted-foreground">Results Found:</div>
                    <div className="font-medium">{stats.searchResults}</div>
                  </>
                )}

                {stats.searchTime && (
                  <>
                    <div className="text-muted-foreground">Search Time:</div>
                    <div className="font-medium">{stats.searchTime.toFixed(2)}s</div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
