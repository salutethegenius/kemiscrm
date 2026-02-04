'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Check if this user belongs to the master organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      toast({
        title: 'Access restricted',
        description: 'This portal is for master admin accounts only.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      router.refresh()
      return
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('is_master')
      .eq('id', profile.organization_id)
      .single()

    if (!org?.is_master) {
      toast({
        title: 'Access restricted',
        description: 'This portal is for Kemis CRM master admins only. Redirecting to main app.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      router.refresh()
      return
    }

    toast({
      title: 'Welcome, master admin!',
      description: 'You have successfully logged in to the Kemis CRM admin portal.',
    })

    router.push('/master/accounts')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Hero headline */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Kemis CRM</span> Admin
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            Master portal for managing client sub-accounts
          </p>
        </div>

        {/* Login card */}
        <Card className="w-full max-w-md shadow-2xl shadow-black/30 border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kemiscrm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md shadow-emerald-500/25 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in as Admin'}
              </Button>
              <p className="text-xs text-center text-slate-500">
                This portal is for Kemis CRM master administrators.{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                  Regular login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative py-6 px-4 text-center border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Kemis CRM. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

