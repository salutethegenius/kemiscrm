# Kemis CRM Dashboard

A comprehensive CRM system built with Next.js, Supabase, and Tailwind CSS.

## Features

- **CRM**: Contacts, Pipeline, Forms, Calendar
- **Invoicing**: Invoices, Clients, Payments
- **HR**: Employees, Departments, Time Tracking
- **Accounting**: Expenses, Income, Reports
- **Admin**: User Management, Role Permissions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/salutethegenius/kemiscrm.git
cd kemiscrm
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run database migrations:
   - Run `supabase/schema.sql` in Supabase SQL Editor
   - Run `supabase/schema_update.sql` for tags/groups
   - Run `supabase/schema_v2.sql` for invoicing/HR/accounting
   - Run `supabase/schema_v3_shared.sql` for organization-based sharing

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Railway Deployment

### Step 1: Connect Repository

1. Go to [Railway Dashboard](https://railway.app)
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Choose `salutethegenius/kemiscrm`

### Step 2: Configure Environment Variables

In Railway project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://cyikdafnybflqsbznxgq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace `your-anon-key-here` with your actual Supabase anon key from your Supabase dashboard.

### Step 3: Deploy

Railway will automatically:
- Detect Next.js
- Install dependencies (using `--legacy-peer-deps` via nixpacks.toml)
- Build the application
- Start the server

### Step 4: Get Your URL

Railway will provide a `.railway.app` domain. You can also add a custom domain in Railway settings.

## Database Setup

After deployment, run these SQL scripts in your Supabase SQL Editor (in order):

1. `supabase/schema.sql` - Core CRM tables
2. `supabase/schema_update.sql` - Tags and groups
3. `supabase/schema_v2.sql` - Invoicing, HR, Accounting
4. `supabase/schema_v3_shared.sql` - Organization-based sharing

## User Roles

- **Admin**: Full access to all features
- **Owner**: Business owner with full access
- **Manager**: Can manage team and view reports
- **Accountant**: Access to invoicing and accounting
- **User**: Basic CRM access

## Troubleshooting

### Railway Build Fails

If you see ESLint peer dependency errors:
- The `nixpacks.toml` file should handle this automatically
- Ensure `.npmrc` is committed to the repository
- Try redeploying in Railway

### Invalid Login Credentials

1. Verify environment variables are set correctly in Railway
2. Check that users exist in Supabase Auth
3. Ensure email confirmation is disabled (if desired) in Supabase Auth settings

### Database Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure Row Level Security policies are set up correctly

## License

Private - All rights reserved
