'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  // Email/mailbox state
  const [mailboxes, setMailboxes] = useState<
    { id: string; email_address: string; provider: string; status: string; last_synced_at: string | null }[]
  >([])
  const [mailboxesLoading, setMailboxesLoading] = useState(false)
  const [imapEmail, setImapEmail] = useState('')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState(993)
  const [imapSecure, setImapSecure] = useState(true)
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [imapUsername, setImapUsername] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [connectingImap, setConnectingImap] = useState(false)
  const [syncingMailboxId, setSyncingMailboxId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

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

      // Load connected mailboxes
      setMailboxesLoading(true)
      const { data: mailboxRows } = await supabase
        .from('mailbox_accounts')
        .select('id, email_address, provider, status, last_synced_at')
        .order('created_at', { ascending: true })
      setMailboxes(
        (mailboxRows || []).map((m) => ({
          id: m.id as string,
          email_address: m.email_address as string,
          provider: m.provider as string,
          status: m.status as string,
          last_synced_at: (m.last_synced_at as string | null) ?? null,
        }))
      )
      setMailboxesLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const connected = searchParams.get('email_connected')
    const error = searchParams.get('email_error')
    if (connected) {
      toast({
        title: 'Email connected',
        description: `Connected ${connected} mailbox successfully.`,
      })
    }
    if (error) {
      toast({
        title: 'Email error',
        description: 'There was a problem connecting your email account.',
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

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

  const refreshMailboxes = async () => {
    setMailboxesLoading(true)
    const { data: mailboxRows } = await supabase
      .from('mailbox_accounts')
      .select('id, email_address, provider, status, last_synced_at')
      .order('created_at', { ascending: true })
    setMailboxes(
      (mailboxRows || []).map((m) => ({
        id: m.id as string,
        email_address: m.email_address as string,
        provider: m.provider as string,
        status: m.status as string,
        last_synced_at: (m.last_synced_at as string | null) ?? null,
      }))
    )
    setMailboxesLoading(false)
  }

  const handleConnectGmail = () => {
    window.location.href = '/api/email/connect/gmail'
  }

  const handleConnectImap = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnectingImap(true)
    try {
      const res = await fetch('/api/email/connect/imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: imapEmail.trim(),
          imapHost: imapHost.trim(),
          imapPort: imapPort >= 1 && imapPort <= 65535 ? imapPort : 993,
          imapSecure,
          smtpHost: smtpHost.trim(),
          smtpPort: smtpPort >= 1 && smtpPort <= 65535 ? smtpPort : 587,
          smtpSecure,
          username: imapUsername.trim(),
          password: imapPassword,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to connect mailbox')
      }
      toast({ title: 'Connected', description: 'Mailbox connected successfully.' })
      setImapPassword('')
      await refreshMailboxes()
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      })
    }
    setConnectingImap(false)
  }

  const handleInitialSync = async (mailboxId: string) => {
    setSyncingMailboxId(mailboxId)
    try {
      const res = await fetch('/api/email/sync/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailboxAccountId: mailboxId }),
      })
      if (!res.ok) {
        throw new Error('Initial sync failed')
      }
      toast({
        title: 'Sync started',
        description: 'Initial email sync has been triggered.',
      })
      await refreshMailboxes()
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      })
    }
    setSyncingMailboxId(null)
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

        {/* Email Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Email Accounts</CardTitle>
            <CardDescription>
              Connect an email inbox to send and receive email inside Kemis CRM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Connected mailboxes</p>
              {mailboxesLoading ? (
                <p className="text-sm text-gray-500">Loading mailboxes...</p>
              ) : mailboxes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No mailboxes connected yet. Connect Gmail or a custom IMAP/SMTP account.
                </p>
              ) : (
                <div className="space-y-2">
                  {mailboxes.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{m.email_address}</p>
                        <p className="text-xs text-gray-500">
                          Provider: {m.provider} · Status: {m.status}
                          {m.last_synced_at
                            ? ` · Last sync: ${new Date(m.last_synced_at).toLocaleString()}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={syncingMailboxId === m.id}
                          onClick={() => handleInitialSync(m.id)}
                        >
                          {syncingMailboxId === m.id ? 'Syncing...' : 'Sync 30 days'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Connect Gmail</p>
              <p className="text-xs text-gray-500">
                You&apos;ll be redirected to Google to grant access to read and send email from your
                inbox. Only your mailbox is connected, not your entire Google account.
              </p>
              <Button type="button" onClick={handleConnectGmail}>
                Connect Gmail
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Connect IMAP/SMTP</p>
              <p className="text-xs text-gray-500">
                Use this for generic email providers. Credentials are encrypted at rest.
              </p>
              <form onSubmit={handleConnectImap} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="imapEmail">Email address</Label>
                    <Input
                      id="imapEmail"
                      type="email"
                      value={imapEmail}
                      onChange={(e) => setImapEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imapUsername">Username</Label>
                    <Input
                      id="imapUsername"
                      value={imapUsername}
                      onChange={(e) => setImapUsername(e.target.value)}
                      placeholder="Usually the full email address"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imapPassword">Password / App password</Label>
                    <Input
                      id="imapPassword"
                      type="password"
                      value={imapPassword}
                      onChange={(e) => setImapPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imapHost">IMAP host</Label>
                    <Input
                      id="imapHost"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="imap.domain.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imapPort">IMAP port</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={imapPort || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') setImapPort(0)
                        else setImapPort(Number(v) || 993)
                      }}
                      placeholder="993"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imapSecure">IMAP TLS</Label>
                    <Input
                      id="imapSecure"
                      type="checkbox"
                      checked={imapSecure}
                      onChange={(e) => setImapSecure(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="smtpHost">SMTP host</Label>
                    <Input
                      id="smtpHost"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.domain.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="smtpPort">SMTP port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={smtpPort || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') setSmtpPort(0)
                        else setSmtpPort(Number(v) || 587)
                      }}
                      placeholder="587"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="smtpSecure">SMTP secure (TLS)</Label>
                    <Input
                      id="smtpSecure"
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={connectingImap}>
                  {connectingImap ? 'Connecting...' : 'Connect IMAP/SMTP'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

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
