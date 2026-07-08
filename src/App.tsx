import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import { addExpense } from '@/lib/db'
import type { AddExpenseRequest } from '@/types/expense'

export default function App() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleAdd(data: AddExpenseRequest) {
    try {
      await addExpense(data)
      setShowForm(false)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error('Failed to add expense:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>🐴</span>
            <span>黑马记账</span>
          </h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              记一笔
            </Button>
          )}
          {showForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <X className="h-4 w-4 mr-1" />
              关闭
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Add Expense Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              记录一笔支出
            </h2>
            <ExpenseForm
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Expense List */}
        <ExpenseList refreshKey={refreshKey} />
      </main>
    </div>
  )
}
