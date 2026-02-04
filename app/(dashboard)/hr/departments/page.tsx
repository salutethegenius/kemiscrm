'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Building2, Users } from 'lucide-react'
import type { Department } from '@/lib/types'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const { toast } = useToast()
  const supabase = createClient()

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*, employees(id, first_name, last_name)')
      .order('name')

    if (data) {
      const depts = data.map((d) => ({
        ...d,
        employees: (d.employees as { id: string; first_name: string; last_name: string }[]) || [],
        employee_count: (d.employees?.length ?? 0) as number,
      }))
      setDepartments(depts)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({ name: dept.name, description: dept.description || '' })
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingDept(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let error
    if (editingDept) {
      const result = await supabase.from('departments').update(formData).eq('id', editingDept.id)
      error = result.error
    } else {
      const result = await supabase.from('departments').insert([{ ...formData, user_id: user.id }])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: editingDept ? 'Department updated' : 'Department created' })
      handleClose()
      fetchDepartments()
    }
  }

  const handleDelete = async () => {
    if (!editingDept || !confirm('Delete this department?')) return
    const { error } = await supabase.from('departments').delete().eq('id', editingDept.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Department deleted' })
      handleClose()
      fetchDepartments()
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Organize your team structure</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No departments yet.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(dept)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Users className="h-4 w-4 mr-1" />
                      {dept.employees?.length ?? dept.employee_count ?? 0} employees
                    </div>
                  </div>
                </div>
                {dept.description && (
                  <p className="text-sm text-gray-500 mt-3">{dept.description}</p>
                )}
                {/* Employees in this department */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Employees
                  </p>
                  {dept.employees && dept.employees.length > 0 ? (
                    <ul className="space-y-1.5">
                      {dept.employees.map((emp) => (
                        <li
                          key={emp.id}
                          className="text-sm text-gray-700"
                        >
                          {emp.first_name} {emp.last_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No employees in this department</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {editingDept && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit">{editingDept ? 'Save' : 'Create'}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
