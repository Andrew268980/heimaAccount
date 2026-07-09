import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/dialog'
import { getCategoryTree, addCategory, updateCategory, deleteCategory } from '@/lib/db'
import type { CategoryTreeNode } from '@/types/electron'

const EMOJI_OPTIONS = [
  '🍽️', '🚗', '🛒', '🏠', '💊', '📚', '🎮', '🎁', '💰', '📦',
  '🐱', '🐶', '🌱', '✈️', '🎓', '💻', '📱', '🎵', '☕', '🏃',
  '🎂', '💼', '🛍️', '🏥', '🎨', '⚽', '🎬', '📷', '💡', '❤️',
  '🔥', '⭐', '🌈', '🎯', '🍕', '🍺', '🚲', '🏖️', '📝', '🔧',
]

interface Props {
  onCategoriesChanged: () => void
}

export default function SettingsPage({ onCategoriesChanged }: Props) {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add-level1' | 'add-level2' | 'edit'>('add-level1')
  const [dialogTarget, setDialogTarget] = useState<{
    id?: number
    parentId?: number
    name?: string
    icon?: string
  }>({})
  const [dialogName, setDialogName] = useState('')
  const [dialogIcon, setDialogIcon] = useState('📦')

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; isLevel1: boolean }>({
    id: 0,
    name: '',
    isLevel1: true,
  })
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadCategories() {
    try {
      setLoading(true)
      setError(null)
      const data = await getCategoryTree()
      setCategories(data)
    } catch (e) {
      console.error('Failed to load categories:', e)
      setError('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function toggleExpand(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // --- Dialog helpers ---

  function openAddLevel1() {
    setDialogMode('add-level1')
    setDialogTarget({})
    setDialogName('')
    setDialogIcon('📦')
    setDialogOpen(true)
  }

  function openAddLevel2(parentId: number) {
    setDialogMode('add-level2')
    setDialogTarget({ parentId })
    setDialogName('')
    setDialogIcon('')
    setDialogOpen(true)
  }

  function openEdit(id: number, name: string, icon?: string) {
    setDialogMode('edit')
    setDialogTarget({ id, name, icon })
    setDialogName(name)
    setDialogIcon(icon || '📦')
    setDialogOpen(true)
  }

  async function handleDialogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dialogName.trim()) return

    try {
      if (dialogMode === 'add-level1') {
        await addCategory({ name: dialogName.trim(), icon: dialogIcon, parent_id: null })
        showToast('success', '一级分类已添加')
      } else if (dialogMode === 'add-level2' && dialogTarget.parentId) {
        await addCategory({ name: dialogName.trim(), parent_id: dialogTarget.parentId })
        showToast('success', '二级分类已添加')
      } else if (dialogMode === 'edit' && dialogTarget.id) {
        await updateCategory(dialogTarget.id, { name: dialogName.trim(), icon: dialogIcon })
        showToast('success', '分类已更新')
      }

      setDialogOpen(false)
      await loadCategories()
      onCategoriesChanged()
    } catch (e) {
      console.error('Failed to save category:', e)
      showToast('error', '操作失败，请重试')
    }
  }

  // --- Delete helpers ---

  function openDelete(id: number, name: string, isLevel1: boolean) {
    setDeleteTarget({ id, name, isLevel1 })
    setDeleteError(null)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    try {
      const result = await deleteCategory(deleteTarget.id)
      if (result.success) {
        setDeleteOpen(false)
        await loadCategories()
        onCategoriesChanged()
        showToast('success', '分类已删除')
      } else {
        setDeleteError(result.message)
      }
    } catch (e) {
      console.error('Failed to delete category:', e)
      setDeleteError('删除失败，请重试')
    }
  }

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-slate-400 text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={loadCategories}>
          重试
        </Button>
      </div>
    )
  }

  // --- Toast ---

  const toastEl = toast && (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div
        className={
          toast.type === 'success'
            ? 'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200'
        }
      >
        {toast.message}
      </div>
    </div>
  )

  // --- Main ---

  return (
    <div className="space-y-6">
      {toastEl}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">分类管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理支出和收入的分类，修改后记账表单会同步更新
          </p>
        </div>
        <Button onClick={openAddLevel1} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          添加一级分类
        </Button>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {categories.map((cat) => {
          const isExpanded = expanded[cat.id] || false
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
            >
              {/* Level 1 Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Icon + Name */}
                <span className="text-xl">{cat.icon}</span>
                <span className="flex-1 font-medium text-slate-700">{cat.name}</span>

                {/* Child count badge */}
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {cat.children.length} 个子分类
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddLevel2(cat.id)}
                    title="添加子分类"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(cat.id, cat.name, cat.icon)}
                    title="编辑"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDelete(cat.id, cat.name, true)}
                    title="删除"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Level 2 Children (expanded) */}
              {isExpanded && cat.children.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                  <div className="grid grid-cols-2 gap-1">
                    {cat.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors group"
                      >
                        <span className="flex-1 text-sm text-slate-600">{child.name}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(child.id, child.name)}
                            title="编辑"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(child.id, child.name, false)}
                            title="删除"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No children hint */}
              {isExpanded && cat.children.length === 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 text-center">
                  <p className="text-xs text-slate-400">暂无子分类，点击 + 添加</p>
                </div>
              )}
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <Settings className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">还没有分类</p>
            <Button onClick={openAddLevel1} size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-1" />
              添加一级分类
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        mode={dialogMode}
        name={dialogName}
        icon={dialogIcon}
        onNameChange={setDialogName}
        onIconChange={setDialogIcon}
        onSubmit={handleDialogSubmit}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title={deleteTarget.isLevel1 ? '删除一级分类' : '删除二级分类'}
        message={
          deleteError ||
          (deleteTarget.isLevel1
            ? `确定要删除「${deleteTarget.name}」及其所有子分类吗？此操作不可撤销。`
            : `确定要删除「${deleteTarget.name}」吗？此操作不可撤销。`)
        }
        onConfirm={deleteError ? () => setDeleteOpen(false) : handleDelete}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteError(null)
        }}
      />
    </div>
  )
}

// ==================== Category Form Dialog ====================

interface CategoryFormDialogProps {
  open: boolean
  mode: 'add-level1' | 'add-level2' | 'edit'
  name: string
  icon: string
  onNameChange: (v: string) => void
  onIconChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function CategoryFormDialog({
  open,
  mode,
  name,
  icon,
  onNameChange,
  onIconChange,
  onSubmit,
  onCancel,
}: CategoryFormDialogProps) {
  if (!open) return null

  const isLevel1 = mode === 'add-level1' || mode === 'edit'
  const title =
    mode === 'add-level1'
      ? '添加一级分类'
      : mode === 'add-level2'
        ? '添加二级分类'
        : '编辑分类'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[420px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="cat-name">分类名称</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={isLevel1 ? '例如：宠物' : '例如：猫粮'}
              autoFocus
            />
          </div>

          {/* Icon Picker (level1 only) */}
          {isLevel1 && (
            <div className="space-y-2">
              <Label>选择图标</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onIconChange(emoji)}
                    className={
                      icon === emoji
                        ? 'text-xl p-1.5 rounded-lg bg-emerald-100 ring-2 ring-emerald-400'
                        : 'text-xl p-1.5 rounded-lg hover:bg-slate-100'
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {mode === 'edit' ? '保存' : '添加'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
