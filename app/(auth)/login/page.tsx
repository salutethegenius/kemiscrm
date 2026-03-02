'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { KrmFullLockup } from '@/components/logo/krm-logo'
import { useToast } from '@/components/ui/use-toast'

const DEMO_EMAIL = 'demo@krm.bs'
const DEMO_PASSWORD = 'Demo123!'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()
  const isDemo = searchParams.get('demo') === '1'

  useEffect(() => {
    if (isDemo) {
      setEmail(DEMO_EMAIL)
      setPassword(DEMO_PASSWORD)
    }
  }, [isDemo])

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

    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    })
    
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EE]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwRTFDMkYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-80" />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Logo and headline */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <KrmFullLockup variant="light" showSub height={48} />
          </div>
          <p className="text-lg text-[#4A5D6E] max-w-md mx-auto">
            Kemis Relationship Management — built in the Bahamas, for Bahamian businesses.
          </p>
        </div>

        {/* Login card */}
        <Card className="w-full max-w-md shadow-xl shadow-[#0E1C2F]/10 border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-gray-800">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              {isDemo ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0E1C2F]/5 px-2 py-1 text-[#0E1C2F]/80">
                  Demo credentials pre-filled — click Sign in to explore
                </span>
              ) : (
                'Enter your credentials to continue'
              )}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white border-gray-200 focus:border-[#0E1C2F] focus:ring-[#0E1C2F]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white border-gray-200 focus:border-[#0E1C2F] focus:ring-[#0E1C2F]/20"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="w-full rounded-lg border border-[#0E1C2F]/15 bg-[#0E1C2F]/5 px-3 py-2.5">
                <p className="text-xs font-medium text-[#0E1C2F]/70 mb-1">Demo account</p>
                <p className="text-xs text-[#4A5D6E] font-mono break-all">Email: {DEMO_EMAIL}</p>
                <p className="text-xs text-[#4A5D6E] font-mono">Password: {DEMO_PASSWORD}</p>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-[#0E1C2F] hover:bg-[#172440] text-white font-medium shadow-md shadow-[#0E1C2F]/20 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <p className="text-sm text-center text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-[#0E1C2F] hover:text-[#172440] font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative py-6 px-4 text-center border-t border-[#0E1C2F]/10 bg-white/30 backdrop-blur-sm">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} KRM — Kemis Relationship Management. Built in the Bahamas, built for Bahamian businesses.
        </p>
      </footer>
    </div>
  )
}
