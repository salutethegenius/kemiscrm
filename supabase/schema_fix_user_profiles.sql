-- Schema Fix: User Profiles & Role Management
-- Run this in your Supabase SQL Editor to fix user management
-- Created: 2026-01-30

-- =====================================================
-- FIX 1: CREATE MISSING TRIGGER FOR AUTO-PROFILE CREATION
-- =====================================================

-- First, ensure the function exists with proper organization assignment
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, organization_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user',
    '00000000-0000-0000-0000-000000000001'  -- Default organization
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that auto-creates profiles on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FIX 2: CREATE PROFILES FOR EXISTING USERS
-- =====================================================

-- Create profiles for any users who signed up before the trigger existed
INSERT INTO user_profiles (id, full_name, role, organization_id)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'user',
  '00000000-0000-0000-0000-000000000001'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
);

-- =====================================================
-- FIX 3: SET SPECIFIC USERS AS ADMINS
-- =====================================================

-- Make admin@baco.com and ken@kemisdigital.com admins
UPDATE user_profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@baco.com', 'ken@kemisdigital.com')
);

-- =====================================================
-- FIX 4: UPDATE RLS POLICIES FOR USER PROFILES
-- =====================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Auto create profile on signup" ON user_profiles;
DROP POLICY IF EXISTS "Org members can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON user_profiles;

-- Policy: Org members can see all profiles in their organization
CREATE POLICY "Org members can view profiles" ON user_profiles
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR id = auth.uid()  -- Always allow seeing own profile
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins/Owners can update any profile in their org (for role changes)
CREATE POLICY "Admins can update org profiles" ON user_profiles
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'owner')
  );

-- Policy: Allow profile creation (for signup trigger)
CREATE POLICY "Auto create profile on signup" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION QUERIES (run these to check results)
-- =====================================================

-- Uncomment and run these to verify the fix worked:

-- Check all user profiles:
-- SELECT up.id, u.email, up.full_name, up.role, up.organization_id, up.is_active
-- FROM user_profiles up
-- JOIN auth.users u ON u.id = up.id
-- ORDER BY up.created_at;

-- Check which users are admins:
-- SELECT u.email, up.role 
-- FROM user_profiles up 
-- JOIN auth.users u ON u.id = up.id 
-- WHERE up.role = 'admin';

-- Check if trigger exists:
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';
