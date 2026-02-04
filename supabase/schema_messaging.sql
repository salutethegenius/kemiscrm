-- Internal two-way messaging between users in the same organization
-- Run after schema_v3_shared.sql (organizations, user_profiles with organization_id)

-- =====================================================
-- CONVERSATIONS (1:1 per pair of users)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION PARTICIPANTS (exactly 2 per 1:1 conv)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);

-- =====================================================
-- READ RECEIPTS (last time user read this conversation)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- =====================================================
-- TRIGGER: update conversations.updated_at on new message
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_updated_at();

-- =====================================================
-- RPC: Get or create 1:1 conversation (same org only)
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_id UUID := (SELECT auth.uid());
  v_my_org UUID;
  v_other_org UUID;
  v_conv_id UUID;
  v_user_id_1 UUID;
  v_user_id_2 UUID;
BEGIN
  IF v_my_id IS NULL OR p_other_user_id IS NULL OR v_my_id = p_other_user_id THEN
    RETURN NULL;
  END IF;

  SELECT organization_id INTO v_my_org FROM user_profiles WHERE id = v_my_id;
  SELECT organization_id INTO v_other_org FROM user_profiles WHERE id = p_other_user_id;

  IF v_my_org IS NULL OR v_other_org IS NULL OR v_my_org != v_other_org THEN
    RETURN NULL;
  END IF;

  v_user_id_1 := LEAST(v_my_id, p_other_user_id);
  v_user_id_2 := GREATEST(v_my_id, p_other_user_id);

  SELECT c.id INTO v_conv_id
  FROM conversations c
  JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = v_user_id_1
  JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = v_user_id_2
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (v_conv_id, v_my_id),
    (v_conv_id, p_other_user_id);
  RETURN v_conv_id;
END;
$$;

-- =====================================================
-- RLS: conversations
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations select" ON conversations;
CREATE POLICY "Conversations select" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- No direct INSERT/UPDATE/DELETE for clients; use get_or_create_conversation

-- =====================================================
-- RLS: conversation_participants
-- =====================================================

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants select" ON conversation_participants;
CREATE POLICY "Conversation participants select" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- No direct INSERT for clients; RPC creates participants

-- =====================================================
-- RLS: messages
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages select" ON messages;
CREATE POLICY "Messages select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Messages insert" ON messages;
CREATE POLICY "Messages insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- RLS: conversation_reads
-- =====================================================

ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation reads select" ON conversation_reads;
DROP POLICY IF EXISTS "Conversation reads all" ON conversation_reads;
DROP POLICY IF EXISTS "Conversation reads insert" ON conversation_reads;
DROP POLICY IF EXISTS "Conversation reads update" ON conversation_reads;

CREATE POLICY "Conversation reads select" ON conversation_reads
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Conversation reads insert" ON conversation_reads
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Conversation reads update" ON conversation_reads
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- ROLE PERMISSION: messages (for default org)
-- =====================================================

INSERT INTO role_permissions (organization_id, role, permission, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'messages', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'messages', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'messages', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'messages', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'messages', true)
ON CONFLICT (organization_id, role, permission) DO UPDATE SET enabled = EXCLUDED.enabled;
