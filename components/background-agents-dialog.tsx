"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import {
  Bot,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react"
import {
  backgroundAgentsService,
  type BackgroundAgent,
  type AgentResult,
  AGENT_TEMPLATES,
} from "@/lib/background-agents"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface BackgroundAgentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackgroundAgentsDialog({ open, onOpenChange }: BackgroundAgentsDialogProps) {
  const [agents, setAgents] = useState<BackgroundAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<BackgroundAgent | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadAgents()
    }
  }, [open])

  const loadAgents = () => {
    setAgents(backgroundAgentsService.getAllAgents())
  }

  const createAgent = (template: typeof AGENT_TEMPLATES[0]) => {
    const agent = backgroundAgentsService.createAgent(template)
    loadAgents()
    toast({
      title: "Agent created",
      description: `${agent.name} is ready to go!`,
      duration: 2000,
    })
  }

  const toggleAgent = (agent: BackgroundAgent) => {
    if (agent.status === "active") {
      backgroundAgentsService.pauseAgent(agent.id)
      toast({
        title: "Agent paused",
        description: `${agent.name} has been paused`,
        duration: 2000,
      })
    } else {
      backgroundAgentsService.startAgent(agent.id)
      toast({
        title: "Agent started",
        description: `${agent.name} is now running in the background`,
        duration: 2000,
      })
    }
    loadAgents()
  }

  const runAgentNow = async (agent: BackgroundAgent) => {
    setIsRunning(true)
    try {
      const result = await backgroundAgentsService.runAgentNow(agent.id)
      loadAgents()

      if (result.success) {
        toast({
          title: "Agent executed",
          description: result.summary || "Task completed successfully",
          duration: 3000,
        })
      } else {
        toast({
          title: "Agent failed",
          description: result.error || "Task failed",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run agent",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const deleteAgent = (agentId: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      backgroundAgentsService.deleteAgent(agentId)
      loadAgents()
      setSelectedAgent(null)
      toast({
        title: "Agent deleted",
        description: "Agent has been removed",
        duration: 2000,
      })
    }
  }

  const getStatusColor = (status: BackgroundAgent["status"]) => {
    switch (status) {
      case "active": return "text-green-600"
      case "paused": return "text-gray-600"
      case "error": return "text-red-600"
    }
  }

  const getFrequencyLabel = (frequency: BackgroundAgent["frequency"]) => {
    switch (frequency) {
      case "hourly": return "Every hour"
      case "daily": return "Daily"
      case "weekly": return "Weekly"
      case "manual": return "Manual only"
    }
  }

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts)
    const now = Date.now()
    const diff = now - ts

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Background Agents
          </DialogTitle>
          <DialogDescription>
            Autonomous agents that run tasks in the background
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Agents List */}
          <div className="space-y-3 border-r border-border/50 pr-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Agents</h3>
              <Button size="sm" variant="ghost" onClick={loadAgents}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            <ScrollArea className="h-[35vh] min-h-[180px] max-h-[280px]">
              <div className="space-y-2 pr-2">
                {agents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 border-2 border-dashed rounded-lg m-2">
                    <Bot className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No agents yet</p>
                    <p className="text-xs mt-1">Create one from the templates below</p>
                  </div>
                ) : (
                  agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all border shadow-sm hover:shadow-md",
                        selectedAgent?.id === agent.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-sm text-xl shrink-0">
                            {agent.emoji}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm truncate">{agent.name}</div>
                              <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] uppercase tracking-wider shrink-0",
                                agent.status === "active" ? "text-green-600 border-green-200 bg-green-50" :
                                agent.status === "error" ? "text-red-600 border-red-200 bg-red-50" : "text-muted-foreground"
                              )}>
                                {agent.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{getFrequencyLabel(agent.frequency)}</span>
                              {agent.lastRun && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                  <span>{formatTimestamp(agent.lastRun)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <Switch
                            checked={agent.status === "active"}
                            onCheckedChange={() => toggleAgent(agent)}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Agent Templates */}
            <div className="pt-3 border-t border-border/50">
              <h3 className="text-sm font-semibold mb-2">Templates</h3>
              <ScrollArea className="h-[25vh] min-h-[150px] max-h-[220px]">
                <div className="space-y-2 pr-2">
                  {AGENT_TEMPLATES.map((template, i) => (
                    <Card key={i} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-lg shrink-0">
                            {template.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{template.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {template.description}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => createAgent(template)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Agent Details */}
          <div>
            {selectedAgent ? (
              <Card className="p-4 h-full">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-2xl shrink-0">{selectedAgent.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{selectedAgent.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {selectedAgent.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => deleteAgent(selectedAgent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => runAgentNow(selectedAgent)}
                      disabled={isRunning}
                      className="flex-1"
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1.5" />
                          Run Now
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAgent(selectedAgent)}
                      className="flex-1"
                    >
                      {selectedAgent.status === "active" ? (
                        <>
                          <Pause className="h-3 w-3 mr-1.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1.5" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 py-2 border-y border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={selectedAgent.status === "active" ? "default" : "secondary"}>
                        {selectedAgent.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Frequency</span>
                      <span>{getFrequencyLabel(selectedAgent.frequency)}</span>
                    </div>
                    {selectedAgent.lastRun && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Run</span>
                        <span>{formatTimestamp(selectedAgent.lastRun)}</span>
                      </div>
                    )}
                  </div>

                  {/* Recent Results */}
                  {selectedAgent.results && selectedAgent.results.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Recent Results</h4>
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2 pr-2">
                          {selectedAgent.results.map((result) => (
                            <Card key={result.id} className="p-2">
                              <div className="flex items-start gap-2">
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                    {result.summary || (result.success ? "Success" : "Failed")}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {formatTimestamp(result.timestamp)}
                                  </div>
                                  {result.error && (
                                    <div className="text-xs text-destructive mt-1 line-clamp-2">
                                      {result.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6 h-full min-h-[400px] flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Select an agent</p>
                  <p className="text-xs mt-1">to see details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
