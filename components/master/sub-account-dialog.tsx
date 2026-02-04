'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import type { Organization } from '@/lib/types'
import { FEATURE_OPTIONS } from '@/lib/types'

interface SubAccountDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  parentOrgId: string
  organization?: Organization | null
}

export function SubAccountDialog({
  open,
  onClose,
  onSuccess,
  parentOrgId,
  organization,
}: SubAccountDialogProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    max_users: 10,
    max_storage_mb: 1000,
    billing_plan: 'free' as 'free' | 'basic' | 'pro' | 'enterprise',
    billing_status: 'active' as 'active' | 'suspended' | 'cancelled',
    enabled_features: [] as string[],
    branding_display_name: '',
    branding_logo_url: '',
    branding_accent_color: '#2563eb',
  })

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug || '',
        max_users: organization.max_users ?? 10,
        max_storage_mb: organization.max_storage_mb ?? 1000,
        billing_plan: (organization.billing_plan as any) || 'free',
        billing_status: (organization.billing_status as any) || 'active',
        enabled_features: organization.enabled_features || [],
        branding_display_name: organization.branding?.display_name || organization.name,
        branding_logo_url: organization.branding?.logo_url || '',
        branding_accent_color: organization.branding?.accent_color || '#2563eb',
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        name: '',
        slug: '',
        enabled_features: FEATURE_OPTIONS.map(f => f.key),
        branding_display_name: '',
        branding_logo_url: '',
        branding_accent_color: '#2563eb',
        billing_plan: 'free',
        billing_status: 'active',
        max_users: 10,
        max_storage_mb: 1000,
      }))
    }
  }, [organization, open])

  const toggleFeature = (key: string) => {
    setFormData((prev) => {
      const exists = prev.enabled_features.includes(key)
      return {
        ...prev,
        enabled_features: exists
          ? prev.enabled_features.filter(f => f !== key)
          : [...prev.enabled_features, key],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: Partial<Organization> & { name: string; slug: string | null } = {
      name: formData.name,
      slug: formData.slug || null,
      is_master: false,
      parent_org_id: parentOrgId,
      max_users: formData.max_users,
      max_storage_mb: formData.max_storage_mb,
      billing_plan: formData.billing_plan,
      billing_status: formData.billing_status,
      enabled_features: formData.enabled_features,
      branding: {
        display_name: formData.branding_display_name || formData.name,
        logo_url: formData.branding_logo_url || undefined,
        accent_color: formData.branding_accent_color || undefined,
      },
    }

    let error
    if (organization) {
      const { error: updError } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', organization.id)
      error = updError
    } else {
      const { error: insError } = await supabase
        .from('organizations')
        .insert({
          ...payload,
          settings: {},
        })
      error = insError
    }

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: organization ? 'Sub-account updated' : 'Sub-account created',
      })
      onSuccess()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{organization ? 'Edit Sub-Account' : 'Create Sub-Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="drewber"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_users}
                onChange={(e) =>
                  setFormData({ ...formData, max_users: parseInt(e.target.value || '1', 10) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max Storage (MB)</Label>
              <Input
                type="number"
                min={100}
                step={100}
                value={formData.max_storage_mb}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_storage_mb: parseInt(e.target.value || '100', 10),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Billing Plan</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={formData.billing_plan}
                onChange={(e) =>
                  setFormData({ ...formData, billing_plan: e.target.value as any })
                }
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Billing Status</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={formData.billing_status}
                onChange={(e) =>
                  setFormData({ ...formData, billing_status: e.target.value as any })
                }
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Features</Label>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <label
                    key={feature.key}
                    className="flex items-center justify-between text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.enabled_features.includes(feature.key)}
                        onCheckedChange={() => toggleFeature(feature.key)}
                        id={`feature-${feature.key}`}
                      />
                      <span>{feature.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{feature.group}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Branding</Label>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label>Display Name</Label>
                  <Input
                    value={formData.branding_display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, branding_display_name: e.target.value })
                    }
                    placeholder="Drewber Solutions Ltd."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Logo URL</Label>
                  <Input
                    value={formData.branding_logo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, branding_logo_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      className="w-12 h-9 p-1"
                      value={formData.branding_accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, branding_accent_color: e.target.value })
                      }
                    />
                    <Input
                      value={formData.branding_accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, branding_accent_color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notes (internal)</Label>
                  <Textarea
                    placeholder="Internal notes about this sub-account..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : organization ? 'Save Changes' : 'Create Sub-Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

