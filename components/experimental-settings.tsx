"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/contexts/app-context"
import { FlaskRound, AlertTriangle, Zap, Sparkles, Search } from "lucide-react"
import { VisualizationSettingsPanel } from "@/components/visualization-settings-panel"
import type { UnifiedVisualizationSettings } from "@/types"

export function ExperimentalSettings() {
  const { settings, updateSettings } = useApp()
  const experimental = settings.experimental || {}

  const handleExperimentalChange = (updates: Partial<typeof experimental>) => {
    updateSettings({
      experimental: {
        ...experimental,
        ...updates,
      },
    })
  }

  const handleVisualizationChange = (vizSettings: UnifiedVisualizationSettings) => {
    updateSettings({
      experimental: {
        ...experimental,
        unifiedVisualization: vizSettings,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Experimental Features</h4>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            These features are experimental and may change or be removed in future updates. Use at your own
            discretion.
          </p>
        </div>
      </div>

      {/* Unified Visualization Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Advanced Visualization</h3>
        </div>

        <div className="pl-7">
          <div className="p-4 border rounded-lg">
            <VisualizationSettingsPanel
              settings={experimental.unifiedVisualization || {}}
              onSettingsChange={handleVisualizationChange}
              language={settings.language || "en"}
            />
          </div>
        </div>
      </div>

      {/* Legacy Response Analysis Section (for backward compatibility) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskRound className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Legacy Response Analysis</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Response Analysis */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Response Analysis (Legacy)</Label>
              <p className="text-xs text-muted-foreground">
                Use the unified visualization settings above for granular control
              </p>
            </div>
            <Switch
              checked={experimental.enableResponseAnalysis || false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableResponseAnalysis: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.enableResponseAnalysis && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Response analysis shows sentiment, confidence level, hedging phrases,
                complexity, reading time, and tone for each AI response.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auto Search Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Automatic Web Search</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Auto Search */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">AI-Controlled Web Search (Tool Calling)</Label>
              <p className="text-xs text-muted-foreground">
                Let AI automatically decide when to search the web for current information
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">GPT-5</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Claude 4.5</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Gemini 2.5</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">Grok 4</span>
              </div>
            </div>
            <Switch
              checked={experimental.enableAutoSearch || false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableAutoSearch: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.enableAutoSearch && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Requirements:</strong> Configure a search API key (Tavily, Serper, or Exa) in the Web Search tab.
                Use a model with tool calling support. This feature may cause streaming issues with some models.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Mode Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Performance Mode</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Performance Mode */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Ultra Performance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Disable GPU-intensive visual effects for maximum performance
              </p>
            </div>
            <Switch
              checked={experimental.performanceMode || false}
              onCheckedChange={(checked) => handleExperimentalChange({ performanceMode: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.performanceMode && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>Disabled effects:</strong> Chameleon logo color-shift, memory icon pulse, avatar glows,
                background animations, and other GPU-intensive visual effects. GPU usage should be minimal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
