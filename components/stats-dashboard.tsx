"use client"

import { UsageStatsWidget } from "@/components/usage-stats-widget"
import { Card } from "@/components/ui/card"
import { useApp } from "@/contexts/app-context"
import { BarChart3, MessageSquare, Clock, TrendingUp } from "lucide-react"

export function StatsDashboard() {
  const { chats } = useApp()

  const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
  const totalChats = chats.length

  // Calculate average messages per chat
  const avgMessagesPerChat = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : 0

  // Get most active time (simplified - just count chats by hour of creation)
  const chatsByHour: Record<number, number> = {}
  chats.forEach((chat) => {
    const hour = new Date(chat.createdAt).getHours()
    chatsByHour[hour] = (chatsByHour[hour] || 0) + 1
  })
  const mostActiveHour = Object.entries(chatsByHour).sort(([, a], [, b]) => b - a)[0]
  const mostActiveTimeDisplay = mostActiveHour ? `${mostActiveHour[0].padStart(2, "0")}:00` : "N/A"

  const modelUsage: Record<string, number> = {}
  chats.forEach((chat) => {
    const modelName = chat.model?.split("/").pop() || "Unknown"
    modelUsage[modelName] = (modelUsage[modelName] || 0) + 1
  })

  const topModels = Object.entries(modelUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold">Usage Statistics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your API usage, costs, and chat activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chats</p>
                <p className="text-2xl font-bold">{totalChats}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-bold">{avgMessagesPerChat}</p>
                <p className="text-xs text-muted-foreground">msg/chat</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Active Time</p>
                <p className="text-2xl font-bold">{mostActiveTimeDisplay}</p>
              </div>
            </div>
          </Card>
        </div>

        <UsageStatsWidget />

        {topModels.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Most Used Models</h3>
            <div className="space-y-3">
              {topModels.map(([model, count]) => (
                <div key={model}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{model}</span>
                    <span className="text-muted-foreground">{count} chats</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70"
                      style={{ width: `${(count / totalChats) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
