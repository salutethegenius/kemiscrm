'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Search, TrendingUp, DollarSign } from 'lucide-react'
import type { Income, AccountCategory } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category_id: '',
    source: '',
    notes: '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = async () => {
    const [incRes, catRes] = await Promise.all([
      supabase.from('income').select('*, category:account_categories(*)').order('date', { ascending: false }),
      supabase.from('account_categories').select('*').eq('type', 'income').order('name'),
    ])

    if (!incRes.error) setIncomes(incRes.data || [])
    if (!catRes.error) {
      // Deduplicate categories by name
      const uniqueCategories = (catRes.data || []).filter((cat, index, self) =>
        index === self.findIndex(c => c.name === cat.name)
      )
      setCategories(uniqueCategories)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredIncomes = incomes.filter(inc =>
    inc.description.toLowerCase().includes(search.toLowerCase()) ||
    inc.source?.toLowerCase().includes(search.toLowerCase())
  )

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
  const thisMonthIncome = incomes
    .filter(inc => {
      const incDate = new Date(inc.date)
      const now = new Date()
      return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, inc) => sum + Number(inc.amount), 0)

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      date: income.date,
      description: income.description,
      amount: income.amount.toString(),
      category_id: income.category_id || '',
      source: income.source || '',
      notes: income.notes || '',
    })
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingIncome(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category_id: '',
      source: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null,
      user_id: user.id,
    }

    let error
    if (editingIncome) {
      const result = await supabase.from('income').update(payload).eq('id', editingIncome.id)
      error = result.error
    } else {
      const result = await supabase.from('income').insert([payload])
      error = result.error
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: editingIncome ? 'Income updated' : 'Income added' })
      handleClose()
      fetchData()
    }
  }

  const handleDelete = async () => {
    if (!editingIncome || !confirm('Delete this income entry?')) return
    const { error } = await supabase.from('income').delete().eq('id', editingIncome.id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Income deleted' })
      handleClose()
      fetchData()
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income</h1>
          <p className="text-gray-500 mt-1">Track revenue and income sources</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search income..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredIncomes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No income recorded.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredIncomes.map((income) => (
                <tr
                  key={income.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(income)}
                >
                  <td className="px-6 py-4 text-gray-600">{formatDate(income.date)}</td>
                  <td className="px-6 py-4 font-medium">{income.description}</td>
                  <td className="px-6 py-4">
                    {income.category && (
                      <Badge variant="outline" style={{ borderColor: income.category.color, color: income.category.color }}>
                        {income.category.name}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{income.source || '-'}</td>
                  <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(Number(income.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat, index, self) => 
                          index === self.findIndex(c => c.id === cat.id)
                        )
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {editingIncome && (
                <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
              )}
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit">{editingIncome ? 'Save' : 'Add Income'}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
