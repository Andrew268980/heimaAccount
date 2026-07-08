import Dexie, { type EntityTable } from 'dexie'
import type { AddExpenseRequest, Expense } from '@/types/expense'

// IndexedDB 数据库
const db = new Dexie('heimaAccount') as Dexie & {
  expenses: EntityTable<Expense, 'id'>
}

db.version(1).stores({
  expenses: '++id, date, category_level1, category_level2',
})

export async function addExpense(data: AddExpenseRequest): Promise<Expense> {
  const now = new Date().toISOString()
  const expense: Expense = {
    ...data,
    created_at: now,
  }
  const id = await db.expenses.add(expense)
  return { ...expense, id }
}

export async function getExpenses(): Promise<Expense[]> {
  return db.expenses.orderBy('date').reverse().toArray()
}

export async function deleteExpense(id: number): Promise<void> {
  await db.expenses.delete(id)
}

export async function updateExpense(
  id: number,
  data: AddExpenseRequest,
): Promise<void> {
  await db.expenses.update(id, data)
}
