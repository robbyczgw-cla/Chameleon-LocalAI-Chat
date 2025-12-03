"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus, User, Heart, Briefcase, MapPin, Target } from "lucide-react"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileUpdate?: () => void
}

export function UserProfileDialog({ open, onOpenChange, onProfileUpdate }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile>({})
  const [newInterest, setNewInterest] = useState("")
  const [newGoal, setNewGoal] = useState("")
  const { toast } = useToast()
  const { user } = useApp()

  useEffect(() => {
    if (open) {
      const currentProfile = userProfileService.getProfile()
      setProfile(currentProfile)
    }
  }, [open])

  const handleSave = async () => {
    try {
      await userProfileService.saveProfile(profile, user?.id)
      toast({
        title: "✨ Profil gespeichert!",
        description: "Deine persönlichen Infos wurden gespeichert.",
      })
      onProfileUpdate?.()
      onOpenChange(false)
    } catch (error) {
      console.error("[UserProfileDialog] Save error:", error)
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const addInterest = () => {
    if (newInterest.trim()) {
      setProfile({
        ...profile,
        interests: [...(profile.interests || []), newInterest.trim()],
      })
      setNewInterest("")
    }
  }

  const removeInterest = (index: number) => {
    setProfile({
      ...profile,
      interests: (profile.interests || []).filter((_, i) => i !== index),
    })
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setProfile({
        ...profile,
        goals: [...(profile.goals || []), newGoal.trim()],
      })
      setNewGoal("")
    }
  }

  const removeGoal = (index: number) => {
    setProfile({
      ...profile,
      goals: (profile.goals || []).filter((_, i) => i !== index),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <User className="h-5 w-5 text-white" />
            </div>
            Erzähl mir von dir! 😊
          </DialogTitle>
          <DialogDescription>
            Je mehr ich über dich weiß, desto persönlicher und hilfreicher kann ich sein.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <User className="h-4 w-4" />
              Grundlegendes
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Wie heißt du?</Label>
                <Input
                  id="name"
                  placeholder="z.B. Anna"
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Wie alt bist du?</Label>
                <Input
                  id="age"
                  placeholder="z.B. 25 oder 25-30"
                  value={profile.age || ""}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Was machst du beruflich?
                </Label>
                <Input
                  id="occupation"
                  placeholder="z.B. Studentin, Software-Entwickler"
                  value={profile.occupation || ""}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Wo wohnst du?
                </Label>
                <Input
                  id="location"
                  placeholder="z.B. Berlin, München"
                  value={profile.location || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <Heart className="h-4 w-4" />
              Was interessiert dich?
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="z.B. Programmieren, Kochen, Fitness..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
              />
              <Button type="button" size="icon" onClick={addInterest} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {interest}
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <Target className="h-4 w-4" />
              Was sind deine Ziele?
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="z.B. Sprache lernen, fit werden..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
              />
              <Button type="button" size="icon" onClick={addGoal} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {profile.goals && profile.goals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.goals.map((goal, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {goal}
                    <button
                      onClick={() => removeGoal(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* About Me */}
          <div className="space-y-2">
            <Label htmlFor="aboutMe">Erzähl mir mehr über dich</Label>
            <Textarea
              id="aboutMe"
              placeholder="Was sollte ich noch über dich wissen? Deine Hobbies, was dir wichtig ist, worüber du gerne redest..."
              value={profile.aboutMe || ""}
              onChange={(e) => setProfile({ ...profile, aboutMe: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
