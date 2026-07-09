import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { AddExpenseRequest, Expense, RecordType } from '@/types/expense'

interface ExpenseFormProps {
  onSubmit: (data: AddExpenseRequest) => void
  onCancel: () => void
  // 编辑模式：传入已有记录
  editRecord?: Expense | null
}

export default function ExpenseForm({ onSubmit, onCancel, editRecord }: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10)

  const [recordType, setRecordType] = useState<RecordType>(editRecord?.type || 'expense')
  const [amount, setAmount] = useState(editRecord ? String(editRecord.amount) : '')
  const [level1, setLevel1] = useState(editRecord?.category_level1 || '')
  const [level2, setLevel2] = useState(editRecord?.category_level2 || '')
  const [date, setDate] = useState(editRecord?.date || today)
  const [note, setNote] = useState(editRecord?.note || '')

  const selectedCategory = CATEGORIES.find((c) => c.name === level1)
  const isEdit = !!editRecord

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    if (!level1 || !level2) return

    onSubmit({
      amount: Math.round(numAmount * 100) / 100,
      type: recordType,
      category_level1: level1,
      category_level2: level2,
      date,
      note: note.trim(),
    })
  }

  const isValid =
    amount !== '' &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    level1 !== '' &&
    level2 !== ''

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 收入/支出 类型切换 */}
      <div className="flex rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setRecordType('expense')}
          className={cn(
            'flex-1 rounded-md py-2 text-sm font-medium transition-all',
            recordType === 'expense'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => setRecordType('income')}
          className={cn(
            'flex-1 rounded-md py-2 text-sm font-medium transition-all',
            recordType === 'income'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          收入
        </button>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">金额（元）</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">
            ¥
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-lg font-semibold"
            autoFocus
          />
        </div>
      </div>

      {/* Category Level 1 */}
      <div className="space-y-2">
        <Label>一级分类</Label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setLevel1(cat.name)
                setLevel2('')
              }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm transition-all',
                level1 === cat.name
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Level 2 */}
      {selectedCategory && (
        <div className="space-y-2">
          <Label>二级分类</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategory.children.map((child) => (
              <button
                key={child}
                type="button"
                onClick={() => setLevel2(child)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-all',
                  level2 === child
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {child}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">日期</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">备注（可选）</Label>
        <Input
          id="note"
          placeholder="例如：和同事AA聚餐"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!isValid} size="lg" className="flex-1">
          {isEdit ? '保存修改' : recordType === 'expense' ? '记录支出' : '记录收入'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  )
}
