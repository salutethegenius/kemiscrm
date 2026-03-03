'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'request' | 'update'>('request')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initialEmail = searchParams.get('email') || ''
    if (initialEmail) {
      setEmail(initialEmail)
    }

    // If Supabase redirected back here with an access token in the URL hash,
    // move to the password update step.
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setStep('update')
    }
  }, [searchParams])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const redirectTo = `${window.location.origin}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Check your email',
      description: 'We sent a link to reset your password.',
    })
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Please use at least 8 characters.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please confirm your new password.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Password updated',
      description: 'You can now sign in with your new password.',
    })

    // After reset, send them to login; middleware will route employees to /hr/portal.
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {step === 'request' ? 'Reset your password' : 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {step === 'request'
              ? 'Enter your email address and we will send you a reset link.'
              : 'Choose a new password for your account.'}
          </CardDescription>
        </CardHeader>

        {step === 'request' ? (
          <form onSubmit={handleRequestReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending reset link...' : 'Send reset link'}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

