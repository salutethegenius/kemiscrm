-- Email Mailbox Integration Schema
-- Run this in your Supabase SQL Editor AFTER core schemas (schema.sql, schema_v2.sql, schema_v3_shared.sql, schema_messaging.sql)
-- This adds per-user mailbox accounts, messages, threads, attachments, and sync run tracking.

-- =====================================================
-- MAILBOX ACCOUNTS (per-user connected mailboxes)
-- =====================================================

CREATE TABLE IF NOT EXISTS mailbox_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic identity
  email_address TEXT NOT NULL,
  display_name TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'imap_smtp')),

  -- For Gmail OAuth
  provider_account_id TEXT, -- e.g. Google account id
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- For generic IMAP/SMTP
  imap_host TEXT,
  imap_port INTEGER,
  imap_tls BOOLEAN,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure BOOLEAN,
  username_enc TEXT,
  password_enc TEXT,

  -- Sync metadata
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_error TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_history_synced_at TIMESTAMP WITH TIME ZONE,
  history_backfill_days INTEGER DEFAULT 30
);

CREATE INDEX IF NOT EXISTS idx_mailbox_accounts_user_id ON mailbox_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mailbox_accounts_email ON mailbox_accounts(email_address);

-- =====================================================
-- EMAIL THREADS (conversation grouping per mailbox)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  mailbox_account_id UUID NOT NULL REFERENCES mailbox_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_snippet TEXT,
  last_from TEXT,
  last_to TEXT,

  folder TEXT DEFAULT 'inbox',
  is_archived BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  unread_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_threads_user_mailbox ON email_threads(user_id, mailbox_account_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(user_id, last_message_at DESC);

-- =====================================================
-- MAILBOX MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS mailbox_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  mailbox_account_id UUID NOT NULL REFERENCES mailbox_accounts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing', 'draft')),

  -- Provider identifiers for idempotency
  provider_message_id TEXT,
  provider_thread_id TEXT,

  -- Addresses
  from_address TEXT,
  to_addresses TEXT,
  cc_addresses TEXT,
  bcc_addresses TEXT,

  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,

  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,

  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mailbox_messages_provider_id
  ON mailbox_messages(mailbox_account_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_user_mailbox_received
  ON mailbox_messages(user_id, mailbox_account_id, received_at DESC);

-- =====================================================
-- EMAIL ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  message_id UUID NOT NULL REFERENCES mailbox_messages(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,

  -- Pointer to Supabase storage or external URL
  storage_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_attachments_message_id ON email_attachments(message_id);

-- =====================================================
-- MAILBOX SYNC RUNS (observability for imports)
-- =====================================================

CREATE TABLE IF NOT EXISTS mailbox_sync_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  mailbox_account_id UUID NOT NULL REFERENCES mailbox_accounts(id) ON DELETE CASCADE,

  sync_type TEXT NOT NULL CHECK (sync_type IN ('initial', 'incremental')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  error_message TEXT,

  from_ts TIMESTAMP WITH TIME ZONE,
  to_ts TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_mailbox_sync_runs_mailbox ON mailbox_sync_runs(mailbox_account_id, created_at DESC);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Reuse update_updated_at() from schema.sql

DROP TRIGGER IF EXISTS mailbox_accounts_updated_at ON mailbox_accounts;
CREATE TRIGGER mailbox_accounts_updated_at
  BEFORE UPDATE ON mailbox_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS email_threads_updated_at ON email_threads;
CREATE TRIGGER email_threads_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS mailbox_messages_updated_at ON mailbox_messages;
CREATE TRIGGER mailbox_messages_updated_at
  BEFORE UPDATE ON mailbox_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE mailbox_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailbox_sync_runs ENABLE ROW LEVEL SECURITY;

-- Mailbox accounts: owner-only (use (select auth.uid()) for initplan / single eval per query)
DROP POLICY IF EXISTS "Mailbox accounts owner access" ON mailbox_accounts;
CREATE POLICY "Mailbox accounts owner access" ON mailbox_accounts
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Threads: owner-only
DROP POLICY IF EXISTS "Email threads owner access" ON email_threads;
CREATE POLICY "Email threads owner access" ON email_threads
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Messages: owner-only
DROP POLICY IF EXISTS "Mailbox messages owner access" ON mailbox_messages;
CREATE POLICY "Mailbox messages owner access" ON mailbox_messages
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Attachments: owner-only via message
DROP POLICY IF EXISTS "Email attachments owner access" ON email_attachments;
CREATE POLICY "Email attachments owner access" ON email_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mailbox_messages m
      WHERE m.id = email_attachments.message_id
      AND m.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mailbox_messages m
      WHERE m.id = email_attachments.message_id
      AND m.user_id = (select auth.uid())
    )
  );

-- Sync runs: owner-only via mailbox
DROP POLICY IF EXISTS "Mailbox sync runs owner access" ON mailbox_sync_runs;
CREATE POLICY "Mailbox sync runs owner access" ON mailbox_sync_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mailbox_accounts a
      WHERE a.id = mailbox_sync_runs.mailbox_account_id
      AND a.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mailbox_accounts a
      WHERE a.id = mailbox_sync_runs.mailbox_account_id
      AND a.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- ROLE PERMISSIONS SEED: email
-- =====================================================

-- Add `email` permission for all default roles in the default organization,
-- mirroring the approach in schema_messaging.sql.

INSERT INTO role_permissions (organization_id, role, permission, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'email', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'email', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'email', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'email', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'email', true)
ON CONFLICT (organization_id, role, permission) DO UPDATE SET enabled = EXCLUDED.enabled;

