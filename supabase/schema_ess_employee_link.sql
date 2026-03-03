-- ESS: Link user_profiles to employees for sub-account / employee portal access
-- Run this after schema_v3_shared.sql (organizations, user_profiles, employees exist)

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
