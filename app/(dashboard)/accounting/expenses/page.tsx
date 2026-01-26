'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Wallet, Receipt } from 'lucide-react'
import { ExpenseDialog } from '@/components/accounting/expense-dialog'
import type { Expense, AccountCategory } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  reimbursed: 'default',
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    // Initialize categories if none exist
    const { data: cats } = await supabase.from('account_categories').select('*').eq('type', 'expense')
    if (!cats || cats.length === 0) {
      if (user) {
        await supabase.rpc('create_default_categories', { p_user_id: user.id })
      }
    }

    const [expRes, catRes] = await Promise.all([
      supabase.from('expenses').select('*, category:account_categories(*)').order('date', { ascending: false }),
      supabase.from('account_categories').select('*').eq('type', 'expense').order('name'),
    ])

    if (!expRes.error) setExpenses(expRes.data || [])
    if (!catRes.error) setCategories(catRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredExpenses = expenses.filter(exp =>
    exp.description.toLowerCase().includes(search.toLowerCase()) ||
    exp.vendor?.toLowerCase().includes(search.toLowerCase()) ||
    exp.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const thisMonthExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.date)
      const now = new Date()
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, exp) => sum + Number(exp.amount), 0)

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingExpense(null)
  }

  const handleSuccess = () => {
    handleClose()
    fetchData()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track and manage expenses</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(thisMonthExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No expenses recorded.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(expense)}
                >
                  <td className="px-6 py-4 text-gray-600">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 font-medium">{expense.description}</td>
                  <td className="px-6 py-4">
                    {expense.category && (
                      <Badge variant="outline" style={{ borderColor: expense.category.color, color: expense.category.color }}>
                        {expense.category.name}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{expense.vendor || '-'}</td>
                  <td className="px-6 py-4 font-medium text-red-600">{formatCurrency(Number(expense.amount))}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[expense.status]}>{expense.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        expense={editingExpense}
        categories={categories}
      />
    </div>
  )
}
