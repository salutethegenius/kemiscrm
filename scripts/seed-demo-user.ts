/**
 * Seed a demo account for exploring KRM.
 * Run: npm run seed:demo
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Demo credentials:
 *   Email: demo@krm.bs
 *   Password: Demo123!
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const DEMO_EMAIL = 'demo@krm.bs'
const DEMO_PASSWORD = 'Demo123!'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    const missing = []
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    console.error('Missing:', missing.join(', '))
    console.error('')
    console.error('SUPABASE_SERVICE_ROLE_KEY is different from NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    console.error('Get it from: Supabase Dashboard → Settings → API → service_role (secret)')
    console.error('Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJhbG...')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Demo User' },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('Demo user already exists. Credentials:')
      console.log(`  Email: ${DEMO_EMAIL}`)
      console.log(`  Password: ${DEMO_PASSWORD}`)
      return
    }
    console.error('Error creating demo user:', error.message)
    process.exit(1)
  }

  console.log('Demo account created successfully!')
  console.log(`  Email: ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
  console.log('\nUsers can explore at /login (click "Explore demo" on homepage)')
}

main()
