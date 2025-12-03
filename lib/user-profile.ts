/**
 * User Profile Service - Local-First Edition
 * Stores user profile locally in localStorage and SQLite
 */

export interface UserProfile {
  name?: string
  age?: string
  interests?: string[]
  occupation?: string
  location?: string
  aboutMe?: string
  goals?: string[]
  preferences?: {
    communicationStyle?: string
    topicsToAvoid?: string[]
  }
}

const STORAGE_KEY = "user-profile"

export const userProfileService = {
  getProfile(): UserProfile {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("[User Profile] Failed to load profile:", error)
      return {}
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    if (typeof window === "undefined") return

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      console.log("[User Profile] Saved profile to localStorage:", profile)
    } catch (error) {
      console.error("[User Profile] Failed to save profile:", error)
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getProfile()
    const updated = { ...current, ...updates }
    await this.saveProfile(updated)
    return updated
  },

  clearProfile(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  },

  // Generate a system prompt context from the profile
  getProfileContext(profile?: UserProfile): string {
    const p = profile || this.getProfile()
    const parts: string[] = []

    if (p.name) {
      parts.push(`Der Nutzer heißt ${p.name}.`)
    }

    if (p.age) {
      parts.push(`Alter: ${p.age}.`)
    }

    if (p.occupation) {
      parts.push(`Beruf/Tätigkeit: ${p.occupation}.`)
    }

    if (p.location) {
      parts.push(`Wohnort: ${p.location}.`)
    }

    if (p.interests && p.interests.length > 0) {
      parts.push(`Interessen: ${p.interests.join(", ")}.`)
    }

    if (p.goals && p.goals.length > 0) {
      parts.push(`Ziele: ${p.goals.join(", ")}.`)
    }

    if (p.aboutMe) {
      parts.push(`Über mich: ${p.aboutMe}`)
    }

    if (p.preferences?.communicationStyle) {
      parts.push(`Bevorzugter Kommunikationsstil: ${p.preferences.communicationStyle}.`)
    }

    if (p.preferences?.topicsToAvoid && p.preferences.topicsToAvoid.length > 0) {
      parts.push(`Themen die vermieden werden sollen: ${p.preferences.topicsToAvoid.join(", ")}.`)
    }

    if (parts.length === 0) {
      return ""
    }

    return `\n\n📋 PERSÖNLICHE INFORMATIONEN ÜBER DEN NUTZER:\n${parts.join(" ")}\n\nBitte berücksichtige diese Informationen bei deinen Antworten und mache sie persönlicher und relevanter für den Nutzer.`
  },

  hasProfile(): boolean {
    const profile = this.getProfile()
    return Object.keys(profile).some(key => {
      const value = profile[key as keyof UserProfile]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value || {}).length > 0
      return !!value
    })
  }
}
