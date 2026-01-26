'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, UserCog, Mail, Phone, Briefcase } from 'lucide-react'
import { EmployeeDialog } from '@/components/hr/employee-dialog'
import type { Employee, Department } from '@/lib/types'

const statusColors: Record<string, 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  terminated: 'destructive',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const [empRes, deptRes] = await Promise.all([
      supabase.from('employees').select('*, department:departments(*)').order('last_name'),
      supabase.from('departments').select('*').order('name'),
    ])

    if (!empRes.error) setEmployees(empRes.data || [])
    if (!deptRes.error) setDepartments(deptRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.position?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingEmployee(null)
  }

  const handleSuccess = () => {
    handleClose()
    fetchData()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your team members</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No employees yet.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(employee)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <Badge variant={statusColors[employee.status]}>{employee.status}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500 mt-1">
                      {employee.position && (
                        <div className="flex items-center">
                          <Briefcase className="h-3.5 w-3.5 mr-2" />
                          <span className="truncate">{employee.position}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-2" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.department && (
                        <Badge variant="outline" className="mt-2">
                          {employee.department.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmployeeDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        employee={editingEmployee}
        departments={departments}
      />
    </div>
  )
}
