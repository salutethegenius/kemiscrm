-- Compliance & Audit Logging Schema
-- Run this in your Supabase SQL Editor

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT
);

-- =====================================================
-- DATA EXPORT REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- DATA DELETION REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  reason TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- CONSENT RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  version TEXT,
  granted BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users manage own export requests" ON data_export_requests;
DROP POLICY IF EXISTS "Users manage own deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "Users manage own consent" ON consent_records;

-- Audit logs - users can see their own, admins see all in org
CREATE POLICY "Users view own audit logs" ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id = get_user_organization_id() AND get_user_role() IN ('admin', 'owner'))
  );

-- Data export requests - users can see their own
CREATE POLICY "Users manage own export requests" ON data_export_requests
  FOR ALL USING (user_id = auth.uid());

-- Data deletion requests - users can see their own, admins can manage
-- Fixed: Get organization_id from user_profiles since this table doesn't have organization_id column
CREATE POLICY "Users manage own deletion requests" ON data_deletion_requests
  FOR ALL USING (
    user_id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles up1
        WHERE up1.id = data_deletion_requests.user_id
        AND up1.organization_id = get_user_organization_id()
      )
      AND get_user_role() IN ('admin', 'owner')
    )
  );

-- Consent records - users can see their own
CREATE POLICY "Users manage own consent" ON consent_records
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON data_deletion_requests(user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT auth.uid() INTO v_user_id;
  SELECT organization_id INTO v_org_id FROM user_profiles WHERE id = v_user_id;
  
  INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details)
  VALUES (v_user_id, v_org_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_export JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user', (SELECT row_to_json(u.*) FROM user_profiles u WHERE u.id = p_user_id),
    'contacts', (SELECT jsonb_agg(row_to_json(c.*)) FROM contacts c WHERE c.user_id = p_user_id OR c.organization_id = (SELECT organization_id FROM user_profiles WHERE id = p_user_id)),
    'invoices', (SELECT jsonb_agg(row_to_json(i.*)) FROM invoices i WHERE i.user_id = p_user_id OR i.organization_id = (SELECT organization_id FROM user_profiles WHERE id = p_user_id)),
    'deals', (SELECT jsonb_agg(row_to_json(d.*)) FROM deals d WHERE d.user_id = p_user_id OR d.organization_id = (SELECT organization_id FROM user_profiles WHERE id = p_user_id)),
    'activities', (SELECT jsonb_agg(row_to_json(a.*)) FROM activities a WHERE a.user_id = p_user_id),
    'exported_at', NOW()
  ) INTO v_export;
  
  RETURN v_export;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
