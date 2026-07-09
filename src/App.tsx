import { useState } from 'react'
import { Plus, X, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import StatsPage from '@/pages/StatsPage'
import SettingsPage from '@/pages/SettingsPage'
import SnakeGame from '@/pages/SnakeGame'
import { addExpense, updateExpense, exportCSV, importCSV } from '@/lib/db'
import { cn } from '@/lib/utils'
import type { AddExpenseRequest, Expense } from '@/types/expense'

type Tab = 'bills' | 'stats' | 'settings' | 'game'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('bills')
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Expense | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleExport() {
    try {
      const result = await exportCSV()
      showToast(result.success ? 'success' : 'error', result.message)
    } catch {
      showToast('error', '导出失败')
    }
  }

  async function handleImport() {
    try {
      const result = await importCSV()
      if (result.success) {
        setRefreshKey((k) => k + 1)
      }
      showToast(result.success ? 'success' : 'error', result.message)
    } catch {
      showToast('error', '导入失败')
    }
  }

  async function handleAdd(data: AddExpenseRequest) {
    try {
      await addExpense(data)
      setShowForm(false)
      setEditingRecord(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error('Failed to add expense:', e)
    }
  }

  async function handleEdit(data: AddExpenseRequest) {
    try {
      if (!editingRecord?.id) return
      await updateExpense(editingRecord.id, data)
      setShowForm(false)
      setEditingRecord(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error('Failed to update expense:', e)
    }
  }

  function openAddForm() {
    setEditingRecord(null)
    setShowForm(true)
  }

  function openEditForm(record: Expense) {
    setEditingRecord(record)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingRecord(null)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'bills', label: '账单' },
    { key: 'stats', label: '统计' },
    { key: 'settings', label: '设置' },
    { key: 'game', label: '游戏' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📒</span>
            <span>记账工具</span>
          </h1>
          <div className="flex items-center gap-2">
            {activeTab === 'bills' && (
              <>
                {!showForm ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleImport}>
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button onClick={openAddForm} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      记一笔
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={closeForm}>
                    <X className="h-4 w-4 mr-1" />
                    关闭
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                closeForm()
              }}
              className={cn(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium',
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'bills' && (
          <>
            {/* Add / Edit Form */}
            {showForm && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  {editingRecord ? '修改记录' : '记录一笔'}
                </h2>
                <ExpenseForm
                  onSubmit={editingRecord ? handleEdit : handleAdd}
                  onCancel={closeForm}
                  editRecord={editingRecord}
                />
              </div>
            )}
            {/* Expense List */}
            <ExpenseList refreshKey={refreshKey} onEdit={openEditForm} />
          </>
        )}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'settings' && (
          <SettingsPage
            onCategoriesChanged={() => {
              setRefreshKey((k) => k + 1)
            }}
          />
        )}
        {activeTab === 'game' && <SnakeGame />}
      </main>
    </div>
  )
}
