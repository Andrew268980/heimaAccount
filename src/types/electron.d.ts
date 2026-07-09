import type { AddExpenseRequest, Expense } from './expense'

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
  getCategoryTree: () => Promise<{ name: string; icon: string; children: string[] }[]>
  exportCSV: () => Promise<{ success: boolean; message: string }>
  importCSV: () => Promise<{ success: boolean; message: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
