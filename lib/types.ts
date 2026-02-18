export type Contact = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  company: string | null
  source: string | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  notes: string | null
  user_id: string
  tags?: ContactTag[]
  groups?: ContactGroup[]
}

export type ContactGroup = {
  id: string
  created_at: string
  name: string
  description: string | null
  color: string
  user_id: string
  member_count?: number
}

export type ContactTag = {
  id: string
  created_at: string
  name: string
  color: string
  user_id: string
}

export type Pipeline = {
  id: string
  created_at: string
  name: string
  position: number
  user_id: string
  organization_id?: string | null
}

export type PipelineStage = {
  id: string
  created_at: string
  name: string
  position: number
  color: string
  user_id: string
  organization_id?: string | null
  pipeline_id?: string | null
}

export type Deal = {
  id: string
  created_at: string
  title: string
  value: number
  contact_id: string
  stage_id: string
  expected_close_date: string | null
  notes: string | null
  user_id: string
  contact?: Contact
  stage?: PipelineStage
}

export type Activity = {
  id: string
  created_at: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description: string | null
  contact_id: string | null
  deal_id: string | null
  due_date: string | null
  completed: boolean
  user_id: string
  assigned_to: string | null
}

// Internal messaging (1:1 per org)
export type Conversation = {
  id: string
  created_at: string
  updated_at: string
  participants?: { user_id: string; profile?: UserProfile }[]
  last_message?: Message | null
  unread_count?: number
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: UserProfile | null
}

export type LeadForm = {
  id: string
  created_at: string
  name: string
  fields: FormField[]
  user_id: string
}

export type FormField = {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
  required: boolean
  options?: string[]
}

export type FormSubmission = {
  id: string
  created_at: string
  form_id: string
  data: Record<string, string>
  contact_id: string | null
}

// User & Roles
export type UserRole = 'admin' | 'owner' | 'manager' | 'accountant' | 'user'

export type UserProfile = {
  id: string
  created_at: string
  updated_at: string
  full_name: string | null
  role: UserRole
  department: string | null
  avatar_url: string | null
  is_active: boolean
  organization_id: string | null
}

export type Organization = {
  id: string
  created_at: string
  name: string
  slug: string | null
  settings: Record<string, unknown>
  is_master?: boolean
  parent_org_id?: string | null
  max_users?: number
  max_storage_mb?: number
  billing_status?: 'active' | 'suspended' | 'cancelled'
  billing_plan?: 'free' | 'basic' | 'pro' | 'enterprise'
  enabled_features?: string[]
  branding?: {
    logo_url?: string
    accent_color?: string
    display_name?: string
  }
}

export type RolePermission = {
  id: string
  organization_id: string
  role: UserRole
  permission: string
  enabled: boolean
}

export const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', group: 'CRM' },
  { key: 'contacts', label: 'Contacts', group: 'CRM' },
  { key: 'pipeline', label: 'Pipeline', group: 'CRM' },
  { key: 'forms', label: 'Forms', group: 'CRM' },
  { key: 'calendar', label: 'Calendar', group: 'CRM' },
  { key: 'tasks', label: 'Tasks', group: 'CRM' },
   { key: 'email', label: 'Email', group: 'CRM' },
  { key: 'messages', label: 'Messages', group: 'CRM' },
  { key: 'invoices', label: 'Invoices', group: 'Invoicing' },
  { key: 'clients', label: 'Clients', group: 'Invoicing' },
  { key: 'payments', label: 'Payments', group: 'Invoicing' },
  { key: 'employees', label: 'Employees', group: 'HR' },
  { key: 'time_tracking', label: 'Time Tracking', group: 'HR' },
  { key: 'departments', label: 'Departments', group: 'HR' },
  { key: 'expenses', label: 'Expenses', group: 'Accounting' },
  { key: 'income', label: 'Income', group: 'Accounting' },
  { key: 'reports', label: 'Reports', group: 'Accounting' },
  { key: 'user_management', label: 'User Management', group: 'Admin' },
  { key: 'role_permissions', label: 'Role Permissions', group: 'Admin' },
] as const

export const FEATURE_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard', group: 'CRM' },
  { key: 'contacts', label: 'Contacts', group: 'CRM' },
  { key: 'pipeline', label: 'Pipeline', group: 'CRM' },
  { key: 'forms', label: 'Forms', group: 'CRM' },
  { key: 'landing_pages', label: 'Landing Pages', group: 'CRM' },
  { key: 'calendar', label: 'Calendar', group: 'CRM' },
  { key: 'tasks', label: 'Tasks', group: 'CRM' },
  { key: 'email', label: 'Email', group: 'CRM' },
  { key: 'invoices', label: 'Invoices', group: 'Invoicing' },
  { key: 'clients', label: 'Clients', group: 'Invoicing' },
  { key: 'payments', label: 'Payments', group: 'Invoicing' },
  { key: 'employees', label: 'Employees', group: 'HR' },
  { key: 'time_tracking', label: 'Time Tracking', group: 'HR' },
  { key: 'departments', label: 'Departments', group: 'HR' },
  { key: 'expenses', label: 'Expenses', group: 'Accounting' },
  { key: 'income', label: 'Income', group: 'Accounting' },
  { key: 'reports', label: 'Reports', group: 'Accounting' },
  { key: 'compliance', label: 'Compliance', group: 'Admin' },
] as const

export type PermissionKey = typeof PERMISSIONS[number]['key']

// Invoicing
export type Client = {
  id: string
  created_at: string
  contact_id: string | null
  company_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  tax_id: string | null
  poc_name: string | null
  poc_email: string | null
  poc_phone: string | null
  notes: string | null
  user_id: string
  contacts?: ClientContact[]
}

export type ClientContact = {
  id: string
  client_id: string
  contact_id: string
  role: string | null
  is_primary: boolean
  created_at: string
  contact?: Contact
}

export type Invoice = {
  id: string
  created_at: string
  updated_at: string
  invoice_number: string
  client_id: string | null
  contact_id: string | null
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  notes: string | null
  terms: string | null
  user_id: string
  client?: Client
  contact?: Contact
  items?: InvoiceItem[]
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

export type Payment = {
  id: string
  created_at: string
  invoice_id: string
  amount: number
  payment_method: string | null
  payment_date: string
  notes: string | null
  user_id: string
}

// HR
export type Department = {
  id: string
  created_at: string
  name: string
  description: string | null
  manager_id: string | null
  user_id: string
  employee_count?: number
  /** Populated when fetching departments with employees for card view */
  employees?: { id: string; first_name: string; last_name: string }[]
}

export type Employee = {
  id: string
  created_at: string
  updated_at: string
  user_account_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  position: string | null
  department_id: string | null
  hire_date: string | null
  salary: number | null
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern'
  status: 'active' | 'inactive' | 'terminated'
  address: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  notes: string | null
  user_id: string
  department?: Department
}

export type TimeEntry = {
  id: string
  created_at: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_minutes: number
  total_hours: number | null
  notes: string | null
  project: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  user_id: string
  employee?: Employee
}

export type LeaveRequest = {
  id: string
  created_at: string
  employee_id: string
  leave_type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other'
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  user_id: string
  employee?: Employee
}

// Accounting
export type AccountCategory = {
  id: string
  created_at: string
  name: string
  type: 'income' | 'expense'
  color: string
  user_id: string
}

export type Expense = {
  id: string
  created_at: string
  date: string
  category_id: string | null
  description: string
  amount: number
  vendor: string | null
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed'
  employee_id: string | null
  notes: string | null
  user_id: string
  category?: AccountCategory
}

export type Income = {
  id: string
  created_at: string
  date: string
  category_id: string | null
  description: string
  amount: number
  source: string | null
  notes: string | null
  user_id: string
  category?: AccountCategory
}

export type LandingPage = {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string | null
  slug: string
  form_id: string | null
  published: boolean
  published_at: string | null
  header_text: string | null
  header_subtext: string | null
  footer_text: string | null
  primary_color: string
  background_color: string
  custom_css: string | null
  user_id: string
  organization_id: string | null
}

export type UserCalendar = {
  id: string
  created_at: string
  user_id: string
  name: string
  embed_url: string
  sort_order: number
}

export type AuditLog = {
  id: string
  created_at: string
  organization_id: string | null
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'view'
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  changes: Record<string, { old: any; new: any }> | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
}
