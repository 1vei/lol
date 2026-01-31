-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times - it will only add what's missing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  author_name TEXT,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  youtube_id TEXT,
  giphy_url TEXT
);

-- Add missing columns to chat_messages if they don't exist
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update existing rows to have a session_id if NULL
UPDATE chat_messages SET session_id = 'legacy_' || id::text WHERE session_id IS NULL;

-- Make session_id NOT NULL after updating (only if column exists and has data)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'chat_messages' AND column_name = 'session_id') THEN
    ALTER TABLE chat_messages ALTER COLUMN session_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ip_hash ON chat_messages(ip_hash);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);

-- IP bans table
CREATE TABLE IF NOT EXISTS ip_bans (
  ip_hash TEXT PRIMARY KEY,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Browser links table
CREATE TABLE IF NOT EXISTS browser_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  comment TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_browser_links_tags ON browser_links USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_browser_links_order ON browser_links(order_index);

-- Feed items table
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_order ON feed_items(order_index);

-- File manager table
CREATE TABLE IF NOT EXISTS file_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  parent_id UUID REFERENCES file_manager(id) ON DELETE CASCADE,
  file_url TEXT,
  icon_url TEXT,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add icon_url column if it doesn't exist
ALTER TABLE file_manager ADD COLUMN IF NOT EXISTS icon_url TEXT;

CREATE INDEX IF NOT EXISTS idx_file_manager_parent ON file_manager(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_manager_type ON file_manager(type);

-- Trigger to delete child items when folder is deleted
CREATE OR REPLACE FUNCTION delete_folder_contents()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM file_manager WHERE parent_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_folder_contents ON file_manager;
CREATE TRIGGER trigger_delete_folder_contents
BEFORE DELETE ON file_manager
FOR EACH ROW
WHEN (OLD.type = 'folder')
EXECUTE FUNCTION delete_folder_contents();

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default timezone (if not exists)
INSERT INTO settings (key, value) VALUES ('timezone', 'UTC') ON CONFLICT (key) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Public read browser_links" ON browser_links;
DROP POLICY IF EXISTS "Public read feed_items" ON feed_items;
DROP POLICY IF EXISTS "Public read file_manager" ON file_manager;
DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Public insert chat_messages" ON chat_messages;

-- Create policies
CREATE POLICY "Public read chat_messages" ON chat_messages FOR SELECT USING (is_private = false);
CREATE POLICY "Public read browser_links" ON browser_links FOR SELECT USING (true);
CREATE POLICY "Public read feed_items" ON feed_items FOR SELECT USING (true);
CREATE POLICY "Public read file_manager" ON file_manager FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
