/**
 * Ambient Music System - Theme-based background music
 * Uses real audio tracks (royalty-free music)
 */

interface MusicTrack {
  name: string
  url: string
  volume: number
}

// Theme-specific music tracks
// IMPORTANT: Pixabay CDN blocks requests with 403 errors
// To enable music, you need to:
// 1. Download royalty-free music (e.g., from Pixabay, YouTube Audio Library, etc.)
// 2. Place MP3 files in /public/music/ folder
// 3. Update URLs below to point to local files (e.g., "/music/light-theme.mp3")
//
// Alternative: Use a different CDN or self-host the audio files
const THEME_TRACKS: Record<string, MusicTrack> = {
  light: {
    name: "Peaceful Morning",
    // PLACEHOLDER - Replace with your own local file: /public/music/light-theme.mp3
    url: "/music/light-theme.mp3",
    volume: 0.5,
  },
  dark: {
    name: "Deep Night",
    // PLACEHOLDER - Replace with your own local file: /public/music/dark-theme.mp3
    url: "/music/dark-theme.mp3",
    volume: 0.5,
  },
  cyberpunk: {
    name: "Neon Pulse",
    // PLACEHOLDER - Replace with your own local file: /public/music/cyberpunk-theme.mp3
    url: "/music/cyberpunk-theme.mp3",
    volume: 0.5,
  },
  "retro-wave": {
    name: "80s Dreams",
    // PLACEHOLDER - Replace with your own local file: /public/music/retro-wave-theme.mp3
    url: "/music/retro-wave-theme.mp3",
    volume: 0.5,
  },
  "girly-violet": {
    name: "Soft Lavender",
    // PLACEHOLDER - Replace with your own local file: /public/music/girly-violet-theme.mp3
    url: "/music/girly-violet-theme.mp3",
    volume: 0.5,
  },
  "ocean-breeze": {
    name: "Coastal Waves",
    // PLACEHOLDER - Replace with your own local file: /public/music/ocean-breeze-theme.mp3
    url: "/music/ocean-breeze-theme.mp3",
    volume: 0.5,
  },
}

class AmbientMusicService {
  private audio: HTMLAudioElement | null = null
  private isPlaying = false
  private currentTheme = "light"
  private fadeInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeAudio()
    }
  }

  private initializeAudio() {
    try {
      this.audio = new Audio()
      this.audio.loop = true
      this.audio.preload = "auto"

      // Handle audio errors
      this.audio.addEventListener("error", (e) => {
        const target = e.target as HTMLAudioElement
        console.error("[AmbientMusic] Audio error:", {
          error: target.error,
          code: target.error?.code,
          message: target.error?.message,
          src: target.src,
        })
      })

      // Handle audio loading
      this.audio.addEventListener("loadeddata", () => {
        console.log("[AmbientMusic] Audio data loaded successfully")
      })

      this.audio.addEventListener("canplay", () => {
        console.log("[AmbientMusic] Audio can play")
      })

      this.audio.addEventListener("playing", () => {
        console.log("[AmbientMusic] Audio is playing")
      })

      this.audio.addEventListener("pause", () => {
        console.log("[AmbientMusic] Audio paused")
      })

      // Handle playback end (shouldn't happen with loop=true)
      this.audio.addEventListener("ended", () => {
        console.log("[AmbientMusic] Audio ended (unexpected with loop=true)")
        if (this.isPlaying) {
          this.audio?.play().catch((e) => console.error("[AmbientMusic] Playback error:", e))
        }
      })

      console.log("[AmbientMusic] Audio element initialized successfully")
    } catch (error) {
      console.error("[AmbientMusic] Failed to initialize audio element:", error)
    }
  }

  async play(theme: string = "light") {
    console.log("[AmbientMusic] play() called with theme:", theme)

    if (!this.audio) {
      console.log("[AmbientMusic] Initializing audio element...")
      this.initializeAudio()
    }

    if (!this.audio) {
      console.error("[AmbientMusic] Failed to initialize audio element")
      return
    }

    // If same theme is playing, don't restart
    if (this.isPlaying && theme === this.currentTheme) {
      console.log("[AmbientMusic] Already playing this theme, skipping")
      return
    }

    const track = THEME_TRACKS[theme] || THEME_TRACKS.light
    console.log("[AmbientMusic] Selected track:", track.name, "URL:", track.url)
    this.currentTheme = theme

    // Stop current playback if any
    if (this.isPlaying) {
      console.log("[AmbientMusic] Stopping current playback...")
      await this.fadeOut()
    }

    // Load new track
    this.audio.src = track.url
    this.audio.volume = 0
    this.audio.loop = true

    console.log("[AmbientMusic] Audio configured, attempting playback...")

    try {
      // Start playback
      await this.audio.play()
      this.isPlaying = true

      // Fade in
      this.fadeIn(track.volume)

      console.log(`[AmbientMusic] ✓ Successfully playing: ${track.name} (${theme}) at volume ${track.volume}`)
    } catch (error) {
      console.error("[AmbientMusic] ✗ Failed to play:", error)

      // Browser might block autoplay - user needs to interact first
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          console.warn("[AmbientMusic] Autoplay blocked by browser. User needs to interact with page first.")
          console.warn("[AmbientMusic] Try clicking the music button again after interacting with the page.")
        } else if (error.name === "NotSupportedError") {
          console.error("[AmbientMusic] Audio format not supported:", track.url)
        } else {
          console.error("[AmbientMusic] Unknown error:", error.name, error.message)
        }
      }
    }
  }

  stop() {
    if (!this.audio || !this.isPlaying) return

    this.fadeOut().then(() => {
      if (this.audio) {
        this.audio.pause()
        this.audio.currentTime = 0
      }
      this.isPlaying = false
      console.log("[AmbientMusic] Stopped")
    })
  }

  private fadeIn(targetVolume: number) {
    if (!this.audio) return

    // Clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
    }

    const steps = 20
    const duration = 2000 // 2 seconds
    const stepDuration = duration / steps
    const volumeStep = targetVolume / steps

    let currentStep = 0

    this.fadeInterval = setInterval(() => {
      if (!this.audio || currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval)
          this.fadeInterval = null
        }
        if (this.audio) {
          this.audio.volume = targetVolume
        }
        return
      }

      this.audio.volume = Math.min(volumeStep * currentStep, targetVolume)
      currentStep++
    }, stepDuration)
  }

  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audio) {
        resolve()
        return
      }

      // Clear any existing fade
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval)
      }

      const startVolume = this.audio.volume
      const steps = 20
      const duration = 1000 // 1 second
      const stepDuration = duration / steps
      const volumeStep = startVolume / steps

      let currentStep = 0

      this.fadeInterval = setInterval(() => {
        if (!this.audio || currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval)
            this.fadeInterval = null
          }
          if (this.audio) {
            this.audio.volume = 0
          }
          resolve()
          return
        }

        this.audio.volume = Math.max(startVolume - volumeStep * currentStep, 0)
        currentStep++
      }, stepDuration)
    })
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  getCurrentTheme(): string {
    return this.currentTheme
  }

  // Clean up on page unload
  dispose() {
    this.stop()
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
    }
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ""
      this.audio = null
    }
  }
}

// Singleton instance
export const ambientMusicService = new AmbientMusicService()

// Clean up on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    ambientMusicService.dispose()
  })
}
