-- Add Point of Contact and Notes fields to clients table
-- Run after schema_v2.sql

-- Point of Contact fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS poc_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS poc_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS poc_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create junction table for client contacts (employees/contacts associated with a client)
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT, -- e.g., 'Employee', 'Manager', 'Billing', etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_contact_id ON client_contacts(contact_id);

-- RLS for client_contacts
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client contacts access" ON client_contacts;
CREATE POLICY "Client contacts access" ON client_contacts
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );
