"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/contexts/app-context"
import { Lightbulb, Zap, Terminal, MessageSquare } from "lucide-react"

interface ModeHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModeHelpDialog({ open, onOpenChange }: ModeHelpDialogProps) {
  const { settings } = useApp()
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  // Detect if we're in Advanced mode from localStorage (consistent with other components)
  useEffect(() => {
    const mode = localStorage.getItem("app-mode")
    const isAdvanced = mode === "advanced"
    console.log("[ModeHelpDialog] Mode detection:", { mode, isAdvanced })
    setIsAdvancedMode(isAdvanced)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Hilfe & Tipps
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isAdvancedMode
              ? "Erweiterte Funktionen und Prompting-Tipps"
              : "Erste Schritte und grundlegende Tipps"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-2 sm:pr-4">
          {isAdvancedMode ? <AdvancedModeHelp /> : <SimpleModeHelp />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function SimpleModeHelp() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Erste Schritte
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Persona wählen:</strong> Wähle eine Persönlichkeit die zu deiner Aufgabe passt (Cami für Allgemeines, Dev für Code, Luna für Kreatives)</li>
          <li>• <strong>Einfach fragen:</strong> Stelle deine Frage natürlich, als würdest du mit einem Menschen sprechen</li>
          <li>• <strong>Modell auswählen:</strong> GPT-4o-mini ist schnell und günstig, Claude Sonnet ist präziser und denkt tiefer</li>
          <li>• <strong>Follow-up Fragen:</strong> Nutze die vorgeschlagenen Fragen am Ende jeder Antwort</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">💡 Prompting-Grundlagen</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Sei spezifisch:</strong> "Erkläre Photosynthese für ein 10-jähriges Kind" statt nur "Was ist Photosynthese?"</li>
          <li>• <strong>Gib Kontext:</strong> "Ich bin Anfänger in Python und möchte..." hilft der KI besser zu antworten</li>
          <li>• <strong>Schritt für Schritt:</strong> Bei komplexen Aufgaben bitte um eine schrittweise Erklärung</li>
          <li>• <strong>Beispiele geben:</strong> "Schreib einen Text wie dieser: [Beispiel]"</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">🔍 Web-Suche nutzen</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Aktuelle Infos:</strong> Aktiviere die Web-Suche für aktuelle Ereignisse, Preise, News</li>
          <li>• <strong>Faktencheck:</strong> Die KI verwendet echte Suchergebnisse statt zu raten</li>
          <li>• <strong>Bilder:</strong> Such-Bilder werden automatisch in die Antwort eingebunden</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">⚙️ Einstellungen</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Statistiken:</strong> Zeigt Token-Anzahl und Kosten jeder Nachricht</li>
          <li>• <strong>Dark Mode:</strong> Schont die Augen bei Nachtarbeit</li>
          <li>• <strong>Modellvergleich:</strong> Vergleiche zwei Modelle gleichzeitig</li>
        </ul>
      </section>
    </div>
  )
}

function AdvancedModeHelp() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="commands" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commands">Slash Commands</TabsTrigger>
          <TabsTrigger value="prompting">Prompting-Tipps</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="commands" className="space-y-6 mt-4">
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Slash Commands - Schnellzugriff auf Workflows
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Slash Commands sind Shortcuts die automatisch spezialisierte Prompts erstellen.
              Tippe einfach "/" im Chat-Input um eine Liste zu sehen, oder nutze die Commands direkt.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-base mb-3 text-blue-600">💻 Code Commands</h4>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/fix</code>
                  <span className="text-sm font-medium">Fix code errors and bugs</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Analysiert deinen Code und behebt Fehler, Bugs und Issues. Erklärt was falsch war und wie es gefixt wurde.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Beispiel:</strong> <code>/fix</code> dann füge deinen Code ein
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/explain</code>
                  <span className="text-sm font-medium">Explain code or concept</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Erklärt Code oder Konzepte im Detail, zerlegt wie es funktioniert, erklärt jeden Schritt.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Beispiel:</strong> <code>/explain</code> [Code oder Konzept das du verstehen willst]
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/optimize</code>
                  <span className="text-sm font-medium">Optimize code performance</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Optimiert Code für Performance, Lesbarkeit und Best Practices. Erklärt alle Verbesserungen.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Use Case:</strong> Langsame Funktionen, ineffiziente Algorithmen, Code Cleanup
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/test</code>
                  <span className="text-sm font-medium">Generate unit tests</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Generiert umfassende Unit Tests für deinen Code. Inkludiert Edge Cases und Error Handling.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Perfekt für:</strong> Jest, Vitest, Mocha - alle Testing Frameworks
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/review</code>
                  <span className="text-sm font-medium">Code review and suggestions</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Detailliertes Code Review: Security, Performance, Best Practices, potentielle Bugs.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Checkt:</strong> SQL Injection, XSS, Memory Leaks, Race Conditions, Code Smells
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/refactor</code>
                  <span className="text-sm font-medium">Refactor code for clarity</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Refactored Code für bessere Lesbarkeit, Wartbarkeit und Best Practices.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Verbessert:</strong> Naming, Struktur, DRY Prinzip, SOLID Principles
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/debug</code>
                  <span className="text-sm font-medium">Help debug an issue</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Hilft beim Debugging. Analysiert Code, identifiziert das Problem, schlägt Lösungen vor.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Tipp:</strong> Füge Error Messages und Stack Traces hinzu für bessere Analyse
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-base mb-3 text-green-600">📝 Text Commands</h4>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/summarize</code>
                  <span className="text-sm font-medium">Summarize text</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Erstellt prägnante Zusammenfassungen von langen Texten, Artikeln, Dokumenten.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Perfekt für:</strong> Research Papers, Artikel, Meeting Notes, Dokumentation
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/improve</code>
                  <span className="text-sm font-medium">Improve writing</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Verbessert Texte in Klarheit, Grammatik und Stil. Macht sie professioneller und lesbarer.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Use Cases:</strong> E-Mails, Bewerbungen, Blog Posts, Dokumentation
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/translate</code>
                  <span className="text-sm font-medium">Translate text</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Übersetzt Texte. Erkennt die Quellsprache automatisch und fragt nach Zielsprache.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Vorteil:</strong> Kontextbewusste Übersetzung, keine wörtliche Translation
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/proofread</code>
                  <span className="text-sm font-medium">Proofread for errors</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Korrekturlesen für Grammatik, Rechtschreibung und Zeichensetzung. Markiert Fehler und korrigiert sie.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Checkt:</strong> Typos, Kommasetzung, Satzbau, Rechtschreibung
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-base mb-3 text-purple-600">🔍 Analysis Commands</h4>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/analyze</code>
                  <span className="text-sm font-medium">Analyze in detail</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Detaillierte Analyse von allem: Text, Code, Daten, Konzepte, Argumente.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Output:</strong> Strukturierte, tiefgehende Analyse mit Pro/Contra, Patterns, Insights
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/compare</code>
                  <span className="text-sm font-medium">Compare options</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Vergleicht Optionen mit Pro/Contra. Perfekt für Entscheidungen.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Beispiel:</strong> <code>/compare React vs Vue vs Svelte für mein Projekt</code>
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/eli5</code>
                  <span className="text-sm font-medium">Explain like I'm 5</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Erklärt komplexe Konzepte in super einfachen Worten. Perfekt für neue Themen.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Nutze es für:</strong> Blockchain, Quantencomputer, Machine Learning, usw.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-base mb-3 text-orange-600">⚡ Utility Commands</h4>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/continue</code>
                  <span className="text-sm font-medium">Continue previous response</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Setzt die vorherige Antwort fort wenn sie abgebrochen wurde oder unvollständig ist.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Nützlich wenn:</strong> Response wurde unterbrochen, Token Limit erreicht
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/shorter</code>
                  <span className="text-sm font-medium">Make response shorter</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Macht die vorherige Antwort kürzer und prägnanter. Reduziert auf das Wesentliche.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Spart:</strong> Tokens und Zeit. Perfekt wenn die Antwort zu ausführlich war.
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-1">
                  <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">/longer</code>
                  <span className="text-sm font-medium">Make response longer</span>
                </div>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  Erweitert die vorherige Antwort mit mehr Details, Beispielen und Erklärungen.
                </p>
                <p className="text-xs text-muted-foreground ml-2 mt-2">
                  <strong>Perfekt wenn:</strong> Du mehr Details, mehr Beispiele, tiefere Erklärungen brauchst
                </p>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-base mb-2">💡 Pro-Tipps für Slash Commands</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Kombinieren:</strong> Nutze mehrere Commands nacheinander (z.B. erst /explain dann /optimize)</li>
              <li>• <strong>Context geben:</strong> Füge nach dem Command zusätzlichen Context hinzu für bessere Ergebnisse</li>
              <li>• <strong>Autocomplete:</strong> Tippe "/" und wähle aus der Liste - schneller als ausschreiben</li>
              <li>• <strong>Iterativ:</strong> /optimize → /test → /review → perfekter Code!</li>
              <li>• <strong>Mit Web-Suche:</strong> Commands funktionieren auch mit Web-Suche für aktuelle Infos</li>
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="prompting" className="space-y-6 mt-4">
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fortgeschrittene Prompting-Techniken
            </h3>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Chain of Thought (CoT)</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Bitte die KI, Schritt für Schritt zu denken. Dramatisch bessere Ergebnisse bei komplexen Tasks.
                </p>
                <div className="bg-background/80 p-3 rounded border border-primary/20">
                  <p className="text-xs font-mono mb-1">Beispiel:</p>
                  <p className="text-xs text-muted-foreground italic">
                    "Analysiere diesen Code Schritt für Schritt: 1) Was macht jede Funktion? 2) Wo sind potentielle Bugs? 3) Wie kann man es optimieren?"
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Wann nutzen:</strong> Debugging, Mathematik, komplexe Logik, Entscheidungen
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Role Prompting</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Weise der KI eine spezifische Rolle/Expertise zu für domain-spezifische Antworten.
                </p>
                <div className="bg-background/80 p-3 rounded border border-primary/20">
                  <p className="text-xs font-mono mb-1">Beispiel:</p>
                  <p className="text-xs text-muted-foreground italic">
                    "Du bist ein Senior Software-Architekt mit 15 Jahren Erfahrung in verteilten Systemen. Reviewe diese Microservice-Architektur..."
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Pro-Tipp:</strong> Je spezifischer die Rolle, desto besser die Qualität. Füge Jahre Erfahrung, Spezialisierungen hinzu.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Few-Shot Learning</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Gib 2-3 Beispiele des gewünschten Outputs, dann die eigentliche Task. Die KI lernt das Muster.
                </p>
                <div className="bg-background/80 p-3 rounded border border-primary/20">
                  <p className="text-xs font-mono mb-1">Beispiel:</p>
                  <p className="text-xs text-muted-foreground italic">
                    "Extrahiere Entities:<br/>
                    Input: 'Apple kauft Start-up für $1M'<br/>
                    Output: {'Company: Apple, Amount: $1M, Action: acquisition'}<br/><br/>
                    Input: 'Tesla baut Fabrik in Berlin'<br/>
                    Output: {'Company: Tesla, Location: Berlin, Action: construction'}<br/><br/>
                    Jetzt du: 'Google investiert $500M in KI-Forschung'"
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Perfekt für:</strong> Formatting, Extraktion, Transformation, Custom Output Structures
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Constraints & Guardrails</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Setze klare Einschränkungen für präzise Kontrolle über Output-Länge, -Format und -Stil.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Länge:</strong> "Antworte in maximal 3 Sätzen" / "Nicht länger als 100 Wörter"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Format:</strong> "Nur Bullet Points, keine Prosa" / "JSON Format: &#123; &quot;key&quot;: &quot;value&quot; &#125;"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Tech Stack:</strong> "Nur TypeScript und React, keine jQuery" / "Python 3.11+ mit type hints"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Stil:</strong> "Technisch und präzise, keine Metaphern" / "ELI5 Style, sehr einfach"
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Tree of Thoughts (ToT)</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Für sehr komplexe Probleme: Lass die KI mehrere Lösungsansätze parallel explorieren.
                </p>
                <div className="bg-background/80 p-3 rounded border border-primary/20">
                  <p className="text-xs font-mono mb-1">Beispiel:</p>
                  <p className="text-xs text-muted-foreground italic">
                    "Generiere 3 verschiedene Lösungsansätze für [Problem]. Für jeden Ansatz: 1) Beschreibe die Strategie 2) Pros/Cons 3) Implementierungskomplexität. Dann wähle den besten Ansatz und erkläre warum."
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <strong className="text-sm block mb-2">Self-Consistency</strong>
                <p className="text-xs text-muted-foreground mb-3">
                  Bitte um mehrere Antworten für kritische Entscheidungen, vergleiche Konsistenz.
                </p>
                <div className="bg-background/80 p-3 rounded border border-primary/20">
                  <p className="text-xs font-mono mb-1">Beispiel:</p>
                  <p className="text-xs text-muted-foreground italic">
                    "Löse dieses Problem auf 3 verschiedene Wege. Wenn alle 3 zum gleichen Ergebnis kommen, bin ich confident. Falls nicht, erkläre die Unterschiede."
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">🎯 System-Prompt Engineering</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Der System-Prompt definiert das Verhalten der KI für den gesamten Chat. Optimiere ihn für maximale Performance.
            </p>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-xs block mb-1">1. Rolle & Expertise definieren</strong>
                <p className="text-xs text-muted-foreground">
                  ❌ "Du bist hilfsbereit"<br/>
                  ✅ "Du bist ein Senior Full-Stack Developer mit 10 Jahren Erfahrung in React, Node.js und PostgreSQL. Du kennst Performance-Optimierung, Security Best Practices und moderne DevOps."
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-xs block mb-1">2. Output-Erwartungen setzen</strong>
                <p className="text-xs text-muted-foreground">
                  "Antworte IMMER mit: 1) Kurze Erklärung 2) Code-Beispiel 3) Mögliche Fallstricke 4) Alternative Ansätze"
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-xs block mb-1">3. Vermeide ungewolltes Verhalten</strong>
                <p className="text-xs text-muted-foreground">
                  "Nutze NIEMALS: jQuery, var keyword, callbacks (nur Promises/async-await), inline styles"
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-xs block mb-1">4. Tonalität & Stil</strong>
<p className="text-xs text-muted-foreground">
                  "Sei präzise und technisch. Nutze keine Metaphern oder Analogien. Code &gt; Erklärungen. Sei direkt und effizient."
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-xs block mb-1">5. Reasoning explizit machen</strong>
                <p className="text-xs text-muted-foreground">
                  "Erkläre IMMER dein Reasoning bevor du Code gibst. Warum dieser Ansatz? Welche Alternativen gibt es?"
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">💬 Conversation Design</h3>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Context Window strategisch nutzen</strong>
                <p className="text-xs text-muted-foreground mb-2">
                  Die KI sieht den gesamten Chat-Verlauf. Nutze das:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Baue auf vorherigen Antworten auf: "Erweitere die Funktion von vorhin mit Error Handling"</li>
                  <li>• Referenziere spezifische Messages: "In Message 3 hast du X gesagt, wie passt das zu Y?"</li>
                  <li>• Inkrementell verfeinern: Starte breit, dann iteriere in die Details</li>
                  <li>• Context Priming: Etabliere wichtige Facts am Anfang des Chats</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Branching für Exploration</strong>
                <p className="text-xs text-muted-foreground mb-2">
                  Nutze Branches um verschiedene Ansätze zu testen ohne den Haupt-Chat zu verlieren.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Branch 1: "Implementiere mit React Hooks"</li>
                  <li>• Branch 2: "Implementiere mit Zustand"</li>
                  <li>• Branch 3: "Implementiere mit Redux"</li>
                  <li>→ Vergleiche Ergebnisse, wähle beste Lösung</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Iteratives Refinement Pattern</strong>
                <p className="text-xs text-muted-foreground mb-2">
                  Großartige Ergebnisse entstehen durch Iteration:
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Runde 1:</strong> "Generiere eine React Component für einen Todo-List"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Runde 2:</strong> "Gut! Jetzt füge TypeScript types hinzu"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Runde 3:</strong> "Perfekt. Jetzt optimiere für Performance mit useMemo"
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Runde 4:</strong> "Letzte Änderung: Füge Unit Tests hinzu"
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Memory System nutzen</strong>
                <p className="text-xs text-muted-foreground mb-2">
                  Aktiviere Memory für Projekt-spezifischen Context der über Chats hinweg persistent ist:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• "Speichere: Ich nutze TypeScript, React 18, Tailwind für alle Projekte"</li>
                  <li>• "Speichere: Mein Code-Style: max 80 chars, semicolons, single quotes"</li>
                  <li>• Die KI nutzt diese Infos automatisch in neuen Chats</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold text-base mb-3">🎓 Prompting Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <strong className="text-green-600 block mb-1">✅ DO:</strong>
                <ul className="space-y-1 text-muted-foreground ml-3">
                  <li>• Sei spezifisch und detailliert</li>
                  <li>• Gib Kontext und Hintergrund</li>
                  <li>• Definiere Output-Format</li>
                  <li>• Nutze Beispiele (Few-Shot)</li>
                  <li>• Iteriere und verfeinere</li>
                  <li>• Bitte um Reasoning</li>
                  <li>• Setze Constraints</li>
                </ul>
              </div>
              <div>
                <strong className="text-red-600 block mb-1">❌ DON'T:</strong>
                <ul className="space-y-1 text-muted-foreground ml-3">
                  <li>• Vage Anfragen ("mach was")</li>
                  <li>• Zu kurze Prompts ohne Context</li>
                  <li>• Mehrere Tasks in einer Message</li>
                  <li>• Widersprüchliche Instructions</li>
                  <li>• Implizite Annahmen</li>
                  <li>• Erste Version als Final akzeptieren</li>
                </ul>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="features" className="space-y-6 mt-4">
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Erweiterte Features
            </h3>

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">🧠 Memory System</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Das Memory System speichert wichtige Informationen über deine Präferenzen, Projekte und Kontext persistent über alle Chats hinweg.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Aktivierung:</strong> Klicke auf das Gehirn-Icon im Chat Header
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Was wird gespeichert:</strong> Präferenzen, Code-Style, Projekt-Details, häufige Workflows
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Vorteil:</strong> Die KI "erinnert" sich an dich über Sessions hinweg
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Beispiel:</strong> Speichere "Ich nutze TypeScript mit strict mode, React 18, und Tailwind" - die KI nutzt das automatisch in zukünftigen Chats.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">🔍 Erweiterte Web-Suche</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Drei Search Provider mit unterschiedlichen Stärken: Serper (Google), Tavily (AI-optimiert), You.com (Deep Crawl).
                </p>
                <div className="space-y-3">
                  <div>
                    <strong className="text-xs block mb-1">Search Depth (Tavily):</strong>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• <strong>Basic:</strong> Schnelle Suche, Top-Ergebnisse (5-10 Quellen)</li>
                      <li>• <strong>Advanced:</strong> Tiefe Recherche, mehr Quellen (15-20), besserer Context</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-xs block mb-1">Domain-Filter:</strong>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Include Domains: Nur von spezifischen Sites suchen (z.B. github.com)</li>
                      <li>• Exclude Domains: Bestimmte Sites ausschließen</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-xs block mb-1">Time Range (Serper):</strong>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Nur Ergebnisse von letzter Stunde/Tag/Woche/Monat/Jahr</li>
                      <li>• Perfekt für News, Updates, neue Releases</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-xs block mb-1">Raw Content (You.com):</strong>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Livecrawl: Fetcht vollständige Seiteninhalte in Echtzeit</li>
                      <li>• Markdown Format für bessere Lesbarkeit</li>
                      <li>• Ideal für detaillierte Dokumentation und Research</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">📚 Document Collections (RAG)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Lade eigene Dokumente hoch und chatte mit ihnen. Retrieval Augmented Generation (RAG) findet relevante Passagen automatisch.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Unterstützte Formate:</strong> PDF, TXT, MD, Code-Dateien (js, ts, py, etc.)
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Collections:</strong> Organisiere Dokumente thematisch (z.B. "Projekt X Docs")
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Attach:</strong> Wähle Collection für aktuellen Chat - KI nutzt sie als Wissensquelle
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Use Case:</strong> Lade deine Projekt-Dokumentation hoch, dann: "Wie funktioniert die Auth in unserem System?"
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">📊 Modellvergleich</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Teste zwei Modelle Side-by-Side mit der gleichen Frage. Vergleiche Qualität, Geschwindigkeit und Kosten direkt.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Aktivierung:</strong> Einstellungen → "Compare Mode" aktivieren
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Wähle 2 Modelle:</strong> Z.B. GPT-4o vs Claude Sonnet, oder Llama vs Grok
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Vergleiche:</strong> Antwortqualität, Reasoning, Kreativität, Genauigkeit
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Metrics:</strong> Response Time, Token Usage, Cost per Query
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Perfekt für:</strong> Model Selection, A/B Testing, Benchmark verschiedener Modelle
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">🌳 Conversation Branching</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Erstelle alternative Gesprächsverläufe ab jedem Punkt. Teste verschiedene Ansätze ohne den Haupt-Chat zu verlieren.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Erstellen:</strong> Klicke auf Branch-Icon (🌿) bei jeder Message
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Navigation:</strong> Wechsle zwischen Branches mit Branch Navigator
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Merge:</strong> Kopiere beste Teile aus verschiedenen Branches
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Use Case:</strong> Du hast eine Code-Lösung, möchtest aber 3 verschiedene Optimierungs-Ansätze testen → Erstelle 3 Branches und vergleiche.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">📈 Cost & Token Tracking</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Detailliertes Tracking von Token Usage und Kosten für jeden Chat und über Zeit.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Per Message:</strong> Siehe Input/Output Tokens und Kosten
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Per Chat:</strong> Gesamte Token Usage und Kosten für Session
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Dashboard:</strong> Statistiken über Zeit, per Model, Trends
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Aktivierung:</strong> Einstellungen → "Show Stats" aktivieren
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">⌨️ Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Cmd/Ctrl + K:</strong> Neue Chat
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Cmd/Ctrl + Enter:</strong> Send Message
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Cmd/Ctrl + /:</strong> Slash Commands
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Cmd/Ctrl + B:</strong> Toggle Sidebar
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>Esc:</strong> Stop Generation
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong>↑ (in Input):</strong> Edit Last Message
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">🤖 Die besten LLM Modelle in 2025</h3>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">🏆 Flagship Models - Top Performance</strong>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Claude Sonnet 4.5:</strong> Weltbester Coding Model (77.2% SWE-bench). Perfekt für Coding, Agents, Computer Use. $3/$15
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">GPT-5 (Aug 2025):</strong> OpenAI's neuestes Flagship. Industry Benchmark für komplexes Reasoning. Top für Real-Repo Coding. $5/$15
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-green-600">Gemini 2.5 Pro:</strong> Erster Multi-Agent Model mit 1M Context. Exzellent für große Repos & Refactoring. $2.50/$10
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-orange-600">Grok 4:</strong> xAI's Flagship mit Echtzeit-Training. Stark in Reasoning & aktuellem Wissen. $3/$9
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Claude Opus 4.1:</strong> Maximum Reasoning & Deep Analysis. Für hochkomplexe Research & kritische Entscheidungen. $15/$75
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">💰 Beste Preis-Leistung 2025</strong>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">Grok 4 Fast (Default):</strong> Perfekter Balance: Schnell, günstig, qualitativ hochwertig. 3.4% Market Share auf OpenRouter. $0.20/$0.50
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-green-600">Gemini 2.5 Flash:</strong> Extrem schnell & sehr günstig. 4.7% Market Share. Perfekt für schnelle Tasks. $0.30/$0.90
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-orange-600">Claude Haiku 4.5:</strong> Anthropic's schnellste & günstigste Option. Stark für einfache bis mittlere Tasks. $0.25/$1.25
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">DeepSeek V3.2:</strong> Sehr populär (2.7% Market Share). Extrem günstig, open weights. Stark für Coding. $0.14/$0.28
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">GPT-5 Mini:</strong> OpenAI's effiziente Version. Gut für einfache Tasks & Drafts. $0.15/$0.60
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">🔓 Open Source & Open Weights 2025</strong>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Llama 4 Maverick (FREE):</strong> Meta's neuestes Open Model. Cost-effective für Implementation. Komplett kostenlos!
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-green-600">DeepSeek V3 (FREE):</strong> Top Open Weights Model aus China. 2.9% Monthly Market Share. Exzellent für Coding. Kostenlos!
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-orange-600">Qwen 3 235B Thinking:</strong> Alibaba's Reasoning Model. Starke Thinking Capabilities. Open Weights.
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">GLM-4.6:</strong> Zhipu AI's Model aus China. 5.9% Market Share auf OpenRouter. Stark in Multi-Lingual Tasks.
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Minimax M2:</strong> 9.2% Market Share! Einer der populärsten Models auf OpenRouter in Nov 2025.
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">💻 Spezialisiert für Code 2025</strong>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">Grok Code Fast:</strong> xAI's spezialisierter Coding Model. Optimiert für schnelle Code-Generation.
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Qwen 3 Coder 480B:</strong> Einer der größten Open Source Coding Models. Stark für komplexe Projekte.
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-green-600">DeepSeek Coder V3:</strong> Neustes Coding Model von DeepSeek. Open Weights, sehr cost-effective.
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-orange-600">Codestral 2025:</strong> Mistral's aktualisierter Coding Model. Stark für Day-to-Day Coding Tasks.
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg">
                <strong className="text-sm block mb-2">📊 2025 Market Trends (Nov 2025)</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Top 3 Market Share:</strong> Claude 4.5 Sonnet (9.7%), Minimax M2 (9.2%), GLM-4.6 (5.9%)</li>
                  <li>• <strong>Preise gesunken:</strong> 50-98% Preisreduktion seit 2024! KI wird immer günstiger</li>
                  <li>• <strong>Context explodiert:</strong> Gemini 2.5 mit 1M tokens, Opus 4.1 mit 500K+ tokens</li>
                  <li>• <strong>Open Weights dominieren:</strong> DeepSeek V3, Llama 4, Qwen 3 konkurrieren mit Closed-Source</li>
                  <li>• <strong>Multi-Agent Systems:</strong> Gemini 2.5 führt mit parallel reasoning agents</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">💰 Kosten optimieren</h3>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Model-Wahl für den Use Case 2025</strong>
                <div className="space-y-2 text-xs">
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-green-600">Kostenlos:</strong> Llama 4 Maverick, DeepSeek V3, Llama 4 Scout - Perfekt für Experiments & Prototyping
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-blue-600">Ultra-günstig:</strong> DeepSeek V3.2 ($0.14/$0.28), GPT-5 Mini ($0.15/$0.60) - Für einfache Tasks & High Volume
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-purple-600">Balanced:</strong> Grok 4 Fast ($0.20/$0.50), Gemini Flash ($0.30/$0.90) - Beste Preis-Leistung 2025
                  </div>
                  <div className="bg-background/80 p-2 rounded">
                    <strong className="text-orange-600">Premium:</strong> Claude Sonnet 4.5 ($3/$15), GPT-5 ($5/$15) - Für Production & kritische Tasks
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Context Management</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Neue Chats:</strong> Starte neue Chats statt sehr lange zu führen (spart Context Tokens)</li>
                  <li>• <strong>Memory nutzen:</strong> Wichtige Infos in Memory → kürzer Context Window nötig</li>
                  <li>• <strong>Zusammenfassungen:</strong> Fasse lange Conversations zusammen, starte fresh mit Summary</li>
                  <li>• <strong>Document Collections:</strong> Docs in RAG statt in Chat → nur relevante Chunks im Context</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Output Length kontrollieren</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• "Antworte in maximal 100 Wörtern" spart Output-Tokens (teurer als Input!)</li>
                  <li>• "Nur Code, keine Erklärungen" wenn du die Explanation nicht brauchst</li>
                  <li>• Nutze /shorter für kürzere Versionen</li>
                  <li>• Streaming abbrechen (ESC) wenn du die Info schon hast</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <strong className="text-sm block mb-2">Smart Prompting spart Tokens</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Präzise sein:</strong> Vage Prompts → lange Antworten → hohe Kosten</li>
                  <li>• <strong>Output Format:</strong> "JSON Format" statt Prosa spart Tokens</li>
                  <li>• <strong>Constraints:</strong> Klare Limits setzen reduziert unnötigen Output</li>
                  <li>• <strong>System Prompt:</strong> "Sei concise" im System Prompt → kürzere Antworten global</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold text-base mb-2">🎯 Pro-Workflow: Kosten vs Qualität</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Der optimale Workflow nutzt günstige Modelle für Drafts, teure für Finals:
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="bg-background/80 p-2 rounded">
                <strong>1. Brainstorm:</strong> GPT-4o-mini - schnell und günstig für Ideen generieren
              </div>
              <div className="bg-background/80 p-2 rounded">
                <strong>2. Draft:</strong> Llama 3.1 70B - solide Qualität für ersten Code/Text
              </div>
              <div className="bg-background/80 p-2 rounded">
                <strong>3. Refine:</strong> Claude Sonnet - hochwertige Optimierung und Refinement
              </div>
              <div className="bg-background/80 p-2 rounded">
                <strong>4. Final Review:</strong> GPT-4o oder Claude Opus - kritisches Review für Production
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Ersparnis:</strong> 60-70% Kosten bei nur 10-15% Qualitätsverlust im Gesamtprozess!
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

