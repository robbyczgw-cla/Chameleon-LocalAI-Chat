import { type Persona } from "@/lib/personas"

export class PersonasStorageService {
  private static readonly STORAGE_KEY = "custom_personas"

  static loadCustomPersonas(): Persona[] {
    if (typeof window === "undefined") return []

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("[PersonasStorage] Error loading personas:", error)
      return []
    }
  }

  static saveCustomPersonas(personas: Persona[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(personas))
    } catch (error) {
      console.error("[PersonasStorage] Error saving personas:", error)
    }
  }

  static addPersona(persona: Persona): void {
    const personas = this.loadCustomPersonas()
    const existing = personas.find((p) => p.id === persona.id)

    if (!existing) {
      personas.push(persona)
      this.saveCustomPersonas(personas)
    }
  }

  static updatePersona(persona: Persona): void {
    const personas = this.loadCustomPersonas()
    const index = personas.findIndex((p) => p.id === persona.id)

    if (index !== -1) {
      personas[index] = persona
      this.saveCustomPersonas(personas)
    }
  }

  static deletePersona(id: string): void {
    const personas = this.loadCustomPersonas()
    const filtered = personas.filter((p) => p.id !== id)
    this.saveCustomPersonas(filtered)
  }

  static getAllPersonas(builtInPersonas: Persona[]): Persona[] {
    const customPersonas = this.loadCustomPersonas()
    return [...builtInPersonas, ...customPersonas]
  }
}
