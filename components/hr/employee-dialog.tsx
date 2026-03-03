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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import type { Employee, Department } from '@/lib/types'

interface EmployeeDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  employee?: Employee | null
  departments: Department[]
}

export function EmployeeDialog({ open, onClose, onSuccess, employee, departments }: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department_id: '',
    hire_date: '',
    salary: '',
    nib_number: '',
    bank_name: '',
    bank_account_number: '',
    pay_type: 'salaried' as Employee['pay_type'],
    base_salary_monthly: '',
    hourly_rate: '',
    pay_frequency: 'monthly' as Employee['pay_frequency'],
    nib_exempt: false,
    employment_type: 'full-time' as Employee['employment_type'],
    status: 'active' as Employee['status'],
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        position: employee.position || '',
        department_id: employee.department_id || '',
        hire_date: employee.hire_date || '',
        salary: employee.salary?.toString() || '',
        nib_number: employee.nib_number || '',
        bank_name: employee.bank_name || '',
        bank_account_number: employee.bank_account_number || '',
        pay_type: employee.pay_type || 'salaried',
        base_salary_monthly: employee.base_salary_monthly?.toString() || '',
        hourly_rate: employee.hourly_rate?.toString() || '',
        pay_frequency: employee.pay_frequency || 'monthly',
        nib_exempt: employee.nib_exempt ?? false,
        employment_type: employee.employment_type,
        status: employee.status,
        address: employee.address || '',
        emergency_contact: employee.emergency_contact || '',
        emergency_phone: employee.emergency_phone || '',
        notes: employee.notes || '',
      })
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department_id: '',
        hire_date: new Date().toISOString().split('T')[0],
        salary: '',
        nib_number: '',
        bank_name: '',
        bank_account_number: '',
        pay_type: 'salaried',
        base_salary_monthly: '',
        hourly_rate: '',
        pay_frequency: 'monthly',
        nib_exempt: false,
        employment_type: 'full-time',
        status: 'active',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        notes: '',
      })
    }
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    const payload = {
      ...formData,
      department_id: formData.department_id === '__none__' ? null : (formData.department_id || null),
      hire_date: formData.hire_date || null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      base_salary_monthly: formData.base_salary_monthly ? parseFloat(formData.base_salary_monthly) : null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      user_id: user.id,
    }

    let error
    if (employee) {
      const result = await supabase.from('employees').update(payload).eq('id', employee.id)
      error = result.error
    } else {
      const result = await supabase.from('employees').insert([payload])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: employee ? 'Employee updated' : 'Employee added' })
    setLoading(false)
    onSuccess()
  }

  const handleDelete = async () => {
    if (!employee || !confirm('Delete this employee?')) return
    setLoading(true)
    const { error } = await supabase.from('employees').delete().eq('id', employee.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Employee deleted' })
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(v) => setFormData({ ...formData, employment_type: v as Employee['employment_type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Employee['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Phone</Label>
                <Input
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-semibold">Payroll</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIB Number</Label>
                    <Input
                      value={formData.nib_number}
                      onChange={(e) => setFormData({ ...formData, nib_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Account Number</Label>
                    <Input
                      type="text"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pay Type</Label>
                    <Select
                      value={formData.pay_type}
                      onValueChange={(v) => setFormData({ ...formData, pay_type: v as Employee['pay_type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salaried</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.pay_type === 'salaried' && (
                    <div className="space-y-2">
                      <Label>Base Salary (Monthly)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.base_salary_monthly}
                        onChange={(e) => setFormData({ ...formData, base_salary_monthly: e.target.value })}
                      />
                    </div>
                  )}
                  {formData.pay_type === 'hourly' && (
                    <div className="space-y-2">
                      <Label>Hourly Rate</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Pay Frequency</Label>
                    <Select
                      value={formData.pay_frequency}
                      onValueChange={(v) => setFormData({ ...formData, pay_frequency: v as Employee['pay_frequency'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="nib_exempt"
                      type="checkbox"
                      className="h-4 w-4 border rounded"
                      checked={formData.nib_exempt}
                      onChange={(e) => setFormData({ ...formData, nib_exempt: e.target.checked })}
                    />
                    <Label htmlFor="nib_exempt">NIB Exempt</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {employee && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : employee ? 'Save' : 'Add Employee'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
