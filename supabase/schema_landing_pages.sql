-- Landing Pages Schema
-- Run this in your Supabase SQL Editor

-- =====================================================
-- LANDING PAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  form_id UUID REFERENCES lead_forms(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  header_text TEXT,
  header_subtext TEXT,
  footer_text TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  background_color TEXT DEFAULT '#FFFFFF',
  custom_css TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Org members access landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can view published landing pages" ON landing_pages;

-- Organization members can manage landing pages
CREATE POLICY "Org members access landing pages" ON landing_pages
  FOR ALL USING (
    organization_id = get_user_organization_id() OR
    user_id = auth.uid()
  );

-- Public can view published landing pages (for the public route)
CREATE POLICY "Public can view published landing pages" ON landing_pages
  FOR SELECT USING (published = true);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_org_id ON landing_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published ON landing_pages(published);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_landing_page_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_count INTEGER;
BEGIN
  -- Convert title to slug
  v_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  
  -- Check if slug exists
  SELECT COUNT(*) INTO v_count FROM landing_pages WHERE slug = v_slug;
  
  -- If exists, append number
  IF v_count > 0 THEN
    v_slug := v_slug || '-' || (v_count + 1);
  END IF;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_updated_at();
