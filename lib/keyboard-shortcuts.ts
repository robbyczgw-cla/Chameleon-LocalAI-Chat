import type { KeyboardShortcut } from "@/types"

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: "n", ctrl: true, action: "new-chat", description: "New chat" },
  { key: "k", ctrl: true, action: "search", description: "Search chats" },
  { key: "b", ctrl: true, action: "toggle-sidebar", description: "Toggle sidebar" },
  { key: ",", ctrl: true, action: "settings", description: "Open settings" },
  { key: "d", ctrl: true, action: "toggle-theme", description: "Toggle theme" },
  { key: "e", ctrl: true, action: "export-chat", description: "Export current chat" },
  { key: "p", ctrl: true, action: "prompt-library", description: "Open prompt library" },
  { key: "m", ctrl: true, action: "model-selector", description: "Open model selector" },
  { key: "Enter", ctrl: true, action: "send-message", description: "Send message" },
  { key: "Escape", action: "cancel", description: "Cancel/Close" },
]

export class KeyboardShortcutService {
  private shortcuts: KeyboardShortcut[]
  private handlers: Map<string, () => void> = new Map()

  constructor(shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS) {
    this.shortcuts = shortcuts
  }

  register(action: string, handler: () => void): void {
    this.handlers.set(action, handler)
  }

  unregister(action: string): void {
    this.handlers.delete(action)
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const shortcut = this.shortcuts.find(
      (s) =>
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrl === (event.ctrlKey || event.metaKey) &&
        !!s.shift === event.shiftKey &&
        !!s.alt === event.altKey,
    )

    if (shortcut) {
      const handler = this.handlers.get(shortcut.action)
      if (handler) {
        event.preventDefault()
        handler()
        return true
      }
    }

    return false
  }

  getShortcuts(): KeyboardShortcut[] {
    return this.shortcuts
  }

  getShortcutForAction(action: string): KeyboardShortcut | undefined {
    return this.shortcuts.find((s) => s.action === action)
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push("Ctrl")
    if (shortcut.shift) parts.push("Shift")
    if (shortcut.alt) parts.push("Alt")
    parts.push(shortcut.key.toUpperCase())
    return parts.join("+")
  }
}

export const keyboardShortcutService = new KeyboardShortcutService()
