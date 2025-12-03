/**
 * Contexts Module
 * Unified exports for all React contexts
 */

// Main app context (combines all functionality - backward compatible)
export { AppProvider, useApp } from "./app-context"

// Individual contexts for more granular usage
export { AuthProvider, useAuth } from "./auth-context"
export { SettingsProvider, useSettings, DEFAULT_SETTINGS, deepMergeSettings } from "./settings-context"
export { ChatsProvider, useChats } from "./chats-context"
