"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCostTracker, type CostStats } from "@/lib/cost-tracker"
import { Download, Trash2, TrendingUp, DollarSign, MessageSquare, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CostTrackerDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CostTrackerDashboard({ open, onOpenChange }: CostTrackerDashboardProps) {
  const [stats, setStats] = useState<CostStats | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d")
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadStats()
    }
  }, [open, timeRange])

  const loadStats = () => {
    const tracker = getCostTracker()

    let range
    if (timeRange === "7d") {
      range = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }
    } else if (timeRange === "30d") {
      range = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }
    }

    const statsData = tracker.getStats(range)
    setStats(statsData)
  }

  const handleExport = () => {
    const tracker = getCostTracker()
    const json = tracker.exportToJSON()

    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cost-tracker-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: "Cost data exported successfully",
    })
  }

  const handleClear = () => {
    if (!confirm("Are you sure you want to clear all cost tracking data? This cannot be undone.")) {
      return
    }

    const tracker = getCostTracker()
    tracker.clearAll()
    loadStats()

    toast({
      title: "Cleared",
      description: "All cost tracking data has been cleared",
      variant: "destructive",
    })
  }

  if (!stats) return null

  const topModels = Object.entries(stats.costByModel)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const last7DaysCost = stats.costByDay.slice(-7).reduce((sum, day) => sum + day.cost, 0)
  const projectedMonthlyCost = last7DaysCost * 4.3 // Rough monthly projection

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Tracker Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7d")}
            >
              Last 7 Days
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30d")}
            >
              Last 30 Days
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
            >
              All Time
            </Button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Total Cost
              </div>
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                Total Tokens
              </div>
              <div className="text-2xl font-bold">{(stats.totalTokens / 1000).toFixed(1)}K</div>
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                Chats
              </div>
              <div className="text-2xl font-bold">{stats.totalChats}</div>
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Avg/Message
              </div>
              <div className="text-2xl font-bold">${stats.avgCostPerMessage.toFixed(4)}</div>
            </div>
          </div>

          {/* Projection */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="text-sm font-medium mb-2">📊 Monthly Projection</div>
            <div className="text-lg">
              Based on last 7 days: <span className="font-bold text-primary">${projectedMonthlyCost.toFixed(2)}</span>{" "}
              / month
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ~${(projectedMonthlyCost * 12).toFixed(2)} / year
            </div>
          </div>

          {/* Cost by Model */}
          <div className="space-y-2">
            <div className="text-sm font-medium">💰 Cost by Model</div>
            <div className="space-y-2">
              {topModels.length > 0 ? (
                topModels.map(([model, cost]) => (
                  <div key={model} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-mono truncate flex-1">{model}</span>
                    <span className="text-sm font-bold ml-2">${cost.toFixed(4)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-3 text-center border rounded-lg">
                  No cost data available
                </div>
              )}
            </div>
          </div>

          {/* Cost Over Time */}
          {stats.costByDay.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">📈 Cost Over Time (Last 14 Days)</div>
              <div className="space-y-1">
                {stats.costByDay.slice(-14).map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-24">{day.date}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${(day.cost / Math.max(...stats.costByDay.map((d) => d.cost))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-16 text-right">${day.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="destructive" onClick={handleClear} className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
