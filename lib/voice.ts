// OpenAI TTS voices
export const OPENAI_TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm, conversational' },
  { id: 'fable', name: 'Fable', description: 'Expressive, British' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly, upbeat' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, gentle' },
] as const

export type OpenAIVoiceId = typeof OPENAI_TTS_VOICES[number]['id']

export class VoiceService {
  private recognition: any
  private synthesis: SpeechSynthesis
  private isListening = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentAudio: HTMLAudioElement | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis
      // @ts-ignore - SpeechRecognition is not in TypeScript types
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = "en-US"
      }
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.("Speech recognition not supported")
      return
    }

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")
      const isFinal = event.results[event.results.length - 1].isFinal
      onResult(transcript, isFinal)
    }

    this.recognition.onerror = (event: any) => {
      onError?.(event.error)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }

    this.recognition.start()
    this.isListening = true
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Check microphone permission status (for browsers that support it)
   */
  async checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    try {
      // Check if Permissions API is supported
      if (!navigator.permissions || !navigator.permissions.query) {
        return 'unsupported'
      }

      // @ts-ignore - microphone is valid but TypeScript doesn't know
      const result = await navigator.permissions.query({ name: 'microphone' })
      return result.state as 'granted' | 'denied' | 'prompt'
    } catch (error) {
      console.log('[Voice] Permission API not supported:', error)
      return 'unsupported'
    }
  }

  /**
   * Start recording audio using MediaRecorder and transcribe with Whisper API
   * This works in all browsers including Firefox and mobile
   */
  async startWhisperListening(
    apiKey: string,
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void
  ) {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.('Microphone access not supported in this browser')
        return
      }

      // IMPORTANT: Always try getUserMedia() FIRST - this triggers the actual permission prompt!
      // Don't check permission state beforehand as it can incorrectly report 'denied' on some devices
      // even when the user has never seen a prompt.
      let stream: MediaStream
      try {
        console.log('[Voice] Requesting microphone access via getUserMedia...')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        console.log('[Voice] Microphone access granted!')
      } catch (permError: any) {
        // Handle permission errors
        console.error('[Voice] getUserMedia error:', permError.name, permError.message)

        const isPWA = window.matchMedia('(display-mode: standalone)').matches

        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          // Check if permission was explicitly denied or just not prompted
          const permState = await this.checkMicrophonePermission()
          console.log('[Voice] Permission state after denial:', permState)

          if (isPWA) {
            onError?.('Microphone access needed. Open Chrome browser → go to this site → tap mic → Allow permission → return to app')
          } else {
            onError?.('Microphone denied. Allow it in the popup, or click 🔒 in address bar → Site settings → Microphone → Allow')
          }
        } else if (permError.name === 'NotFoundError' || permError.message?.includes('object can not be found')) {
          // macOS specific: "The object can not be found here" = system-level permission issue
          const isMac = navigator.platform?.toUpperCase().indexOf('MAC') >= 0
          if (isMac) {
            onError?.('No microphone found. Fix macOS: System Settings → Privacy & Security → Microphone → Enable browser. Then restart.')
          } else {
            onError?.('No microphone found. Please connect a microphone and reload.')
          }
        } else if (permError.name === 'NotReadableError') {
          onError?.('Microphone in use by another app. Close other apps and try again.')
        } else if (permError.name === 'AbortError') {
          onError?.('Microphone request was aborted. Please try again.')
        } else {
          onError?.(`Microphone error: ${permError.name} - ${permError.message || 'Unknown error'}`)
        }
        return
      }

      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop())
        onError?.('No audio input available. Please check your microphone.')
        return
      }

      // Reset audio chunks
      this.audioChunks = []

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      this.mediaRecorder = new MediaRecorder(stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())

        // Create audio blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })

        // Check if audio is too short (less than 100ms)
        if (audioBlob.size < 1000) {
          onError?.("Recording too short. Please speak longer.")
          return
        }

        try {
          // Send to Whisper API
          // Use correct file extension based on mimeType
          const extension = mimeType === 'audio/webm' ? 'webm' : 'm4a'
          const filename = `recording.${extension}`

          console.log('[Voice] Sending audio to Whisper:', {
            size: audioBlob.size,
            type: audioBlob.type,
            filename
          })

          const formData = new FormData()
          formData.append('audio', audioBlob, filename)
          formData.append('apiKey', apiKey)
          formData.append('mimeType', mimeType)

          const response = await fetch('/api/whisper', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('[Voice] Whisper API error:', error)
            // Show more details if available (helps debugging)
            const msg = error.details
              ? `${error.error}: ${typeof error.details === 'string' ? error.details.slice(0, 100) : JSON.stringify(error.details).slice(0, 100)}`
              : error.error || 'Failed to transcribe audio'
            onError?.(msg)
            return
          }

          const data = await response.json()
          if (data.text) {
            onResult(data.text)
          } else {
            onError?.('No transcription received')
          }
        } catch (error) {
          console.error('Whisper transcription error:', error)
          onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio')
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError?.('Recording failed')
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      this.mediaRecorder.start()
      this.isListening = true
      onStart?.()
    } catch (error) {
      console.error('Failed to start recording:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        onError?.('Microphone permission denied')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        onError?.('No microphone found')
      } else {
        onError?.(error instanceof Error ? error.message : 'Failed to start recording')
      }
    }
  }

  stopWhisperListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop()
      this.isListening = false
    }
  }

  /**
   * Start recording audio and transcribe with LOCAL Whisper (no API key needed!)
   * Uses mlx-whisper, whisper.cpp, or other local backends
   * Falls back to OpenAI Whisper if local not available
   */
  async startLocalWhisperListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    options?: { model?: string; language?: string; fallbackApiKey?: string }
  ) {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.('Microphone access not supported in this browser')
        return
      }

      // Request microphone access
      let stream: MediaStream
      try {
        console.log('[Voice/Local] Requesting microphone access...')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        console.log('[Voice/Local] Microphone access granted!')
      } catch (permError: any) {
        console.error('[Voice/Local] Microphone error:', permError.name, permError.message)
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          onError?.('Microphone access denied. Please allow microphone in browser settings.')
        } else if (permError.name === 'NotFoundError') {
          onError?.('No microphone found. Please connect a microphone.')
        } else {
          onError?.(`Microphone error: ${permError.message || 'Unknown error'}`)
        }
        return
      }

      // Reset audio chunks
      this.audioChunks = []

      // Create MediaRecorder - prefer WAV-compatible format for Whisper
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      this.mediaRecorder = new MediaRecorder(stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())

        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })

        // Check if audio is too short
        if (audioBlob.size < 1000) {
          onError?.("Recording too short. Please speak longer.")
          return
        }

        try {
          console.log('[Voice/Local] Sending to local Whisper:', {
            size: audioBlob.size,
            type: audioBlob.type,
          })

          // Try local Whisper first
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.wav')
          formData.append('config', JSON.stringify({
            model: options?.model || 'base',
            language: options?.language || 'auto',
          }))

          const response = await fetch('/api/local-whisper', {
            method: 'POST',
            body: formData,
          })

          const data = await response.json()

          if (response.ok && data.transcription) {
            console.log(`[Voice/Local] Transcribed via ${data.backend}:`, data.transcription)
            onResult(data.transcription)
            return
          }

          // If local failed and we have fallback API key, use OpenAI
          if (options?.fallbackApiKey && data.error?.includes('No local Whisper')) {
            console.log('[Voice/Local] Falling back to OpenAI Whisper...')

            const extension = mimeType === 'audio/webm' ? 'webm' : 'm4a'
            const fallbackFormData = new FormData()
            fallbackFormData.append('audio', audioBlob, `recording.${extension}`)
            fallbackFormData.append('apiKey', options.fallbackApiKey)
            fallbackFormData.append('mimeType', mimeType)

            const fallbackResponse = await fetch('/api/whisper', {
              method: 'POST',
              body: fallbackFormData,
            })

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              if (fallbackData.text) {
                console.log('[Voice/Local] Transcribed via OpenAI fallback:', fallbackData.text)
                onResult(fallbackData.text)
                return
              }
            }
          }

          // Show error with help
          if (data.help) {
            onError?.(`${data.error}\n\nInstall: ${data.help}`)
          } else {
            onError?.(data.error || 'Transcription failed')
          }
        } catch (error) {
          console.error('[Voice/Local] Transcription error:', error)
          onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio')
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('[Voice/Local] MediaRecorder error:', event)
        onError?.('Recording failed')
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      this.mediaRecorder.start()
      this.isListening = true
      onStart?.()
    } catch (error) {
      console.error('[Voice/Local] Failed to start recording:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to start recording')
    }
  }

  /**
   * Check if local Whisper is available
   */
  async checkLocalWhisperAvailability(): Promise<{
    available: boolean
    backends: Record<string, boolean>
    recommended: string | null
  }> {
    try {
      const response = await fetch('/api/local-whisper')
      if (response.ok) {
        return await response.json()
      }
      return { available: false, backends: {}, recommended: null }
    } catch {
      return { available: false, backends: {}, recommended: null }
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; voice?: string }) {
    if (!this.synthesis) return

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1

    if (options?.voice) {
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find((v) => v.name === options.voice)
      if (selectedVoice) utterance.voice = selectedVoice
    }

    this.synthesis.speak(utterance)
  }

  stopSpeaking() {
    // Stop browser TTS
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    // Stop OpenAI TTS audio
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  /**
   * Speak text using OpenAI TTS API (higher quality)
   */
  async speakWithOpenAI(
    text: string,
    apiKey: string,
    options?: { voice?: OpenAIVoiceId; speed?: number },
    onEnd?: () => void,
    onError?: (error: string) => void
  ) {
    // Stop any current playback
    this.stopSpeaking()

    // Client-side timeout (30 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options?.voice || 'nova',
          speed: options?.speed || 1.0,
          apiKey,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check content type - if JSON, it's an error response
      const contentType = response.headers.get('content-type') || ''

      if (!response.ok || contentType.includes('application/json')) {
        let errorMessage = 'TTS failed'
        try {
          const error = await response.json()
          console.error('[Voice] OpenAI TTS error:', error)
          errorMessage = error.details || error.error || 'TTS failed'
        } catch {
          errorMessage = `TTS failed with status ${response.status}`
        }
        onError?.(errorMessage)
        return
      }

      // Get audio blob and play it
      const audioBlob = await response.blob()

      // Verify we got actual audio data
      if (audioBlob.size === 0) {
        onError?.('No audio data received')
        return
      }

      const audioUrl = URL.createObjectURL(audioBlob)

      this.currentAudio = new Audio(audioUrl)
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        onEnd?.()
      }
      this.currentAudio.onerror = (e) => {
        console.error('[Voice] Audio playback error:', e)
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        onError?.('Failed to play audio')
      }

      await this.currentAudio.play()
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('[Voice] OpenAI TTS error:', error)

      // Handle timeout/abort specifically
      if (error instanceof Error && error.name === 'AbortError') {
        onError?.('TTS timed out. Try shorter text or check your connection.')
        return
      }

      onError?.(error instanceof Error ? error.message : 'TTS failed')
    }
  }

  /**
   * Check if OpenAI TTS is currently playing
   */
  isOpenAIPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }
}

export const voiceService = new VoiceService()
