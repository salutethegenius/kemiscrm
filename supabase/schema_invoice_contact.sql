-- Add contact_id to invoices table to allow billing contacts directly
-- Run after schema_v2.sql

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);
