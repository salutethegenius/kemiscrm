'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [incomeRes, expenseRes, invoiceRes] = await Promise.all([
        supabase.from('income').select('amount, date'),
        supabase.from('expenses').select('amount, date'),
        supabase.from('invoices').select('total, status'),
      ])

      const incomes = incomeRes.data || []
      const expenses = expenseRes.data || []
      const invoices = invoiceRes.data || []

      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
      const totalPaid = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total), 0)

      const monthlyIncome = incomes
        .filter(i => i.date >= startOfMonth.split('T')[0])
        .reduce((sum, i) => sum + Number(i.amount), 0)

      const monthlyExpenses = expenses
        .filter(e => e.date >= startOfMonth.split('T')[0])
        .reduce((sum, e) => sum + Number(e.amount), 0)

      setStats({
        totalIncome,
        totalExpenses,
        totalInvoiced,
        totalPaid,
        monthlyIncome,
        monthlyExpenses,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const netProfit = stats.totalIncome + stats.totalPaid - stats.totalExpenses
  const monthlyNet = stats.monthlyIncome - stats.monthlyExpenses

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-500 mt-1">Overview of your financial performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalIncome + stats.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Invoices</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalInvoiced - stats.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net</p>
              <p className={`text-xl font-bold ${monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyNet)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-500">Total Invoiced</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalInvoiced)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${stats.totalInvoiced > 0 ? (stats.totalPaid / stats.totalInvoiced) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.totalInvoiced > 0 ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100) : 0}% collected
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
