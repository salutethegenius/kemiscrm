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
import { KrmFullLockup } from '@/components/logo/krm-logo'
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
        description: 'This portal is for KRM platform master admins only. Redirecting to main app.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      router.refresh()
      return
    }

    toast({
      title: 'Welcome, master admin!',
      description: 'You have successfully logged in to the KRM platform admin portal.',
    })

    router.push('/master/accounts')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1C2F]">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Logo and headline */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <KrmFullLockup variant="dark" showSub height={48} />
          </div>
          <p className="text-lg text-white/70 max-w-md mx-auto">
            Master portal for managing client sub-accounts
          </p>
        </div>

        {/* Login card */}
        <Card className="w-full max-w-md shadow-2xl shadow-black/30 border-white/10 bg-[#172440]/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-center text-white/60">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kemiscrm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C4AB78] focus:ring-[#C4AB78]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C4AB78] focus:ring-[#C4AB78]/30"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 bg-[#C4AB78] hover:bg-[#9E8A5C] text-[#0E1C2F] font-medium shadow-md shadow-[#9E8A5C]/30 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in as Admin'}
              </Button>
              <p className="text-xs text-center text-white/50">
                This portal is for KRM platform master administrators.{' '}
                <Link href="/login" className="text-[#C4AB78] hover:text-[#E5D9B8] hover:underline">
                  Regular login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative py-6 px-4 text-center border-t border-white/10 bg-[#172440]/50 backdrop-blur-sm">
        <p className="text-sm text-white/50">
          &copy; {new Date().getFullYear()} KRM — Kemis Relationship Management. Built in the Bahamas, built for Bahamian businesses.
        </p>
      </footer>
    </div>
  )
}

