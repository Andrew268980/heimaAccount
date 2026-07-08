import { getCategoryIcon } from '@/lib/categories'
import type { Expense } from '@/types/expense'
import { Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { getExpenses, deleteExpense } from '@/lib/db'

interface ExpenseListProps {
  refreshKey: number
}

export default function ExpenseList({ refreshKey }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [refreshKey])

  async function loadExpenses() {
    try {
      setLoading(true)
      const data = await getExpenses()
      setExpenses(data)
    } catch (e) {
      console.error('Failed to load expenses:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      console.error('Failed to delete expense:', e)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">加载中...</div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">📝</p>
        <p className="text-slate-400 text-lg">还没有支出记录</p>
        <p className="text-slate-300 text-sm mt-1">点击上方按钮添加第一笔记录吧</p>
      </div>
    )
  }

  // Group by month
  const grouped: Record<string, Expense[]> = {}
  for (const exp of expenses) {
    const month = exp.date.slice(0, 7) // "YYYY-MM"
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(exp)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => {
        const total = items.reduce((sum, e) => sum + e.amount, 0)
        return (
          <div key={month}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-slate-500">
                {month.replace('-', '年')}月
              </h3>
              <span className="text-sm text-slate-400">
                支出 ¥{total.toFixed(2)}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">
                    {getCategoryIcon(exp.category_level1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {exp.category_level2}
                      </span>
                      {exp.note && (
                        <span className="text-xs text-slate-400 truncate">
                          · {exp.note}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {exp.date}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-slate-800">
                    -¥{exp.amount.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exp.id && handleDelete(exp.id)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
