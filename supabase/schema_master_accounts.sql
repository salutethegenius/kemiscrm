-- Master / Sub-account organization structure
-- Run after schema_v3_shared.sql

-- =====================================================
-- Extend organizations table for master/sub accounts
-- =====================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES organizations(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 1000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '["dashboard","contacts","pipeline","invoices","clients","payments"]';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id ON organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_master ON organizations(is_master);

-- =====================================================
-- RLS: allow master org users to see all organizations
-- =====================================================

-- Existing policy \"Users access own org\" (in schema_v3_shared.sql) still applies
-- for non-master organizations. Here we add an additional policy so that users
-- whose own organization is marked as is_master = true can see all org records.

DROP POLICY IF EXISTS \"Master org access all orgs\" ON organizations;
CREATE POLICY \"Master org access all orgs\" ON organizations
  FOR SELECT USING (
    (SELECT is_master FROM organizations WHERE id = get_user_organization_id()) IS TRUE
  );

-- =====================================================
-- Initial data: Kemis CRM as master, Drewber as sub-account
-- =====================================================

-- Make the default organization the Kemis CRM master account
UPDATE organizations 
SET 
  name = 'Kemis CRM',
  is_master = true,
  enabled_features = '["dashboard","contacts","pipeline","forms","landing_pages","calendar","invoices","clients","payments","employees","time_tracking","departments","expenses","income","reports","compliance"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create Drewber Solutions Ltd. as the first sub-account (client) under Kemis CRM
INSERT INTO organizations (
  id,
  name,
  slug,
  is_master,
  parent_org_id,
  max_users,
  max_storage_mb,
  billing_status,
  billing_plan,
  enabled_features,
  branding
)
VALUES (
  uuid_generate_v4(),
  'Drewber Solutions Ltd.',
  'drewber',
  false,
  '00000000-0000-0000-0000-000000000001', -- parent = Kemis CRM
  10,
  1000,
  'active',
  'pro',
  '["dashboard","contacts","pipeline","invoices","clients","payments","employees","time_tracking","expenses","income","reports"]'::jsonb,
  '{"display_name": "Drewber Solutions Ltd."}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

