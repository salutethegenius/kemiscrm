-- Schema Update: Add Tags and Groups
-- Run this in your Supabase SQL Editor

-- Contact Groups table
CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Contact Tags table
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Junction table for contacts and groups (many-to-many)
CREATE TABLE IF NOT EXISTS contact_group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, group_id)
);

-- Junction table for contacts and tags (many-to-many)
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

-- Enable RLS
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Contact Groups policies
CREATE POLICY "Users can view their own groups" ON contact_groups
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own groups" ON contact_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own groups" ON contact_groups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own groups" ON contact_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Contact Tags policies
CREATE POLICY "Users can view their own tags" ON contact_tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tags" ON contact_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON contact_tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON contact_tags
  FOR DELETE USING (auth.uid() = user_id);

-- Group members policies (users can manage members of their groups)
CREATE POLICY "Users can view group members" ON contact_group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM contact_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can add group members" ON contact_group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM contact_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can remove group members" ON contact_group_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM contact_groups WHERE id = group_id AND user_id = auth.uid())
  );

-- Tag assignments policies
CREATE POLICY "Users can view tag assignments" ON contact_tag_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM contact_tags WHERE id = tag_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can add tag assignments" ON contact_tag_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM contact_tags WHERE id = tag_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can remove tag assignments" ON contact_tag_assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM contact_tags WHERE id = tag_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact ON contact_group_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_group ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact ON contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag ON contact_tag_assignments(tag_id);
