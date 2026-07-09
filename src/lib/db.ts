import type { AddExpenseRequest, Expense } from '@/types/expense'

// 检测是否在 Electron 环境中
function getAPI() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  throw new Error('Electron API not available')
}

export async function addExpense(data: AddExpenseRequest): Promise<Expense> {
  const api = getAPI()
  return api.addExpense(data)
}

export async function getExpenses(): Promise<Expense[]> {
  const api = getAPI()
  return api.getExpenses()
}

export async function deleteExpense(id: number): Promise<void> {
  const api = getAPI()
  await api.deleteExpense(id)
}

export async function updateExpense(id: number, data: AddExpenseRequest): Promise<void> {
  const api = getAPI()
  await api.updateExpense(id, data)
}

export async function getMonthlyStats(yearMonth: string): Promise<{ category_level1: string; total: number }[]> {
  const api = getAPI()
  return api.getMonthlyStats(yearMonth)
}

export async function getMonthlyTotal(yearMonth: string): Promise<number> {
  const api = getAPI()
  return api.getMonthlyTotal(yearMonth)
}

export async function getMonthlyIncomeTotal(yearMonth: string): Promise<number> {
  const api = getAPI()
  return api.getMonthlyIncomeTotal(yearMonth)
}

export async function getDailyStats(yearMonth: string): Promise<{ date: string; type: string; total: number }[]> {
  const api = getAPI()
  return api.getDailyStats(yearMonth)
}

export async function getByCategory(level1?: string, level2?: string): Promise<Expense[]> {
  const api = getAPI()
  return api.getByCategory(level1, level2)
}

export async function getCategoryTree(): Promise<{ name: string; icon: string; children: string[] }[]> {
  const api = getAPI()
  return api.getCategoryTree()
}

export async function exportCSV(): Promise<{ success: boolean; message: string }> {
  const api = getAPI()
  return api.exportCSV()
}

export async function importCSV(): Promise<{ success: boolean; message: string }> {
  const api = getAPI()
  return api.importCSV()
}
