-- Pipelines: multiple named pipelines (e.g. Sales, Recruitment)
-- Run after schema_v3_shared.sql

-- =====================================================
-- PIPELINES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- =====================================================
-- LINK STAGES TO PIPELINES
-- =====================================================

ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_organization_id ON pipelines(organization_id);

-- =====================================================
-- DEFAULT PIPELINE + MIGRATE EXISTING STAGES
-- =====================================================

-- Ensure one default pipeline per org and assign existing stages to it
DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001';
  v_default_pipeline_id UUID;
  v_stage RECORD;
BEGIN
  -- Create default "Sales" pipeline if none exists for default org
  INSERT INTO pipelines (name, position, user_id, organization_id)
  SELECT 'Sales', 0, (SELECT id FROM auth.users LIMIT 1), v_org_id
  WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE organization_id = v_org_id LIMIT 1);

  SELECT id INTO v_default_pipeline_id FROM pipelines WHERE organization_id = v_org_id ORDER BY position, created_at LIMIT 1;

  IF v_default_pipeline_id IS NOT NULL THEN
    UPDATE pipeline_stages SET pipeline_id = v_default_pipeline_id WHERE pipeline_id IS NULL;
  END IF;
END $$;

-- For any other org that has stages but no pipeline, create a Sales pipeline and assign
DO $$
DECLARE
  v_rec RECORD;
  v_pipeline_id UUID;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT organization_id FROM pipeline_stages WHERE pipeline_id IS NULL AND organization_id IS NOT NULL
  LOOP
    INSERT INTO pipelines (name, position, organization_id)
    VALUES ('Sales', 0, v_rec.organization_id)
    RETURNING id INTO v_pipeline_id;
    UPDATE pipeline_stages SET pipeline_id = v_pipeline_id WHERE organization_id = v_rec.organization_id AND pipeline_id IS NULL;
  END LOOP;
END $$;

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pipelines access" ON pipelines;
CREATE POLICY "Pipelines access" ON pipelines
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );
