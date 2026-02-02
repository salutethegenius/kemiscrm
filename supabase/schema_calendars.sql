-- Schema: Google Calendar integration (account + personal)
-- Run this in your Supabase SQL Editor after schema_v3_shared.sql

-- =====================================================
-- USER CALENDARS (personal Google Calendar embeds)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_calendars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Calendar',
  embed_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own calendars" ON user_calendars;
CREATE POLICY "Users manage own calendars" ON user_calendars
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);

-- =====================================================
-- ALLOW ADMINS TO UPDATE ORG SETTINGS (account calendar)
-- =====================================================

DROP POLICY IF EXISTS "Admins can update org" ON organizations;
CREATE POLICY "Admins can update org" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'owner')
  );
