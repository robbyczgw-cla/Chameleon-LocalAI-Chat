/**
 * Local SQLite Database for Chameleon AI Chat
 * Replaces Supabase for 100% local, private data storage
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Database file location
const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'chameleon.db')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Create database connection (singleton)
let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initializeSchema()
  }
  return db
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  const database = db!

  // Chats table
  database.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      model TEXT,
      persona TEXT,
      folder_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      title_generated_at INTEGER
    )
  `)

  // Messages table
  database.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      tokens_used INTEGER,
      cost REAL,
      search_results TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `)

  // Settings table (single row for single-user)
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Memories table
  database.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 2,
      source TEXT,
      created_at INTEGER NOT NULL,
      last_accessed INTEGER,
      access_count INTEGER DEFAULT 0
    )
  `)

  // Folders table
  database.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Comparison sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS comparison_sessions (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      models TEXT NOT NULL,
      responses TEXT NOT NULL,
      winner TEXT,
      timestamp INTEGER NOT NULL
    )
  `)

  // System prompts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS system_prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      prompt TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Create indexes for performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
  `)

  console.log('[SQLite] Database schema initialized')
}

// ==================== CHATS ====================

export interface ChatRow {
  id: string
  title: string
  model: string | null
  persona: string | null
  folder_id: string | null
  created_at: number
  updated_at: number
  title_generated_at: number | null
}

export interface MessageRow {
  id: string
  chat_id: string
  role: string
  content: string
  model: string | null
  tokens_used: number | null
  cost: number | null
  search_results: string | null
  timestamp: number
}

export function getAllChats(): ChatRow[] {
  const database = getDb()
  return database.prepare(`
    SELECT * FROM chats ORDER BY updated_at DESC
  `).all() as ChatRow[]
}

export function getChat(chatId: string): ChatRow | undefined {
  const database = getDb()
  return database.prepare(`
    SELECT * FROM chats WHERE id = ?
  `).get(chatId) as ChatRow | undefined
}

export function createChat(chat: {
  id: string
  title: string
  model?: string
  persona?: string
  folderId?: string
  createdAt: number
  updatedAt: number
}): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO chats (id, title, model, persona, folder_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    chat.id,
    chat.title,
    chat.model || null,
    chat.persona || null,
    chat.folderId || null,
    chat.createdAt,
    chat.updatedAt
  )
}

export function updateChat(chatId: string, updates: Partial<{
  title: string
  model: string
  persona: string
  folderId: string
  updatedAt: number
  titleGeneratedAt: number
}>): void {
  const database = getDb()
  const fields: string[] = []
  const values: any[] = []

  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.model !== undefined) {
    fields.push('model = ?')
    values.push(updates.model)
  }
  if (updates.persona !== undefined) {
    fields.push('persona = ?')
    values.push(updates.persona)
  }
  if (updates.folderId !== undefined) {
    fields.push('folder_id = ?')
    values.push(updates.folderId)
  }
  if (updates.updatedAt !== undefined) {
    fields.push('updated_at = ?')
    values.push(updates.updatedAt)
  }
  if (updates.titleGeneratedAt !== undefined) {
    fields.push('title_generated_at = ?')
    values.push(updates.titleGeneratedAt)
  }

  if (fields.length > 0) {
    values.push(chatId)
    database.prepare(`
      UPDATE chats SET ${fields.join(', ')} WHERE id = ?
    `).run(...values)
  }
}

export function deleteChat(chatId: string): void {
  const database = getDb()
  // Delete messages first (cascade)
  database.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId)
  database.prepare('DELETE FROM chats WHERE id = ?').run(chatId)
}

export function deleteAllChats(): void {
  const database = getDb()
  database.exec('DELETE FROM messages')
  database.exec('DELETE FROM chats')
}

// ==================== MESSAGES ====================

export function getMessages(chatId: string): MessageRow[] {
  const database = getDb()
  return database.prepare(`
    SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC
  `).all(chatId) as MessageRow[]
}

export function createMessage(message: {
  id: string
  chatId: string
  role: string
  content: string
  model?: string
  tokensUsed?: number
  cost?: number
  searchResults?: string
  timestamp: number
}): void {
  const database = getDb()
  // Use INSERT OR IGNORE to prevent duplicates during streaming
  database.prepare(`
    INSERT OR IGNORE INTO messages (id, chat_id, role, content, model, tokens_used, cost, search_results, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    message.id,
    message.chatId,
    message.role,
    typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    message.model || null,
    message.tokensUsed || null,
    message.cost || null,
    message.searchResults || null,
    message.timestamp
  )
}

export function updateMessage(messageId: string, content: string): void {
  const database = getDb()
  database.prepare(`
    UPDATE messages SET content = ? WHERE id = ?
  `).run(content, messageId)
}

export function deleteMessage(messageId: string): void {
  const database = getDb()
  database.prepare('DELETE FROM messages WHERE id = ?').run(messageId)
}

// ==================== SETTINGS ====================

export function getSettings(): Record<string, any> | null {
  const database = getDb()
  const row = database.prepare('SELECT data FROM settings WHERE id = 1').get() as { data: string } | undefined
  if (row) {
    try {
      return JSON.parse(row.data)
    } catch {
      return null
    }
  }
  return null
}

export function saveSettings(settings: Record<string, any>): void {
  const database = getDb()
  const now = Date.now()
  database.prepare(`
    INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = ?
  `).run(JSON.stringify(settings), now, JSON.stringify(settings), now)
}

// ==================== MEMORIES ====================

export interface MemoryRow {
  id: string
  type: string
  content: string
  importance: number
  source: string | null
  created_at: number
  last_accessed: number | null
  access_count: number
}

export function getAllMemories(): MemoryRow[] {
  const database = getDb()
  return database.prepare('SELECT * FROM memories ORDER BY importance DESC, created_at DESC').all() as MemoryRow[]
}

export function createMemory(memory: {
  id: string
  type: string
  content: string
  importance?: number
  source?: string
  createdAt: number
}): void {
  const database = getDb()
  database.prepare(`
    INSERT OR REPLACE INTO memories (id, type, content, importance, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    memory.id,
    memory.type,
    memory.content,
    memory.importance || 2,
    memory.source || null,
    memory.createdAt
  )
}

export function updateMemoryAccess(memoryId: string): void {
  const database = getDb()
  database.prepare(`
    UPDATE memories SET last_accessed = ?, access_count = access_count + 1 WHERE id = ?
  `).run(Date.now(), memoryId)
}

export function deleteMemory(memoryId: string): void {
  const database = getDb()
  database.prepare('DELETE FROM memories WHERE id = ?').run(memoryId)
}

export function deleteAllMemories(): void {
  const database = getDb()
  database.exec('DELETE FROM memories')
}

// ==================== FOLDERS ====================

export interface FolderRow {
  id: string
  name: string
  created_at: number
  updated_at: number
}

export function getAllFolders(): FolderRow[] {
  const database = getDb()
  return database.prepare('SELECT * FROM folders ORDER BY name ASC').all() as FolderRow[]
}

export function createFolder(folder: {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO folders (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(folder.id, folder.name, folder.createdAt, folder.updatedAt)
}

export function deleteFolder(folderId: string): void {
  const database = getDb()
  // Remove folder reference from chats
  database.prepare('UPDATE chats SET folder_id = NULL WHERE folder_id = ?').run(folderId)
  database.prepare('DELETE FROM folders WHERE id = ?').run(folderId)
}

// ==================== COMPARISON SESSIONS ====================

export interface ComparisonSessionRow {
  id: string
  prompt: string
  models: string
  responses: string
  winner: string | null
  timestamp: number
}

export function getAllComparisonSessions(): ComparisonSessionRow[] {
  const database = getDb()
  return database.prepare('SELECT * FROM comparison_sessions ORDER BY timestamp DESC').all() as ComparisonSessionRow[]
}

export function createComparisonSession(session: {
  id: string
  prompt: string
  models: string[]
  responses: Record<string, string>
  winner?: string
  timestamp: number
}): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO comparison_sessions (id, prompt, models, responses, winner, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    session.id,
    session.prompt,
    JSON.stringify(session.models),
    JSON.stringify(session.responses),
    session.winner || null,
    session.timestamp
  )
}

export function deleteComparisonSession(sessionId: string): void {
  const database = getDb()
  database.prepare('DELETE FROM comparison_sessions WHERE id = ?').run(sessionId)
}

export function deleteAllComparisonSessions(): void {
  const database = getDb()
  database.exec('DELETE FROM comparison_sessions')
}

// ==================== SYSTEM PROMPTS ====================

export interface SystemPromptRow {
  id: string
  name: string
  description: string | null
  prompt: string
  is_default: number
  created_at: number
  updated_at: number
}

export function getAllSystemPrompts(): SystemPromptRow[] {
  const database = getDb()
  return database.prepare('SELECT * FROM system_prompts ORDER BY created_at ASC').all() as SystemPromptRow[]
}

export function getSystemPrompt(promptId: string): SystemPromptRow | undefined {
  const database = getDb()
  return database.prepare('SELECT * FROM system_prompts WHERE id = ?').get(promptId) as SystemPromptRow | undefined
}

export function createSystemPrompt(prompt: {
  id: string
  name: string
  description?: string
  prompt: string
  isDefault?: boolean
  createdAt: number
  updatedAt: number
}): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO system_prompts (id, name, description, prompt, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    prompt.id,
    prompt.name,
    prompt.description || null,
    prompt.prompt,
    prompt.isDefault ? 1 : 0,
    prompt.createdAt,
    prompt.updatedAt
  )
}

export function updateSystemPrompt(promptId: string, updates: {
  name?: string
  description?: string
  prompt?: string
  isDefault?: boolean
  updatedAt: number
}): void {
  const database = getDb()
  const fields: string[] = ['updated_at = ?']
  const values: any[] = [updates.updatedAt]

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.prompt !== undefined) {
    fields.push('prompt = ?')
    values.push(updates.prompt)
  }
  if (updates.isDefault !== undefined) {
    fields.push('is_default = ?')
    values.push(updates.isDefault ? 1 : 0)
  }

  values.push(promptId)
  database.prepare(`
    UPDATE system_prompts SET ${fields.join(', ')} WHERE id = ?
  `).run(...values)
}

export function setDefaultSystemPrompt(promptId: string): void {
  const database = getDb()
  // Clear all defaults first
  database.prepare('UPDATE system_prompts SET is_default = 0').run()
  // Set the new default
  database.prepare('UPDATE system_prompts SET is_default = 1 WHERE id = ?').run(promptId)
}

export function deleteSystemPrompt(promptId: string): void {
  const database = getDb()
  database.prepare('DELETE FROM system_prompts WHERE id = ?').run(promptId)
}

// ==================== UTILITIES ====================

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getDatabasePath(): string {
  return DB_PATH
}

export function getDatabaseSize(): number {
  try {
    const stats = fs.statSync(DB_PATH)
    return stats.size
  } catch {
    return 0
  }
}
