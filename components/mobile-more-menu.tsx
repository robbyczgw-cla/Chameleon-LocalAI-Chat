"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Settings,
  User,
  Brain,
  Columns2,
  Search,
  FolderOpen,
  Swords,
  FileCode,
  BarChart3,
  Music,
  VolumeX,
  Moon,
  Sun,
  MoreHorizontal,
  Wand2,
  Sparkles,
} from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { cn } from "@/lib/utils"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { ambientMusicService } from "@/lib/ambient-music"
import { haptics } from "@/lib/haptics"

interface MobileMoreMenuProps {
  onSettingsClick: () => void
  onProfileClick: () => void
  onMemoryClick: () => void
  onComparisonClick: () => void
  onSearchClick: () => void
  onDocCollectionsClick: () => void
  onDebateClick: () => void
  onInspectorClick: () => void
  onStatsClick: () => void
  onPersonasClick: () => void
  onPromptHelperClick: () => void
}

export function MobileMoreMenu({
  onSettingsClick,
  onProfileClick,
  onMemoryClick,
  onComparisonClick,
  onSearchClick,
  onDocCollectionsClick,
  onDebateClick,
  onInspectorClick,
  onStatsClick,
  onPersonasClick,
  onPromptHelperClick,
}: MobileMoreMenuProps) {
  const { settings, updateSettings } = useApp()
  const { inspectorData } = usePromptInspectorStore()
  const [open, setOpen] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(
    localStorage.getItem("chameleon-ambient-music") === "enabled"
  )

  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark"
    updateSettings({ theme: newTheme })
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    haptics.trigger("selection")
  }

  const toggleMusic = async () => {
    const currentTheme = localStorage.getItem("chameleon-theme") || "light"
    haptics.trigger("selection")

    if (isMusicPlaying) {
      ambientMusicService.stop()
      setIsMusicPlaying(false)
      localStorage.setItem("chameleon-ambient-music", "disabled")
    } else {
      try {
        await ambientMusicService.play(currentTheme)
        setIsMusicPlaying(true)
        localStorage.setItem("chameleon-ambient-music", "enabled")
      } catch (error) {
        console.error("Failed to start music:", error)
        setIsMusicPlaying(false)
      }
    }
  }

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    badge,
    badgeColor,
  }: {
    icon: any
    label: string
    onClick: () => void
    badge?: boolean
    badgeColor?: string
  }) => (
    <Button
      variant="ghost"
      className="w-full justify-start h-12 text-base gap-3"
      onClick={() => {
        haptics.trigger("selection")
        onClick()
        setOpen(false)
      }}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {badge && (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full animate-pulse",
              badgeColor || "bg-purple-500"
            )}
          />
        )}
      </div>
      <span>{label}</span>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Settings & Tools</SheetTitle>
          <SheetDescription>Access advanced features and settings</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {/* Theme & Music */}
          <div className="mb-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base gap-3"
              onClick={toggleTheme}
            >
              {settings.theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
              <span>{settings.theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base gap-3"
              onClick={toggleMusic}
            >
              {isMusicPlaying ? (
                <VolumeX className="h-5 w-5 text-green-500" />
              ) : (
                <Music className="h-5 w-5" />
              )}
              <span>{isMusicPlaying ? "Stop Music" : "Play Music"}</span>
            </Button>
          </div>

          <div className="border-t pt-2 space-y-1">
            <MenuItem icon={Wand2} label="Personas" onClick={onPersonasClick} />
            <MenuItem
              icon={Sparkles}
              label="Prompt Helper"
              onClick={onPromptHelperClick}
            />
            <MenuItem icon={User} label="Profile" onClick={onProfileClick} />
            <MenuItem
              icon={Brain}
              label="Memory System"
              onClick={onMemoryClick}
              badge={settings.memorySettings?.enabled}
              badgeColor="bg-purple-500"
            />
            <MenuItem icon={Search} label="Search Chats" onClick={onSearchClick} />
            <MenuItem icon={FolderOpen} label="Documents" onClick={onDocCollectionsClick} />
          </div>

          <div className="border-t pt-2 space-y-1">
            <MenuItem icon={Columns2} label="Model Comparison" onClick={onComparisonClick} />
            <MenuItem icon={Swords} label="AI Discussion" onClick={onDebateClick} />
            <MenuItem
              icon={FileCode}
              label="Prompt Inspector"
              onClick={onInspectorClick}
              badge={!!inspectorData}
              badgeColor="bg-blue-500"
            />
            <MenuItem icon={BarChart3} label="Statistics" onClick={onStatsClick} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
