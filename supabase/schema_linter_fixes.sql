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
