"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  achievementService,
  gamificationService,
  type Achievement,
  type GamificationSettings,
} from "@/lib/simple-mode-features"
import { cn } from "@/lib/utils"
import { Trophy, Lock, Check, Sparkles } from "lucide-react"

const translations = {
  en: {
    title: "Achievements",
    unlocked: "Unlocked",
    locked: "Locked",
    progress: "Progress",
    enableAchievements: "Enable Achievements",
    enableNotifications: "Show Notifications",
    disableAll: "Disable All",
    secret: "Secret Achievement",
    newUnlock: "Achievement Unlocked!",
    close: "Close",
    settings: "Settings",
  },
  de: {
    title: "Erfolge",
    unlocked: "Freigeschaltet",
    locked: "Gesperrt",
    progress: "Fortschritt",
    enableAchievements: "Erfolge aktivieren",
    enableNotifications: "Benachrichtigungen anzeigen",
    disableAll: "Alle deaktivieren",
    secret: "Geheimer Erfolg",
    newUnlock: "Erfolg freigeschaltet!",
    close: "Schließen",
    settings: "Einstellungen",
  },
}

interface AchievementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: "en" | "de"
}

export function AchievementsDialog({ open, onOpenChange, lang }: AchievementsDialogProps) {
  const t = translations[lang]
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [settings, setSettings] = useState<GamificationSettings | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (open) {
      setAchievements(achievementService.getAchievements())
      setSettings(gamificationService.getSettings())
    }
  }, [open])

  const handleSettingChange = (key: keyof GamificationSettings, value: boolean) => {
    if (!settings) return
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    gamificationService.saveSettings(newSettings)
  }

  const handleDisableAll = () => {
    const newSettings: GamificationSettings = {
      achievementsEnabled: false,
      streaksEnabled: false,
      notificationsEnabled: false,
    }
    setSettings(newSettings)
    gamificationService.saveSettings(newSettings)
  }

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length
  const totalCount = achievements.filter((a) => !a.secret || a.unlockedAt).length
  const progressPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {unlockedCount} / {totalCount} {t.unlocked} ({progressPercent}%)
          </DialogDescription>
        </DialogHeader>

        {!showSettings ? (
          /* Achievements List */
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {achievements.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt
              const isSecret = achievement.secret && !isUnlocked
              const name = achievement.name[lang]
              const description = achievement.description[lang]
              const progress = achievement.progress || 0
              const maxProgress = achievement.maxProgress || 0

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isUnlocked
                      ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0",
                      isUnlocked
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                        : "bg-muted"
                    )}
                  >
                    {isSecret ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : isUnlocked ? (
                      achievement.emoji
                    ) : (
                      <span className="opacity-30">{achievement.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-sm", !isUnlocked && "text-muted-foreground")}>
                        {isSecret ? t.secret : name}
                      </p>
                      {isUnlocked && (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {isSecret ? "???" : description}
                    </p>
                    {maxProgress > 0 && !isUnlocked && (
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={(progress / maxProgress) * 100} className="h-1" />
                        <span className="text-[10px] text-muted-foreground">
                          {progress}/{maxProgress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Settings */
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {settings && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="achievements-toggle" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      {t.enableAchievements}
                    </Label>
                    <Switch
                      id="achievements-toggle"
                      checked={settings.achievementsEnabled}
                      onCheckedChange={(v) => handleSettingChange("achievementsEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications-toggle" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      {t.enableNotifications}
                    </Label>
                    <Switch
                      id="notifications-toggle"
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(v) => handleSettingChange("notificationsEnabled", v)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleDisableAll}
                    className="w-full text-muted-foreground"
                  >
                    {t.disableAll}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? t.title : t.settings}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Achievement Toast Component for new unlocks
interface AchievementToastProps {
  achievement: Achievement
  lang: "en" | "de"
  onClose: () => void
}

export function AchievementToast({ achievement, lang, onClose }: AchievementToastProps) {
  const t = translations[lang]

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl shadow-lg">
        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-xl animate-bounce">
          {achievement.emoji}
        </div>
        <div>
          <p className="text-xs font-medium opacity-90">{t.newUnlock}</p>
          <p className="font-bold">{achievement.name[lang]}</p>
        </div>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  )
}
