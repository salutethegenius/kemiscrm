# KRM — Kemis Relationship Management

A full-featured relationship management platform built in the Bahamas for Bahamian businesses. KRM unifies CRM, invoicing, HR, accounting, email, compliance, and internal collaboration in a single, sovereign, multi-tenant SaaS application.

---

## Overview

KRM (Kemis Relationship Management) is an all-in-one business platform designed for Bahamian organizations. It provides:

- **Customer relationship management** — contacts, pipeline, deals, forms, calendar, tasks
- **Invoicing & payments** — clients, invoices, payment tracking
- **HR** — employees, departments, time tracking
- **Accounting** — expenses, income, reports
- **Email integration** — Gmail OAuth and IMAP/SMTP for sending and syncing
- **Internal messaging** — 1:1 conversations within an organization
- **Landing pages** — customizable public pages with embedded forms
- **Compliance** — Bahamas Data Protection Act and GDPR readiness (data export, deletion, audit logs, privacy policy)
- **Platform administration** — master org with sub-accounts, billing, and feature gating

The application supports **multi-tenancy** via organizations: each organization has its own data, users, and configurable permissions. A **master platform org** can manage client sub-accounts (limits, billing plans, enabled features, branding).

---

## Features in Detail

### CRM
| Feature | Description |
|--------|-------------|
| **Contacts** | Manage leads and customers with tags, groups, status, notes, import/export |
| **Pipeline** | Kanban-style deal board with stages, drag-and-drop, deal values |
| **Forms** | Custom lead forms with text, email, phone, textarea, select fields; public form URLs |
| **Landing Pages** | Publish marketing pages with forms, custom styling, slugs |
| **Calendar** | Embedded external calendar support |
| **Tasks** | Tasks linked to contacts/deals with due dates, assignment, completion |
| **Email** | Connect Gmail or IMAP/SMTP; send and sync email from the app |
| **Messages** | Internal 1:1 messaging between organization members |

### Invoicing
| Feature | Description |
|--------|-------------|
| **Clients** | Company records with contacts, addresses, tax ID, POC |
| **Invoices** | Create, send, track invoices; draft/sent/paid/overdue status |
| **Payments** | Record payments against invoices with method and date |

### HR
| Feature | Description |
|--------|-------------|
| **Employees** | Employee records with department, hire date, salary, employment type |
| **Departments** | Organizational structure with manager assignment |
| **Time Tracking** | Clock in/out, break minutes, approval workflow, project tagging |

### Accounting
| Feature | Description |
|--------|-------------|
| **Expenses** | Track expenses by category, vendor, status, employee |
| **Income** | Log income by category and source |
| **Reports** | Financial reporting and summaries |

### Admin & Compliance
| Feature | Description |
|--------|-------------|
| **User Management** | Invite users, assign roles (admin, owner, manager, accountant, user) |
| **Role Permissions** | Fine-grained permissions per role (e.g. dashboard, contacts, invoices) |
| **Compliance** | Data export, deletion requests, privacy policy, audit logs |
| **Platform (Master)** | Sub-accounts, billing plans, storage limits, feature toggles |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Styling** | Tailwind CSS, shadcn/ui (Radix) |
| **Forms** | React Hook Form, Zod |
| **Drag & Drop** | @dnd-kit (pipeline board) |
| **Email** | Nodemailer, Gmail API, IMAP/SMTP |
| **Deployment** | Railway (Nixpacks) |

---

## Architecture

- **Multi-tenancy**: Data scoped by `organization_id`; users belong to one org
- **Row Level Security (RLS)**: Supabase RLS enforces org isolation and role-based access
- **Master org**: One organization (`is_master=true`) can manage sub-accounts; admins use `/admin/login` to access `/master/accounts` and `/master/billing`
- **Feature gating**: Per-org `enabled_features` controls which modules each sub-account can use
- ** branding**: Per-org `branding` (logo, accent color, display name) for white-label potential

---

## Project Structure

```
├── app/
│   ├── (auth)/          # Login, signup (public)
│   ├── (dashboard)/      # Main app: dashboard, contacts, pipeline, etc.
│   ├── admin/           # Master admin login (separate portal)
│   ├── api/             # API routes (email send, Gmail/IMAP connect, sync)
│   ├── f/[formId]/      # Public form submission page
│   ├── lp/[slug]/       # Public landing pages
│   └── layout.tsx       # Root layout, fonts, favicon
├── components/          # React components
│   ├── logo/            # KRM logo (grid mark, full lockup)
│   ├── ui/              # shadcn/ui primitives
│   └── ...              # Feature-specific components
├── lib/
│   ├── supabase/        # Supabase client (browser/server)
│   ├── email/           # Gmail, IMAP, SMTP providers
│   ├── types.ts         # TypeScript types
│   └── utils.ts
├── supabase/            # SQL migrations
│   ├── schema.sql       # Core CRM
│   ├── schema_update.sql
│   ├── schema_v2.sql    # Invoicing, HR, Accounting
│   ├── schema_v3_shared.sql  # Organizations, sharing
│   ├── schema_master_accounts.sql
│   ├── schema_*.sql     # Email, compliance, landing pages, etc.
│   └── ...
└── public/
    ├── favicon.svg
    └── logo/            # Logo system reference
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/salutethegenius/kemiscrm.git
   cd kemiscrm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run database migrations** (in Supabase SQL Editor, in order)
   - `supabase/schema.sql` — Core CRM
   - `supabase/schema_update.sql` — Tags, groups
   - `supabase/schema_v2.sql` — Invoicing, HR, Accounting
   - `supabase/schema_v3_shared.sql` — Organizations, sharing
   - `supabase/schema_master_accounts.sql` — Master/sub-accounts
   - Other `schema_*.sql` as needed (email, compliance, landing pages, time tracking, etc.)

5. **Create demo account** (optional, for "Explore demo" on homepage)
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run seed:demo
   ```
   Demo credentials: `demo@krm.bs` / `Demo123!`

6. **Start the dev server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000). Click **Explore demo** to try the pre-filled demo account.

---

## Deployment (Railway)

1. Create a project on [Railway](https://railway.app)
2. Deploy from GitHub (repo: `salutethegenius/kemiscrm`)
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Railway uses `nixpacks.toml` for `npm ci --legacy-peer-deps` and build
5. Add a custom domain if desired

---

## User Roles

| Role | Typical Access |
|------|----------------|
| **Admin** | Full access to all features |
| **Owner** | Business owner, full access |
| **Manager** | Team management, reports |
| **Accountant** | Invoicing, payments, accounting |
| **User** | Basic CRM (contacts, pipeline, tasks) |

Permissions are configurable per role per organization via **Role Permissions**.

---

## Compliance

KRM is designed for **Bahamas Data Protection Act** and **GDPR** alignment:

- Data export (Right to Access)
- Data deletion requests (Right to Erasure)
- Privacy policy
- Audit logging (create, update, delete, login, export)

See [COMPLIANCE.md](./COMPLIANCE.md) for details.

---

## License

Private — All rights reserved.
