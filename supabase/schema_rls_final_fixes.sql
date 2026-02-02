-- Final RLS fixes: auth_rls_initplan + multiple permissive policies
-- Run in Supabase SQL Editor after all other schema migrations
-- Fixes: (1) Wrap auth.uid()/get_user_* in (select ...) for performance
--        (2) Consolidate duplicate permissive policies per table/action

-- =====================================================
-- 1. CONTACTS – single policy with (select ...) + merge
-- =====================================================
DROP POLICY IF EXISTS "Org members access contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Contacts access" ON contacts
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 2. PIPELINE_STAGES
-- =====================================================
DROP POLICY IF EXISTS "Org members access pipeline_stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can view their own stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can create their own stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can update their own stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can delete their own stages" ON pipeline_stages;
CREATE POLICY "Pipeline stages access" ON pipeline_stages
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 3. DEALS
-- =====================================================
DROP POLICY IF EXISTS "Org members access deals" ON deals;
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
CREATE POLICY "Deals access" ON deals
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 4. ACTIVITIES – (select ...) + allow assignee
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
CREATE POLICY "Activities select" ON activities
  FOR SELECT USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = assigned_to);
CREATE POLICY "Activities insert" ON activities
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Activities update" ON activities
  FOR UPDATE USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = assigned_to);
CREATE POLICY "Activities delete" ON activities
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 5. LEAD_FORMS
-- =====================================================
DROP POLICY IF EXISTS "Org members access lead_forms" ON lead_forms;
DROP POLICY IF EXISTS "Users can view their own forms" ON lead_forms;
DROP POLICY IF EXISTS "Users can create their own forms" ON lead_forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON lead_forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON lead_forms;
CREATE POLICY "Lead forms access" ON lead_forms
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 6. FORM_SUBMISSIONS – (select ...) only
-- =====================================================
DROP POLICY IF EXISTS "Form owners can view submissions" ON form_submissions;
CREATE POLICY "Form owners can view submissions" ON form_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lead_forms lf
      WHERE lf.id = form_submissions.form_id AND lf.user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- 7. CONTACT_GROUPS
-- =====================================================
DROP POLICY IF EXISTS "Org members access contact_groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can view their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can create their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can manage their own groups" ON contact_groups;
CREATE POLICY "Contact groups access" ON contact_groups
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 8. CONTACT_TAGS
-- =====================================================
DROP POLICY IF EXISTS "Org members access contact_tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can view their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can manage their own tags" ON contact_tags;
CREATE POLICY "Contact tags access" ON contact_tags
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR organization_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 9. CONTACT_GROUP_MEMBERS – via group ownership
-- =====================================================
DROP POLICY IF EXISTS "Users can view group members" ON contact_group_members;
DROP POLICY IF EXISTS "Users can add group members" ON contact_group_members;
DROP POLICY IF EXISTS "Users can remove group members" ON contact_group_members;
DROP POLICY IF EXISTS "Users can manage group members" ON contact_group_members;
CREATE POLICY "Contact group members select" ON contact_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contact_groups cg
      WHERE cg.id = contact_group_members.group_id
        AND (cg.organization_id = (SELECT get_user_organization_id()) OR cg.organization_id IS NULL OR cg.user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Contact group members insert" ON contact_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups cg
      WHERE cg.id = contact_group_members.group_id
        AND (cg.organization_id = (SELECT get_user_organization_id()) OR cg.organization_id IS NULL OR cg.user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Contact group members delete" ON contact_group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contact_groups cg
      WHERE cg.id = contact_group_members.group_id
        AND (cg.organization_id = (SELECT get_user_organization_id()) OR cg.organization_id IS NULL OR cg.user_id = (SELECT auth.uid()))
    )
  );

-- =====================================================
-- 10. CONTACT_TAG_ASSIGNMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view tag assignments" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can add tag assignments" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can remove tag assignments" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can manage tag assignments" ON contact_tag_assignments;
CREATE POLICY "Contact tag assignments select" ON contact_tag_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contact_tags ct
      WHERE ct.id = contact_tag_assignments.tag_id
        AND (ct.organization_id = (SELECT get_user_organization_id()) OR ct.organization_id IS NULL OR ct.user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Contact tag assignments insert" ON contact_tag_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_tags ct
      WHERE ct.id = contact_tag_assignments.tag_id
        AND (ct.organization_id = (SELECT get_user_organization_id()) OR ct.organization_id IS NULL OR ct.user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Contact tag assignments delete" ON contact_tag_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contact_tags ct
      WHERE ct.id = contact_tag_assignments.tag_id
        AND (ct.organization_id = (SELECT get_user_organization_id()) OR ct.organization_id IS NULL OR ct.user_id = (SELECT auth.uid()))
    )
  );

-- =====================================================
-- 11. INVOICES
-- =====================================================
DROP POLICY IF EXISTS "Org members access invoices" ON invoices;
DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
CREATE POLICY "Invoices access" ON invoices
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 12. USER_CALENDARS – (select ...) only
-- =====================================================
DROP POLICY IF EXISTS "Users manage own calendars" ON user_calendars;
CREATE POLICY "Users manage own calendars" ON user_calendars
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 13. CLIENTS
-- =====================================================
DROP POLICY IF EXISTS "Org members access clients" ON clients;
DROP POLICY IF EXISTS "Users manage own clients" ON clients;
CREATE POLICY "Clients access" ON clients
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 14. INVOICE_ITEMS – (select ...) only
-- =====================================================
DROP POLICY IF EXISTS "Users manage own invoice items" ON invoice_items;
CREATE POLICY "Users manage own invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.user_id = (SELECT auth.uid()))
  );

-- =====================================================
-- 15. PAYMENTS
-- =====================================================
DROP POLICY IF EXISTS "Org members access payments" ON payments;
DROP POLICY IF EXISTS "Users manage own payments" ON payments;
CREATE POLICY "Payments access" ON payments
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 16. DEPARTMENTS
-- =====================================================
DROP POLICY IF EXISTS "Org members access departments" ON departments;
DROP POLICY IF EXISTS "Users manage own departments" ON departments;
CREATE POLICY "Departments access" ON departments
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 17. EMPLOYEES
-- =====================================================
DROP POLICY IF EXISTS "Org members access employees" ON employees;
DROP POLICY IF EXISTS "Users manage own employees" ON employees;
CREATE POLICY "Employees access" ON employees
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 18. TIME_ENTRIES
-- =====================================================
DROP POLICY IF EXISTS "Org members access time_entries" ON time_entries;
DROP POLICY IF EXISTS "Users manage own time entries" ON time_entries;
CREATE POLICY "Time entries access" ON time_entries
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 19. LEAVE_REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Org members access leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Users manage own leave requests" ON leave_requests;
CREATE POLICY "Leave requests access" ON leave_requests
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 20. ACCOUNT_CATEGORIES
-- =====================================================
DROP POLICY IF EXISTS "Org members access categories" ON account_categories;
DROP POLICY IF EXISTS "Users manage own categories" ON account_categories;
CREATE POLICY "Account categories access" ON account_categories
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 21. EXPENSES
-- =====================================================
DROP POLICY IF EXISTS "Org members access expenses" ON expenses;
DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
CREATE POLICY "Expenses access" ON expenses
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 22. INCOME
-- =====================================================
DROP POLICY IF EXISTS "Org members access income" ON income;
DROP POLICY IF EXISTS "Users manage own income" ON income;
CREATE POLICY "Income access" ON income
  FOR ALL USING (
    organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
  );

-- =====================================================
-- 23. USER_PROFILES – merge view + update policies
-- =====================================================
DROP POLICY IF EXISTS "Org members can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Auto create profile on signup" ON user_profiles;
CREATE POLICY "User profiles select" ON user_profiles
  FOR SELECT USING (
    organization_id = (SELECT get_user_organization_id()) OR id = (SELECT auth.uid())
  );
CREATE POLICY "User profiles update" ON user_profiles
  FOR UPDATE USING (
    id = (SELECT auth.uid())
    OR (organization_id = (SELECT get_user_organization_id()) AND (SELECT get_user_role()) IN ('admin', 'owner'))
  );
CREATE POLICY "User profiles insert" ON user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id OR (SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- 24. LANDING_PAGES – merge org + public read
-- =====================================================
DROP POLICY IF EXISTS "Org members access landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can view published landing pages" ON landing_pages;
CREATE POLICY "Landing pages select" ON landing_pages
  FOR SELECT USING (
    published = true
    OR organization_id = (SELECT get_user_organization_id())
    OR user_id = (SELECT auth.uid())
  );
CREATE POLICY "Landing pages insert" ON landing_pages FOR INSERT WITH CHECK (
  organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
);
CREATE POLICY "Landing pages update" ON landing_pages FOR UPDATE USING (
  organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
);
CREATE POLICY "Landing pages delete" ON landing_pages FOR DELETE USING (
  organization_id = (SELECT get_user_organization_id()) OR user_id = (SELECT auth.uid())
);

-- =====================================================
-- 25. AUDIT_LOGS – (select ...) only
-- =====================================================
DROP POLICY IF EXISTS "Users view own audit logs" ON audit_logs;
CREATE POLICY "Users view own audit logs" ON audit_logs
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR (organization_id = (SELECT get_user_organization_id()) AND (SELECT get_user_role()) IN ('admin', 'owner'))
  );

-- =====================================================
-- 26. DATA_EXPORT_REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Users manage own export requests" ON data_export_requests;
CREATE POLICY "Users manage own export requests" ON data_export_requests
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- 27. DATA_DELETION_REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Users manage own deletion requests" ON data_deletion_requests;
CREATE POLICY "Users manage own deletion requests" ON data_deletion_requests
  FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_profiles up1
        WHERE up1.id = data_deletion_requests.user_id
          AND up1.organization_id = (SELECT get_user_organization_id())
      )
      AND (SELECT get_user_role()) IN ('admin', 'owner')
    )
  );

-- =====================================================
-- 28. CONSENT_RECORDS
-- =====================================================
DROP POLICY IF EXISTS "Users manage own consent" ON consent_records;
CREATE POLICY "Users manage own consent" ON consent_records
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- 29. ROLE_PERMISSIONS – merge view + admin manage
-- =====================================================
DROP POLICY IF EXISTS "Org members view permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins manage permissions" ON role_permissions;
CREATE POLICY "Role permissions select" ON role_permissions
  FOR SELECT USING (organization_id = (SELECT get_user_organization_id()));
CREATE POLICY "Role permissions insert" ON role_permissions FOR INSERT WITH CHECK (
  organization_id = (SELECT get_user_organization_id()) AND (SELECT get_user_role()) IN ('admin', 'owner')
);
CREATE POLICY "Role permissions update" ON role_permissions FOR UPDATE USING (
  organization_id = (SELECT get_user_organization_id()) AND (SELECT get_user_role()) IN ('admin', 'owner')
);
CREATE POLICY "Role permissions delete" ON role_permissions FOR DELETE USING (
  organization_id = (SELECT get_user_organization_id()) AND (SELECT get_user_role()) IN ('admin', 'owner')
);

-- =====================================================
-- 30. ORGANIZATIONS (calendars) – (select ...) only
-- =====================================================
DROP POLICY IF EXISTS "Admins can update org" ON organizations;
DROP POLICY IF EXISTS "Users access own org" ON organizations;
CREATE POLICY "Users access own org" ON organizations
  FOR SELECT USING (id = (SELECT get_user_organization_id()));
CREATE POLICY "Admins can update org" ON organizations
  FOR UPDATE USING (
    id = (SELECT get_user_organization_id())
    AND (SELECT get_user_role()) IN ('admin', 'owner')
  );
