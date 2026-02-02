  -- Schema: Task assignment and Tasks page support
  -- Run this in your Supabase SQL Editor

  -- Add assigned_to to activities (task assignee)
  ALTER TABLE activities ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON activities(assigned_to);

  -- Update RLS: users can view activities they created OR are assigned to
  DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
  CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);

  -- Allow assignee to update (e.g. mark complete)
  DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
  CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

  -- Add tasks permission for default organization roles (requires schema_v3_shared.sql / role_permissions table)
  INSERT INTO role_permissions (organization_id, role, permission, enabled) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'owner', 'tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'manager', 'tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'accountant', 'tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'user', 'tasks', true)
  ON CONFLICT (organization_id, role, permission) DO UPDATE SET enabled = EXCLUDED.enabled;
