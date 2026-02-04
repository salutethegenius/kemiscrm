-- Audit logging for compliance and accountability
-- Run after schema_v3_shared.sql

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'export', 'view'
  entity_type TEXT NOT NULL, -- 'contact', 'invoice', 'deal', 'expense', 'client', 'employee', 'user', etc.
  entity_id UUID,
  entity_name TEXT, -- Human-readable name for the entity
  changes JSONB, -- For updates: { field: { old: value, new: value } }
  metadata JSONB, -- Additional context (IP, browser, etc.)
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view audit logs
DROP POLICY IF EXISTS "Audit logs admin access" ON audit_logs;
CREATE POLICY "Audit logs admin access" ON audit_logs
  FOR SELECT USING (
    organization_id = (SELECT get_user_organization_id())
    AND (SELECT get_user_role()) IN ('admin', 'owner')
  );

-- Allow inserts from authenticated users (for logging their own actions)
DROP POLICY IF EXISTS "Audit logs insert" ON audit_logs;
CREATE POLICY "Audit logs insert" ON audit_logs
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- =====================================================
-- HELPER FUNCTION: Log an audit event
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user details
  SELECT 
    up.organization_id,
    u.email,
    up.full_name
  INTO v_org_id, v_user_email, v_user_name
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = v_user_id;

  INSERT INTO audit_logs (
    organization_id,
    user_id,
    user_email,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    metadata
  ) VALUES (
    v_org_id,
    v_user_id,
    v_user_email,
    v_user_name,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action TEXT;
  v_entity_name TEXT;
  v_changes JSONB;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    -- Calculate changes (only changed fields)
    SELECT jsonb_object_agg(key, jsonb_build_object('old', v_old_data->key, 'new', value))
    INTO v_changes
    FROM jsonb_each(v_new_data)
    WHERE v_old_data->key IS DISTINCT FROM value
      AND key NOT IN ('updated_at', 'created_at'); -- Ignore timestamp fields
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Try to get entity name from common name fields
  v_entity_name := COALESCE(
    v_new_data->>'name',
    v_new_data->>'company_name',
    v_new_data->>'title',
    v_new_data->>'description',
    v_new_data->>'invoice_number',
    v_new_data->>'email',
    v_old_data->>'name',
    v_old_data->>'company_name',
    v_old_data->>'title',
    v_old_data->>'description',
    v_old_data->>'invoice_number',
    v_old_data->>'email'
  );

  -- Log the event
  PERFORM log_audit_event(
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    v_changes,
    CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Apply triggers to important tables
-- Contacts
DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Clients
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Invoices
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Deals
DROP TRIGGER IF EXISTS audit_deals ON deals;
CREATE TRIGGER audit_deals
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Expenses
DROP TRIGGER IF EXISTS audit_expenses ON expenses;
CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Income
DROP TRIGGER IF EXISTS audit_income ON income;
CREATE TRIGGER audit_income
  AFTER INSERT OR UPDATE OR DELETE ON income
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Payments
DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Employees
DROP TRIGGER IF EXISTS audit_employees ON employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- User profiles (for permission changes)
DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
