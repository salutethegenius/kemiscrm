-- Schema V3: Organization-Based Data Sharing & Role Permissions
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ORGANIZATIONS (for multi-tenant shared data)
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Add organization_id to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- =====================================================
-- ROLE PERMISSIONS (granular access control)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'manager', 'accountant', 'user')),
  permission TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(organization_id, role, permission)
);

-- =====================================================
-- ADD organization_id TO ALL DATA TABLES
-- =====================================================

-- Contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Income
ALTER TABLE income ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Account Categories
ALTER TABLE account_categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Pipeline Stages
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Contact Groups
ALTER TABLE contact_groups ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Contact Tags
ALTER TABLE contact_tags ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Lead Forms
ALTER TABLE lead_forms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Time Entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Leave Requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- =====================================================
-- CREATE DEFAULT ORGANIZATION AND MIGRATE DATA
-- =====================================================

-- Create default organization
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
ON CONFLICT DO NOTHING;

-- Link all existing users to default organization
UPDATE user_profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Migrate all existing data to default organization
UPDATE contacts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE departments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE employees SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE expenses SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE income SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE account_categories SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE pipeline_stages SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE deals SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE contact_groups SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE contact_tags SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE lead_forms SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE time_entries SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE leave_requests SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE payments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- =====================================================
-- CREATE DEFAULT ROLE PERMISSIONS
-- =====================================================

-- Define all available permissions
INSERT INTO role_permissions (organization_id, role, permission, enabled) VALUES
  -- Admin - full access
  ('00000000-0000-0000-0000-000000000001', 'admin', 'dashboard', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'contacts', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'pipeline', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'forms', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'calendar', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'invoices', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'clients', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'payments', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'employees', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'time_tracking', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'departments', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'expenses', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'reports', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'user_management', true),
  ('00000000-0000-0000-0000-000000000001', 'admin', 'role_permissions', true),
  
  -- Owner - full access
  ('00000000-0000-0000-0000-000000000001', 'owner', 'dashboard', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'contacts', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'pipeline', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'forms', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'calendar', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'invoices', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'clients', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'payments', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'employees', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'time_tracking', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'departments', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'expenses', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'reports', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'user_management', true),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'role_permissions', true),
  
  -- Manager - team management
  ('00000000-0000-0000-0000-000000000001', 'manager', 'dashboard', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'contacts', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'pipeline', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'forms', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'calendar', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'invoices', false),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'clients', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'payments', false),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'employees', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'time_tracking', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'departments', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'expenses', false),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'income', false),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'reports', true),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'user_management', false),
  ('00000000-0000-0000-0000-000000000001', 'manager', 'role_permissions', false),
  
  -- Accountant - financial access
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'dashboard', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'contacts', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'pipeline', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'forms', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'calendar', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'invoices', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'clients', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'payments', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'employees', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'time_tracking', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'departments', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'expenses', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'reports', true),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'user_management', false),
  ('00000000-0000-0000-0000-000000000001', 'accountant', 'role_permissions', false),
  
  -- User - basic CRM access
  ('00000000-0000-0000-0000-000000000001', 'user', 'dashboard', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'contacts', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'pipeline', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'forms', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'calendar', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'invoices', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'clients', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'payments', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'employees', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'time_tracking', true),
  ('00000000-0000-0000-0000-000000000001', 'user', 'departments', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'expenses', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'income', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'reports', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'user_management', false),
  ('00000000-0000-0000-0000-000000000001', 'user', 'role_permissions', false)
ON CONFLICT (organization_id, role, permission) DO UPDATE SET enabled = EXCLUDED.enabled;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- UPDATE RLS POLICIES FOR ORGANIZATION-BASED ACCESS
-- =====================================================

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Drop old policies and create organization-based ones
DROP POLICY IF EXISTS "Users manage own contacts" ON contacts;
DROP POLICY IF EXISTS "Org members access contacts" ON contacts;
CREATE POLICY "Org members access contacts" ON contacts 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own clients" ON clients;
DROP POLICY IF EXISTS "Org members access clients" ON clients;
CREATE POLICY "Org members access clients" ON clients 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
DROP POLICY IF EXISTS "Org members access invoices" ON invoices;
CREATE POLICY "Org members access invoices" ON invoices 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own departments" ON departments;
DROP POLICY IF EXISTS "Org members access departments" ON departments;
CREATE POLICY "Org members access departments" ON departments 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own employees" ON employees;
DROP POLICY IF EXISTS "Org members access employees" ON employees;
CREATE POLICY "Org members access employees" ON employees 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Org members access expenses" ON expenses;
CREATE POLICY "Org members access expenses" ON expenses 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own income" ON income;
DROP POLICY IF EXISTS "Org members access income" ON income;
CREATE POLICY "Org members access income" ON income 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own categories" ON account_categories;
DROP POLICY IF EXISTS "Org members access categories" ON account_categories;
CREATE POLICY "Org members access categories" ON account_categories 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own time entries" ON time_entries;
DROP POLICY IF EXISTS "Org members access time_entries" ON time_entries;
CREATE POLICY "Org members access time_entries" ON time_entries 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Org members access leave_requests" ON leave_requests;
CREATE POLICY "Org members access leave_requests" ON leave_requests 
  FOR ALL USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users manage own payments" ON payments;
DROP POLICY IF EXISTS "Org members access payments" ON payments;
CREATE POLICY "Org members access payments" ON payments 
  FOR ALL USING (organization_id = get_user_organization_id());

-- Policies for tables that might not have old policies
DROP POLICY IF EXISTS "Org members access pipeline_stages" ON pipeline_stages;
CREATE POLICY "Org members access pipeline_stages" ON pipeline_stages 
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

DROP POLICY IF EXISTS "Org members access deals" ON deals;
CREATE POLICY "Org members access deals" ON deals 
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

DROP POLICY IF EXISTS "Org members access contact_groups" ON contact_groups;
CREATE POLICY "Org members access contact_groups" ON contact_groups 
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

DROP POLICY IF EXISTS "Org members access contact_tags" ON contact_tags;
CREATE POLICY "Org members access contact_tags" ON contact_tags 
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

DROP POLICY IF EXISTS "Org members access lead_forms" ON lead_forms;
CREATE POLICY "Org members access lead_forms" ON lead_forms 
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Organization access
DROP POLICY IF EXISTS "Users access own org" ON organizations;
CREATE POLICY "Users access own org" ON organizations 
  FOR SELECT USING (id = get_user_organization_id());

-- Role permissions access
DROP POLICY IF EXISTS "Org members view permissions" ON role_permissions;
CREATE POLICY "Org members view permissions" ON role_permissions 
  FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins manage permissions" ON role_permissions;
CREATE POLICY "Admins manage permissions" ON role_permissions 
  FOR ALL USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('admin', 'owner')
  );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_org ON role_permissions(organization_id, role);
