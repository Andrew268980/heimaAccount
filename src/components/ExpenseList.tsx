import { getCategoryIcon } from '@/lib/categories'
import type { Expense } from '@/types/expense'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { ConfirmDialog } from './ui/dialog'
import { useEffect, useState } from 'react'
import { getExpenses, deleteExpense } from '@/lib/db'

interface ExpenseListProps {
  refreshKey: number
  onEdit: (record: Expense) => void
}

const MONTH_NAMES: Record<string, string> = {
  '01': '1月', '02': '2月', '03': '3月', '04': '4月',
  '05': '5月', '06': '6月', '07': '7月', '08': '8月',
  '09': '9月', '10': '10月', '11': '11月', '12': '12月',
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${MONTH_NAMES[m] || m + '月'}`
}

export default function ExpenseList({ refreshKey, onEdit }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

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
      setDeleteTarget(null)
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
        <p className="text-slate-400 text-lg">还没有记录</p>
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
        const expenseTotal = items
          .filter((e) => e.type !== 'income')
          .reduce((sum, e) => sum + e.amount, 0)
        const incomeTotal = items
          .filter((e) => e.type === 'income')
          .reduce((sum, e) => sum + e.amount, 0)

        return (
          <div key={month}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-slate-500">
                {formatMonth(month)}
              </h3>
              <div className="flex gap-3 text-xs">
                {incomeTotal > 0 && (
                  <span className="text-emerald-500">
                    收入 ¥{incomeTotal.toFixed(2)}
                  </span>
                )}
                {expenseTotal > 0 && (
                  <span className="text-slate-400">
                    支出 ¥{expenseTotal.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {items.map((exp) => {
                const isIncome = exp.type === 'income'
                return (
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
                          {isIncome ? '收入' : ''} · {exp.category_level2}
                        </span>
                        {exp.note && (
                          <span className="text-xs text-slate-400 truncate">
                            · {exp.note}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{exp.date}</span>
                    </div>
                    <span
                      className={`text-base font-semibold ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}
                    >
                      {isIncome ? '+' : '-'}¥{exp.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(exp)}
                      className="text-slate-400 hover:text-blue-500 shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(exp)}
                      className="text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除"
        message={`确定要删除"${deleteTarget?.category_level2 || ''}"这条记录吗？金额：¥${(deleteTarget?.amount || 0).toFixed(2)}，此操作不可撤销。`}
        onConfirm={() => deleteTarget?.id && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
