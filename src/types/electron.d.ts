import type { AddExpenseRequest, Expense } from './expense'

export interface AddCategoryRequest {
  name: string
  icon?: string
  parent_id?: number | null
}

export interface UpdateCategoryRequest {
  name?: string
  icon?: string
}

export interface CategoryTreeNode {
  id: number
  name: string
  icon: string
  children: { id: number; name: string }[]
}

export interface ElectronAPI {
  addExpense: (data: AddExpenseRequest) => Promise<Expense>
  getExpenses: () => Promise<Expense[]>
  updateExpense: (id: number, data: AddExpenseRequest) => Promise<void>
  deleteExpense: (id: number) => Promise<void>
  getMonthlyStats: (yearMonth: string) => Promise<{ category_level1: string; total: number }[]>
  getMonthlyTotal: (yearMonth: string) => Promise<number>
  getMonthlyIncomeTotal: (yearMonth: string) => Promise<number>
  getDailyStats: (yearMonth: string) => Promise<{ date: string; type: string; total: number }[]>
  getByCategory: (level1?: string, level2?: string) => Promise<Expense[]>
  getCategoryTree: () => Promise<CategoryTreeNode[]>
  addCategory: (data: AddCategoryRequest) => Promise<{ id: number; name: string; icon: string; parent_id: number | null }>
  updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<{ id: number; name: string; icon: string }>
  deleteCategory: (id: number) => Promise<{ success: boolean; message: string }>
  exportCSV: () => Promise<{ success: boolean; message: string }>
  importCSV: () => Promise<{ success: boolean; message: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
