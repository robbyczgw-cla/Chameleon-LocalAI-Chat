/**
 * Personas Module
 * Unified exports for persona-related functionality
 */

// Core persona types and data
export type {
  Persona,
  PersonaMemorySettings,
  PersonaVoiceSettings,
  PersonaContextSettings,
} from "../personas"

export { PERSONAS, getPersonaById, getDefaultPersona } from "../personas"

// Persona storage (custom personas)
export { PersonasStorageService } from "../personas-storage"

// Persona memory service
export type { PersonaConversation, PersonaMemoryStore } from "../persona-memory-service"
export { personaMemoryService } from "../persona-memory-service"

// Persona context awareness (mood, time, topics)
export type { ContextAwarenessData } from "../persona-context-awareness"
export { personaContextAwareness } from "../persona-context-awareness"

// Persona preferences learning
export { personaPreferencesService } from "../persona-preferences-service"
