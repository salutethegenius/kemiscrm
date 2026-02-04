'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountCalendarUrl, setAccountCalendarUrl] = useState('')
  const [accountCalendarSaving, setAccountCalendarSaving] = useState(false)
  const [canManageOrg, setCanManageOrg] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  // Profile state
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  // Business details state
  const [businessName, setBusinessName] = useState('')
  const [businessSaving, setBusinessSaving] = useState(false)
  // Invoice customization state
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_address: '',
    invoice_email: '',
    invoice_phone: '',
    invoice_logo_url: '',
    invoice_accent_color: '#2563eb',
    invoice_footer_text: '',
  })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role, full_name')
        .eq('id', user.id)
        .single()

      setFullName(profile?.full_name || '')
      const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
      setCanManageOrg(!!isAdmin)
      setOrgId(profile?.organization_id ?? null)

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, settings')
          .eq('id', profile.organization_id)
          .single()
        if (org) {
          setBusinessName(org.name || '')
          if (isAdmin) {
            const settings = (org.settings as Record<string, unknown>) || {}
            setAccountCalendarUrl((settings.account_calendar_embed_url as string) ?? '')
            setInvoiceSettings({
              invoice_address: (settings.invoice_address as string) ?? '',
              invoice_email: (settings.invoice_email as string) ?? '',
              invoice_phone: (settings.invoice_phone as string) ?? '',
              invoice_logo_url: (settings.invoice_logo_url as string) ?? '',
              invoice_accent_color: (settings.invoice_accent_color as string) ?? '#2563eb',
              invoice_footer_text: (settings.invoice_footer_text as string) ?? '',
            })
          }
        }
      }
    }
    load()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setProfileSaving(false)
      return
    }
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName.trim() || null })
      .eq('id', user.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Saved', description: 'Your profile has been updated.' })
    }
    setProfileSaving(false)
  }

  const handleSaveBusinessName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !canManageOrg) return
    if (!businessName.trim()) {
      toast({ title: 'Error', description: 'Business name cannot be empty.', variant: 'destructive' })
      return
    }
    setBusinessSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({ name: businessName.trim() })
      .eq('id', orgId)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Saved', description: 'Business name has been updated. Refresh the page to see the change in the sidebar.' })
    }
    setBusinessSaving(false)
  }

  const handleSaveAccountCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !canManageOrg) return
    setAccountCalendarSaving(true)
    const { data: org } = await supabase.from('organizations').select('settings').eq('id', orgId).single()
    const current = (org?.settings as Record<string, unknown>) || {}
    const { error } = await supabase
      .from('organizations')
      .update({
        settings: { ...current, account_calendar_embed_url: accountCalendarUrl.trim() || null },
      })
      .eq('id', orgId)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Saved', description: 'Account calendar URL has been updated.' })
    }
    setAccountCalendarSaving(false)
  }

  const handleSaveInvoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !canManageOrg) return
    setInvoiceSaving(true)
    const { data: org } = await supabase.from('organizations').select('settings').eq('id', orgId).single()
    const current = (org?.settings as Record<string, unknown>) || {}
    const { error } = await supabase
      .from('organizations')
      .update({
        settings: {
          ...current,
          invoice_address: invoiceSettings.invoice_address.trim() || null,
          invoice_email: invoiceSettings.invoice_email.trim() || null,
          invoice_phone: invoiceSettings.invoice_phone.trim() || null,
          invoice_logo_url: invoiceSettings.invoice_logo_url.trim() || null,
          invoice_accent_color: invoiceSettings.invoice_accent_color || '#2563eb',
          invoice_footer_text: invoiceSettings.invoice_footer_text.trim() || null,
        },
      })
      .eq('id', orgId)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Saved', description: 'Invoice settings have been updated.' })
    }
    setInvoiceSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Password updated', description: 'Your password has been changed.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and business settings</p>
      </div>

      <div className="space-y-6">
        {/* My Profile Section */}
        <Card id="profile">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Business Details - admin/owner only */}
        {canManageOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Update your organization&apos;s business name. This will be displayed under the Kemis CRM logo in the sidebar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBusinessName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    required
                  />
                </div>
                <Button type="submit" disabled={businessSaving}>
                  {businessSaving ? 'Saving...' : 'Save Business Name'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invoice Customization - admin/owner only */}
        {canManageOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Customization</CardTitle>
              <CardDescription>
                Customize your invoice appearance. These settings will be used when exporting or printing invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveInvoiceSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="invoiceAddress">Business Address</Label>
                    <Textarea
                      id="invoiceAddress"
                      value={invoiceSettings.invoice_address}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_address: e.target.value })}
                      placeholder="123 Business St, City, Country"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceEmail">Invoice Email</Label>
                    <Input
                      id="invoiceEmail"
                      type="email"
                      value={invoiceSettings.invoice_email}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_email: e.target.value })}
                      placeholder="billing@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoicePhone">Invoice Phone</Label>
                    <Input
                      id="invoicePhone"
                      value={invoiceSettings.invoice_phone}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="invoiceLogoUrl">Logo URL</Label>
                    <Input
                      id="invoiceLogoUrl"
                      value={invoiceSettings.invoice_logo_url}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_logo_url: e.target.value })}
                      placeholder="https://your-domain.com/logo.png"
                    />
                    <p className="text-xs text-gray-500">Enter a URL to your company logo image</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceAccentColor">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="invoiceAccentColor"
                        type="color"
                        value={invoiceSettings.invoice_accent_color}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_accent_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={invoiceSettings.invoice_accent_color}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_accent_color: e.target.value })}
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="invoiceFooterText">Footer Text</Label>
                    <Input
                      id="invoiceFooterText"
                      value={invoiceSettings.invoice_footer_text}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_footer_text: e.target.value })}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={invoiceSaving}>
                  {invoiceSaving ? 'Saving...' : 'Save Invoice Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Account Calendar - admin/owner only */}
        {canManageOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Account Calendar</CardTitle>
              <CardDescription>
                Google Calendar embed URL shown to all users on the Calendar page. Use the <strong>public</strong> embed URL so it loads in the frame (no sign-in in a new window): Google Calendar → Settings → calendar → Access permissions → &quot;Make available to everyone&quot; → Integrate calendar → copy the iframe src. Leave empty to use the default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAccountCalendar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountCalendarUrl">Public embed URL</Label>
                  <Input
                    id="accountCalendarUrl"
                    value={accountCalendarUrl}
                    onChange={(e) => setAccountCalendarUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/embed?src=..."
                  />
                </div>
                <Button type="submit" disabled={accountCalendarSaving}>
                  {accountCalendarSaving ? 'Saving...' : 'Save Account Calendar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
