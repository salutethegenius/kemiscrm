-- Payroll schema for KRM Payroll Core (Bahamas-focused)
-- Run this after schema_v3_shared.sql and schema_audit_logs.sql
-- so that organizations, RLS helpers, and audit_trigger_func() exist.

-- =====================================================
-- EXTEND EMPLOYEES WITH PAYROLL FIELDS
-- =====================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS nib_number VARCHAR(25),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'salaried'
    CHECK (pay_type IN ('salaried', 'hourly')),
  ADD COLUMN IF NOT EXISTS base_salary_monthly DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS pay_frequency TEXT DEFAULT 'monthly'
    CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS nib_exempt BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employment_start_date DATE,
  ADD COLUMN IF NOT EXISTS employment_end_date DATE;

-- Note: existing salary column remains for backwards compatibility.

-- =====================================================
-- NIB RATE VERSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS nib_rate_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  employee_rate_percent DECIMAL(5, 4) NOT NULL,
  employer_rate_percent DECIMAL(5, 4) NOT NULL,
  insurable_ceiling DECIMAL(12, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE nib_rate_versions ENABLE ROW LEVEL SECURITY;

-- Org members can access their own NIB rate versions
DROP POLICY IF EXISTS "Org members access nib_rate_versions" ON nib_rate_versions;
CREATE POLICY "Org members access nib_rate_versions" ON nib_rate_versions
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Seed an initial NIB rate version (values may be adjusted in the UI or via SQL)
INSERT INTO nib_rate_versions (
  employee_rate_percent,
  employer_rate_percent,
  insurable_ceiling,
  effective_from,
  effective_to,
  organization_id
)
VALUES (
  0.0465,  -- employee 4.65%
  0.0665,  -- employer 6.65%
  3077.00, -- example monthly insurable ceiling (BSD)
  CURRENT_DATE,
  NULL,
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_nib_rate_effective
  ON nib_rate_versions (effective_from, effective_to);

-- =====================================================
-- PAYROLL RUNS
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID DEFAULT get_user_organization_id()
    REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

-- Org members can read their organization's payroll runs
DROP POLICY IF EXISTS "Org members select payroll_runs" ON payroll_runs;
CREATE POLICY "Org members select payroll_runs" ON payroll_runs
  FOR SELECT USING (organization_id = get_user_organization_id());

-- Org members can insert payroll runs for their organization
DROP POLICY IF EXISTS "Org members insert payroll_runs" ON payroll_runs;
CREATE POLICY "Org members insert payroll_runs" ON payroll_runs
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

-- Only admins/owners/managers can update payroll runs (e.g. approvals, posting)
DROP POLICY IF EXISTS "Admins manage payroll_runs" ON payroll_runs;
CREATE POLICY "Admins manage payroll_runs" ON payroll_runs
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'owner', 'manager')
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'owner', 'manager')
  );

-- Allow deletes of draft runs by admins/owners/managers
DROP POLICY IF EXISTS "Admins delete payroll_runs" ON payroll_runs;
CREATE POLICY "Admins delete payroll_runs" ON payroll_runs
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'owner', 'manager')
  );

CREATE INDEX IF NOT EXISTS idx_payroll_runs_org_status
  ON payroll_runs (organization_id, status);

-- =====================================================
-- PAYROLL LINES
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_lines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  gross DECIMAL(12, 2) NOT NULL,
  employee_nib DECIMAL(12, 2) NOT NULL,
  employer_nib DECIMAL(12, 2) NOT NULL,
  other_deductions DECIMAL(12, 2) DEFAULT 0,
  net_pay DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  organization_id UUID DEFAULT get_user_organization_id()
    REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members access payroll_lines" ON payroll_lines;
CREATE POLICY "Org members access payroll_lines" ON payroll_lines
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE INDEX IF NOT EXISTS idx_payroll_lines_run_employee
  ON payroll_lines (payroll_run_id, employee_id);

-- =====================================================
-- PAYROLL DOCUMENTS (e.g. payslips)
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g. 'payslip'
  file_path TEXT NOT NULL,
  organization_id UUID DEFAULT get_user_organization_id()
    REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members access payroll_documents" ON payroll_documents;
CREATE POLICY "Org members access payroll_documents" ON payroll_documents
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- AUDIT LOGGING
-- =====================================================

-- Attach generic audit trigger (defined in schema_audit_logs.sql)

DROP TRIGGER IF EXISTS audit_payroll_runs ON payroll_runs;
CREATE TRIGGER audit_payroll_runs
  AFTER INSERT OR UPDATE OR DELETE ON payroll_runs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_payroll_lines ON payroll_lines;
CREATE TRIGGER audit_payroll_lines
  AFTER INSERT OR UPDATE OR DELETE ON payroll_lines
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_nib_rate_versions ON nib_rate_versions;
CREATE TRIGGER audit_nib_rate_versions
  AFTER INSERT OR UPDATE OR DELETE ON nib_rate_versions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

