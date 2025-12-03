import type { PromptTemplate } from "@/types"

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  // Allgemeine Business-Prompts
  {
    id: "produktbeschreibung",
    name: "Produktbeschreibung erstellen",
    description: "Verkaufsfördernde Produkttexte",
    category: "Marketing",
    content:
      "Erstelle eine ansprechende Produktbeschreibung für:\n\nProdukt: {{produkt}}\nMarke: {{marke}}\nPreis: {{preis}} Euro\nZielgruppe: {{zielgruppe}}\n\nDie Beschreibung soll:\n1. Technische Highlights hervorheben\n2. Emotionale Kaufanreize schaffen\n3. Alleinstellungsmerkmale betonen\n4. SEO-optimiert sein\n5. Österreichisches Deutsch verwenden",
    variables: ["produkt", "marke", "preis", "zielgruppe"],
    createdAt: Date.now(),
  },
  {
    id: "kundenanfrage",
    name: "Kundenanfrage beantworten",
    description: "Professionelle Kundenantwort",
    category: "Kundenservice",
    content:
      "Kundenanfrage:\n{{anfrage}}\n\nBitte formuliere eine professionelle, freundliche Antwort auf Deutsch (Österreich), die:\n1. Alle Fragen beantwortet\n2. Zusätzliche hilfreiche Informationen bietet\n3. Zum Besuch im Geschäft oder Online-Shop einlädt\n4. Kontaktmöglichkeiten nennt",
    variables: ["anfrage"],
    createdAt: Date.now(),
  },
  {
    id: "newsletter",
    name: "Newsletter erstellen",
    description: "Newsletter-Content generieren",
    category: "Marketing",
    content:
      "Erstelle einen Newsletter für unser Unternehmen.\n\nThema: {{thema}}\nAngebote: {{angebote}}\nZielgruppe: {{zielgruppe}}\n\nDer Newsletter soll:\n1. Aufmerksamkeit erregen\n2. Produkte/Angebote vorstellen\n3. Call-to-Action enthalten\n4. Persönlich und authentisch wirken\n5. Österreichisches Deutsch verwenden",
    variables: ["thema", "angebote", "zielgruppe"],
    createdAt: Date.now(),
  },
  {
    id: "social-media",
    name: "Social Media Post",
    description: "Social Media Content erstellen",
    category: "Marketing",
    content:
      "Erstelle einen Social Media Post für:\n\nPlattform: {{plattform}}\nThema: {{thema}}\nProdukt/Aktion: {{inhalt}}\n\nDer Post soll:\n1. Aufmerksamkeit erregen\n2. Engagement fördern\n3. Passende Hashtags enthalten\n4. Call-to-Action haben\n5. Zur Marke passen",
    variables: ["plattform", "thema", "inhalt"],
    createdAt: Date.now(),
  },
]

export class PromptTemplateService {
  private templates: PromptTemplate[]

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("promptTemplates")
      this.templates = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES
    } else {
      this.templates = DEFAULT_TEMPLATES
    }
  }

  getAll(): PromptTemplate[] {
    return this.templates
  }

  getByCategory(category: string): PromptTemplate[] {
    return this.templates.filter((t) => t.category === category)
  }

  getCategories(): string[] {
    return Array.from(new Set(this.templates.map((t) => t.category)))
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.find((t) => t.id === id)
  }

  create(template: Omit<PromptTemplate, "id" | "createdAt">): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
    }
    this.templates.push(newTemplate)
    this.save()
    return newTemplate
  }

  update(id: string, updates: Partial<PromptTemplate>): void {
    const index = this.templates.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates }
      this.save()
    }
  }

  delete(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id)
    this.save()
  }

  fillTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.get(templateId)
    if (!template) throw new Error("Template not found")

    let content = template.content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value)
    }
    return content
  }

  private save(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("promptTemplates", JSON.stringify(this.templates))
    }
  }
}

export const promptTemplateService = new PromptTemplateService()
