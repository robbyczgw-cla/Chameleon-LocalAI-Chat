/**
 * Internationalization (i18n) for UI text
 * Supports English (en) and German (de)
 */

export type Language = "en" | "de"

interface Translations {
  // Settings Dialog
  settings: {
    title: string
    general: string
    apiKeys: string
    systemPrompt: string
    systemPromptPlaceholder: string
    systemPromptHelp: string
    fontSize: string
    fontSizeSmall: string
    fontSizeMedium: string
    fontSizeLarge: string
    language: string
    languageEnglish: string
    languageGerman: string
    save: string
    cancel: string
  }

  // AI Memory System
  memory: {
    title: string
    subtitle: string
    disabled: string
    disabledDescription: string
    enableButton: string
    total: string
    preferences: string
    facts: string
    skills: string
    goals: string
    context: string
    howItWorks: string
    howItWorksDescription: string
    addNew: string
    content: string
    contentPlaceholder: string
    category: string
    categoryPlaceholder: string
    importance: string
    importanceLow: string
    importanceMedium: string
    importanceHigh: string
    saveMemory: string
    deleteConfirm: string
    noMemories: string
    usedTimes: string
  }

  // Advanced Settings
  advancedSettings: {
    title: string
    prompts: string
    models: string
    costTracking: string
    exportData: string
    systemPromptInstructions: string
  }

  // Chat Header
  chatHeader: {
    profile: string
    memory: string
    settings: string
  }

  // Chat Input
  chatInput: {
    placeholder: string
    searchPlaceholder: string
    send: string
    searching: string
    searchComplete: string
  }

  // Personas
  personas: {
    selectPersona: string
    noPersona: string
  }

  // Common
  common: {
    loading: string
    error: string
    success: string
    delete: string
    edit: string
    create: string
    update: string
    close: string
    and: string
    results: string
    images: string
    via: string
  }
}

const translations: Record<Language, Translations> = {
  en: {
    settings: {
      title: "Settings",
      general: "General",
      apiKeys: "API Keys",
      systemPrompt: "System Prompt",
      systemPromptPlaceholder: "You are a helpful AI assistant.",
      systemPromptHelp: "Advanced parameters (Temperature, Max Tokens) can be adjusted per model in the Model Selector.",
      fontSize: "Font Size",
      fontSizeSmall: "Small",
      fontSizeMedium: "Medium",
      fontSizeLarge: "Large",
      language: "Language",
      languageEnglish: "English",
      languageGerman: "German",
      save: "Save",
      cancel: "Cancel",
    },
    memory: {
      title: "AI Memory System",
      subtitle: "Intelligent long-term memory for your conversations",
      disabled: "Memory System is disabled",
      disabledDescription: "Enable the system to save important information about you and use it in future chats",
      enableButton: "Enable now",
      total: "Total",
      preferences: "Preferences",
      facts: "Facts",
      skills: "Skills",
      goals: "Goals",
      context: "Context",
      howItWorks: "How does it work?",
      howItWorksDescription: "Conversation Insights → saves important facts automatically • Personality Analysis → creates preference memories • Prompt Evolution → tracks your skills • Knowledge Base → uses memories for better search",
      addNew: "Add new",
      content: "Content",
      contentPlaceholder: "e.g. 'Prefers Dark Mode' or 'Works as a Developer'",
      category: "Category (optional)",
      categoryPlaceholder: "e.g. 'UI/UX'",
      importance: "Importance",
      importanceLow: "Low",
      importanceMedium: "Medium",
      importanceHigh: "High",
      saveMemory: "Save",
      deleteConfirm: "Really delete memory?",
      noMemories: "No memories available",
      usedTimes: "times used",
    },
    advancedSettings: {
      title: "Advanced Settings",
      prompts: "Prompts",
      models: "Models",
      costTracking: "Cost Tracking",
      exportData: "Export Data",
      systemPromptInstructions: "Instructions that guide the model's behavior and personality.",
    },
    chatHeader: {
      profile: "Profile",
      memory: "Memory System",
      settings: "Settings",
    },
    chatInput: {
      placeholder: "Message...",
      searchPlaceholder: "Search query for web results",
      send: "Send",
      searching: "Searching...",
      searchComplete: "Search complete",
    },
    personas: {
      selectPersona: "Select Persona",
      noPersona: "No Persona",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      update: "Update",
      close: "Close",
      and: "and",
      results: "results",
      images: "images",
      via: "via",
    },
  },
  de: {
    settings: {
      title: "Einstellungen",
      general: "Allgemein",
      apiKeys: "API-Schlüssel",
      systemPrompt: "System-Prompt",
      systemPromptPlaceholder: "Du bist ein hilfreicher KI-Assistent.",
      systemPromptHelp: "Erweiterte Parameter (Temperature, Max Tokens) können pro Modell im Model Selector angepasst werden.",
      fontSize: "Schriftgröße",
      fontSizeSmall: "Klein",
      fontSizeMedium: "Mittel",
      fontSizeLarge: "Groß",
      language: "Sprache",
      languageEnglish: "Englisch",
      languageGerman: "Deutsch",
      save: "Speichern",
      cancel: "Abbrechen",
    },
    memory: {
      title: "AI Memory System",
      subtitle: "Intelligentes Langzeit-Gedächtnis für deine Konversationen",
      disabled: "Memory System ist deaktiviert",
      disabledDescription: "Aktiviere das System, um wichtige Informationen über dich zu speichern und in zukünftigen Chats zu nutzen",
      enableButton: "Jetzt aktivieren",
      total: "Gesamt",
      preferences: "Präferenzen",
      facts: "Fakten",
      skills: "Skills",
      goals: "Ziele",
      context: "Kontext",
      howItWorks: "Wie funktioniert es?",
      howItWorksDescription: "Conversation Insights → speichert wichtige Fakten automatisch • Personality Analysis → erstellt Präferenz-Memories • Prompt Evolution → trackt deine Skills • Knowledge Base → nutzt Memories für bessere Suche",
      addNew: "Neue",
      content: "Inhalt",
      contentPlaceholder: "z.B. 'Bevorzugt Dark Mode' oder 'Arbeitet als Entwickler'",
      category: "Kategorie (optional)",
      categoryPlaceholder: "z.B. 'UI/UX'",
      importance: "Wichtigkeit",
      importanceLow: "Niedrig",
      importanceMedium: "Mittel",
      importanceHigh: "Hoch",
      saveMemory: "Speichern",
      deleteConfirm: "Memory wirklich löschen?",
      noMemories: "Keine Memories vorhanden",
      usedTimes: "mal verwendet",
    },
    advancedSettings: {
      title: "Erweiterte Einstellungen",
      prompts: "Prompts",
      models: "Modelle",
      costTracking: "Kostenverfolgung",
      exportData: "Daten exportieren",
      systemPromptInstructions: "Anweisungen, die das Verhalten und die Persönlichkeit des Modells steuern.",
    },
    chatHeader: {
      profile: "Profil",
      memory: "Speichersystem",
      settings: "Einstellungen",
    },
    chatInput: {
      placeholder: "Nachricht...",
      searchPlaceholder: "Suchanfrage für Webergebnisse",
      send: "Senden",
      searching: "Suche läuft...",
      searchComplete: "Suche abgeschlossen",
    },
    personas: {
      selectPersona: "Persona auswählen",
      noPersona: "Keine Persona",
    },
    common: {
      loading: "Lädt...",
      error: "Fehler",
      success: "Erfolg",
      delete: "Löschen",
      edit: "Bearbeiten",
      create: "Erstellen",
      update: "Aktualisieren",
      close: "Schließen",
      and: "und",
      results: "Ergebnisse",
      images: "Bilder",
      via: "via",
    },
  },
}

/**
 * Get translation for a key in the current language
 */
export function t(key: string, language: Language = "en"): string {
  const keys = key.split(".")
  let value: any = translations[language]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}

/**
 * Get all translations for current language
 */
export function getTranslations(language: Language = "en"): Translations {
  return translations[language]
}

/**
 * Hook to use translations (for React components)
 */
export function useTranslation(language: Language = "en") {
  return {
    t: (key: string) => t(key, language),
    translations: getTranslations(language),
  }
}
