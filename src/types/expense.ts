export interface Expense {
  id?: number
  amount: number
  category_level1: string
  category_level2: string
  date: string
  note: string
  created_at?: string
}

export interface AddExpenseRequest {
  amount: number
  category_level1: string
  category_level2: string
  date: string
  note: string
}
