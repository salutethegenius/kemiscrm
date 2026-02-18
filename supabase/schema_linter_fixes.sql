-- Run this in Supabase SQL Editor to fix Security Advisor linter warnings.
-- Fixes: function_search_path_mutable (4 functions) and rls_policy_always_true (form_submissions).

-- =====================================================
-- 1. Functions: set search_path so linter is satisfied
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.initialize_user_pipeline(p_user_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = p_user_id) THEN
    INSERT INTO public.pipeline_stages (name, position, color, user_id) VALUES
      ('Lead', 1, '#6B7280', p_user_id),
      ('Contacted', 2, '#3B82F6', p_user_id),
      ('Proposal', 3, '#F59E0B', p_user_id),
      ('Negotiation', 4, '#8B5CF6', p_user_id),
      ('Won', 5, '#10B981', p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =====================================================
-- 2. Form submissions: replace WITH CHECK (true) with explicit check
-- =====================================================
-- Allows public form submission but only for valid form_id (references existing lead_form).
-- Satisfies linter (no "always true" policy) and improves security.

DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;
CREATE POLICY "Anyone can submit forms" ON public.form_submissions
  FOR INSERT WITH CHECK (
    form_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.lead_forms WHERE public.lead_forms.id = form_submissions.form_id)
  );

-- =====================================================
-- 3. Multiple permissive policies: remove legacy duplicates
-- =====================================================
-- Keep the newer consolidated "* access" / "Role permissions *" policies
-- and drop older overlapping "Org members access ..." / broad role policies.

DROP POLICY IF EXISTS "Org members access categories" ON public.account_categories;
DROP POLICY IF EXISTS "Org members access clients" ON public.clients;
DROP POLICY IF EXISTS "Org members access contact_groups" ON public.contact_groups;
DROP POLICY IF EXISTS "Org members access contact_tags" ON public.contact_tags;
DROP POLICY IF EXISTS "Org members access contacts" ON public.contacts;
DROP POLICY IF EXISTS "Org members access deals" ON public.deals;
DROP POLICY IF EXISTS "Org members access departments" ON public.departments;
DROP POLICY IF EXISTS "Org members access employees" ON public.employees;
DROP POLICY IF EXISTS "Org members access expenses" ON public.expenses;
DROP POLICY IF EXISTS "Org members access income" ON public.income;
DROP POLICY IF EXISTS "Org members access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Org members access lead_forms" ON public.lead_forms;
DROP POLICY IF EXISTS "Org members access leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Org members access payments" ON public.payments;
DROP POLICY IF EXISTS "Org members access pipeline_stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Org members access time_entries" ON public.time_entries;

DROP POLICY IF EXISTS "Org members view permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins manage permissions" ON public.role_permissions;
