const { contextBridge, ipcRenderer } = require('electron')

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 添加记录
  addExpense: (data) => ipcRenderer.invoke('expense:add', data),

  // 获取所有记录
  getExpenses: () => ipcRenderer.invoke('expense:getAll'),

  // 更新记录
  updateExpense: (id, data) => ipcRenderer.invoke('expense:update', { id, data }),

  // 删除记录
  deleteExpense: (id) => ipcRenderer.invoke('expense:delete', id),

  // 按月统计各分类支出
  getMonthlyStats: (yearMonth) => ipcRenderer.invoke('expense:getMonthlyStats', yearMonth),

  // 获取月度总支出
  getMonthlyTotal: (yearMonth) => ipcRenderer.invoke('expense:getMonthlyTotal', yearMonth),

  // 获取月度总收入
  getMonthlyIncomeTotal: (yearMonth) => ipcRenderer.invoke('income:getMonthlyTotal', yearMonth),

  // 获取每日统计
  getDailyStats: (yearMonth) => ipcRenderer.invoke('stats:getDailyStats', yearMonth),

  // 按分类筛选
  getByCategory: (level1, level2) =>
    ipcRenderer.invoke('expense:getByCategory', { level1, level2 }),

  // 获取分类树
  getCategoryTree: () => ipcRenderer.invoke('category:getTree'),

  // 导出/导入 CSV
  exportCSV: () => ipcRenderer.invoke('export:csv'),
  importCSV: () => ipcRenderer.invoke('import:csv'),
})
