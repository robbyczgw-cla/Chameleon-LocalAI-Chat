# 🗄️ Database Schema

Complete Supabase PostgreSQL schema documentation.

---

## Overview

- **Database:** Supabase PostgreSQL 15
- **Tables:** 5 core tables + auth.users
- **Policies:** Row-Level Security (RLS) on all tables
- **Migrations:** 23 SQL scripts in `/scripts`
- **Triggers:** Auto-timestamps, profile creation

---

## Schema Diagram

```
┌─────────────────────┐
│    auth.users       │ (Supabase managed)
│  - id (uuid)        │
│  - email            │
└──────────┬──────────┘
           │
           │ (1:1)
           ▼
┌─────────────────────┐
│     profiles        │
│  - id (uuid) PK     │◄──┐
│  - email            │   │
│  - display_name     │   │ (1:Many)
│  - preferences      │   │
└─────────────────────┘   │
                          │
           ┌──────────────┘
           │
    ┌──────▼──────┐     ┌──────────────┐
    │   folders   │     │    chats     │
    │  - id PK    │◄────┤  - id PK     │
    │  - name     │     │  - title     │
    │  - parent   │     │  - persona   │
    └─────────────┘     │  - folder_id │
                        └──────┬───────┘
                               │ (1:Many)
                               ▼
                        ┌──────────────┐
                        │   messages   │
                        │  - id PK     │
                        │  - chat_id   │
                        │  - role      │
                        │  - content   │
                        │  - metadata  │
                        └──────────────┘
```

---

## Tables

### `profiles`

User profile data (auto-created on signup).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  age INTEGER,
  occupation TEXT,
  location TEXT,
  interests TEXT[],
  about_me TEXT,
  goals TEXT[],
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - References auth.users.id (UUID)
- `email` - User's email (synced from auth)
- `display_name` - Optional display name
- `age` - Optional age
- `occupation` - Job/role
- `location` - City/country
- `interests` - Array of interests
- `about_me` - Freeform bio
- `goals` - Array of goals
- `preferences` - JSON object for app settings
- `created_at` - Auto-generated timestamp
- `updated_at` - Auto-updated timestamp

**Indexes:**
```sql
CREATE INDEX idx_profiles_email ON profiles(email);
```

**RLS Policies:**
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### `chats`

Conversation threads.

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  persona_id TEXT DEFAULT 'default',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique chat identifier
- `user_id` - Owner (profile FK)
- `title` - Chat title (auto-generated or manual)
- `persona_id` - Active persona ID
- `folder_id` - Optional folder (FK to folders)
- `is_pinned` - Pin to top of list
- `is_archived` - Hide from main view
- `created_at` - Creation timestamp
- `updated_at` - Last message timestamp

**Indexes:**
```sql
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_folder_id ON chats(folder_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);
```

**RLS Policies:**
```sql
-- Users can view own chats
CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own chats
CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own chats
CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own chats
CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  USING (auth.uid() = user_id);
```

---

### `messages`

Individual messages within chats.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique message ID
- `chat_id` - Parent chat (FK)
- `role` - Message role (user/assistant/system)
- `content` - Message text
- `metadata` - JSON object:
  ```json
  {
    "model": "x-ai/grok-4-fast",
    "tokens": {
      "prompt": 150,
      "completion": 300,
      "total": 450
    },
    "cost": 0.0000135,
    "duration_ms": 1234,
    "search_results": [...],
    "timestamp": 1705350000000
  }
  ```
- `created_at` - Message timestamp

**Indexes:**
```sql
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**RLS Policies:**
```sql
-- Users can view messages in their chats
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Users can insert messages in their chats
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Users can delete messages in their chats
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

---

### `folders`

Organizational folders for chats.

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique folder ID
- `user_id` - Owner (profile FK)
- `name` - Folder name
- `parent_id` - Parent folder (for nesting, FK to self)
- `color` - Optional color (Tailwind class)
- `created_at` - Creation timestamp

**Indexes:**
```sql
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

**RLS Policies:**
```sql
-- Users can view own folders
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own folders
CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own folders
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own folders
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);
```

---

### `comparison_sessions`

Model comparison sessions (future feature).

```sql
CREATE TABLE comparison_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  models TEXT[] NOT NULL,
  responses JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Session ID
- `user_id` - Owner
- `title` - Session title
- `prompt` - User's input prompt
- `models` - Array of model IDs
- `responses` - JSON array of model responses
- `timestamp` - Creation time

**RLS:** Same pattern as chats/folders

---

## Functions

### Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Migrations

**Location:** `/scripts/*.sql`

**Naming:** `XXX_description.sql` (e.g., `001_initial_schema.sql`)

**Running migrations:**
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard:
# SQL Editor → Run each migration in order
```

**Migration history:**
- `001_initial_schema.sql` - Base tables
- `002_add_rls_policies.sql` - Security policies
- `003_add_indexes.sql` - Performance indexes
- `004_add_triggers.sql` - Auto-timestamps
- ...
- `023_latest.sql` - Most recent schema change

---

## Querying Examples

### Get user's chats

```sql
SELECT * FROM chats
WHERE user_id = auth.uid()
  AND is_archived = FALSE
ORDER BY updated_at DESC
LIMIT 50;
```

### Get messages in chat

```sql
SELECT * FROM messages
WHERE chat_id = '...'
ORDER BY created_at ASC;
```

### Get folder hierarchy

```sql
WITH RECURSIVE folder_tree AS (
  -- Base: root folders
  SELECT id, name, parent_id, 0 AS depth
  FROM folders
  WHERE user_id = auth.uid()
    AND parent_id IS NULL

  UNION ALL

  -- Recursive: child folders
  SELECT f.id, f.name, f.parent_id, ft.depth + 1
  FROM folders f
  JOIN folder_tree ft ON f.parent_id = ft.id
  WHERE f.user_id = auth.uid()
)
SELECT * FROM folder_tree
ORDER BY depth, name;
```

### Cost analytics (last 30 days)

```sql
SELECT
  (metadata->>'model') AS model,
  COUNT(*) AS message_count,
  SUM((metadata->'tokens'->>'total')::INTEGER) AS total_tokens,
  SUM((metadata->>'cost')::NUMERIC) AS total_cost
FROM messages
WHERE chat_id IN (
  SELECT id FROM chats WHERE user_id = auth.uid()
)
  AND created_at >= NOW() - INTERVAL '30 days'
  AND role = 'assistant'
  AND metadata->>'cost' IS NOT NULL
GROUP BY model
ORDER BY total_cost DESC;
```

---

## Backup & Recovery

**Automated backups:**
- Supabase: Daily backups (retained 7 days)
- Pro plan: Point-in-time recovery

**Manual backup:**
```bash
# Using Supabase CLI
supabase db dump > backup.sql

# Restore
supabase db reset --db-url postgresql://...
psql -f backup.sql
```

---

## Performance Tuning

**Current optimizations:**
- Foreign key indexes on all FK columns
- Timestamp indexes (DESC) for sorting
- JSONB GIN indexes (future) for metadata search
- Partial indexes for common filters:
  ```sql
  CREATE INDEX idx_chats_active
    ON chats(user_id, updated_at DESC)
    WHERE is_archived = FALSE;
  ```

**Query performance:**
- Load chats: ~5ms (with index)
- Load messages: ~10ms (1000 messages)
- Folder tree: ~20ms (recursive CTE)
- Cost analytics: ~50ms (30 days, 10k messages)

---

**Need to modify schema?** Create a new migration in `/scripts` and run it!
