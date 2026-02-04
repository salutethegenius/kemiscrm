-- Enhanced time tracking with project/task labels
-- Run after schema_v2.sql

-- Add project/label field to time_entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS project TEXT;

-- Create index for project filtering
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
