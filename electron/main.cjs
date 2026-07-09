const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { initDatabase, getDatabase } = require('./database.cjs')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    title: '记账工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 开发模式加载 localhost，生产模式加载打包文件
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // 初始化数据库：数据库文件存在用户数据目录
  const dbPath = path.join(app.getPath('userData'), 'heimaaccount.db')
  initDatabase(dbPath)
  const db = getDatabase()

  // 注册 IPC 处理器
  registerIpcHandlers(db)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ==================== IPC 处理器 ====================

function registerIpcHandlers(db) {
  // 添加支出/收入记录
  ipcMain.handle('expense:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO records (amount, type, category_level1, category_level2, date, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const now = new Date().toISOString()
    const result = stmt.run(
      data.amount,
      data.type || 'expense',
      data.category_level1,
      data.category_level2,
      data.date,
      data.note || '',
      now,
    )
    return { ...data, id: result.lastInsertRowid, created_at: now }
  })

  // 获取所有记录（按日期倒序）
  ipcMain.handle('expense:getAll', () => {
    return db.prepare('SELECT * FROM records ORDER BY date DESC, created_at DESC').all()
  })

  // 更新记录
  ipcMain.handle('expense:update', (_event, { id, data }) => {
    const stmt = db.prepare(`
      UPDATE records
      SET amount = ?, type = ?, category_level1 = ?, category_level2 = ?, date = ?, note = ?
      WHERE id = ?
    `)
    stmt.run(
      data.amount,
      data.type || 'expense',
      data.category_level1,
      data.category_level2,
      data.date,
      data.note || '',
      id,
    )
    return { id, ...data }
  })

  // 删除记录
  ipcMain.handle('expense:delete', (_event, id) => {
    db.prepare('DELETE FROM records WHERE id = ?').run(id)
    return { success: true }
  })

  // 按月统计
  ipcMain.handle('expense:getMonthlyStats', (_event, yearMonth) => {
    const rows = db.prepare(`
      SELECT category_level1, SUM(amount) as total
      FROM records
      WHERE strftime('%Y-%m', date) = ?
      GROUP BY category_level1
      ORDER BY total DESC
    `).all(yearMonth)
    return rows
  })

  // 获取月度总支出
  ipcMain.handle('expense:getMonthlyTotal', (_event, yearMonth) => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM records
      WHERE strftime('%Y-%m', date) = ? AND type = 'expense'
    `).get(yearMonth)
    return row.total
  })

  // 获取月度总收入
  ipcMain.handle('income:getMonthlyTotal', (_event, yearMonth) => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM records
      WHERE strftime('%Y-%m', date) = ? AND type = 'income'
    `).get(yearMonth)
    return row.total
  })

  // 获取每日支出统计（用于折线图）
  ipcMain.handle('stats:getDailyStats', (_event, yearMonth) => {
    return db.prepare(`
      SELECT date, type, SUM(amount) as total
      FROM records
      WHERE strftime('%Y-%m', date) = ?
      GROUP BY date, type
      ORDER BY date
    `).all(yearMonth)
  })

  // 按分类筛选记录
  ipcMain.handle('expense:getByCategory', (_event, { level1, level2 }) => {
    let query = 'SELECT * FROM records WHERE 1=1'
    const params = []
    if (level1) {
      query += ' AND category_level1 = ?'
      params.push(level1)
    }
    if (level2) {
      query += ' AND category_level2 = ?'
      params.push(level2)
    }
    query += ' ORDER BY date DESC, created_at DESC'
    return db.prepare(query).all(...params)
  })

  // ==================== 分类 IPC ====================

  // 获取分类树（含 ID）
  ipcMain.handle('category:getTree', () => {
    const parents = db.prepare('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id').all()
    const children = db.prepare('SELECT * FROM categories WHERE parent_id IS NOT NULL ORDER BY id').all()

    return parents.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      children: children
        .filter((c) => c.parent_id === p.id)
        .map((c) => ({ id: c.id, name: c.name })),
    }))
  })

  // ==================== 分类 CRUD IPC ====================

  // 添加分类
  ipcMain.handle('category:add', (_event, data) => {
    const result = db.prepare('INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, ?)').run(
      data.name,
      data.icon || '',
      data.parent_id || null,
    )
    return { id: result.lastInsertRowid, ...data }
  })

  // 更新分类（改名同步更新 records 表）
  ipcMain.handle('category:update', (_event, { id, data }) => {
    const oldCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!oldCat) {
      throw new Error('分类不存在')
    }

    const newName = data.name !== undefined ? data.name : oldCat.name
    const newIcon = data.icon !== undefined ? data.icon : oldCat.icon

    // 更新 categories 表
    db.prepare('UPDATE categories SET name = ?, icon = ? WHERE id = ?').run(newName, newIcon, id)

    // 如果改名了，同步更新 records 表
    if (newName !== oldCat.name) {
      if (oldCat.parent_id === null) {
        // 一级分类：更新 records.category_level1
        db.prepare('UPDATE records SET category_level1 = ? WHERE category_level1 = ?').run(
          newName,
          oldCat.name,
        )
      } else {
        // 二级分类：更新 records.category_level2
        db.prepare('UPDATE records SET category_level2 = ? WHERE category_level2 = ?').run(
          newName,
          oldCat.name,
        )
      }
    }

    return { id, name: newName, icon: newIcon }
  })

  // 删除分类（检查是否有记录使用）
  ipcMain.handle('category:delete', (_event, id) => {
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!cat) {
      throw new Error('分类不存在')
    }

    // 检查是否有记录使用该分类
    let recordCount = 0
    if (cat.parent_id === null) {
      // 一级分类
      recordCount = db
        .prepare('SELECT COUNT(*) as count FROM records WHERE category_level1 = ?')
        .get(cat.name).count
    } else {
      // 二级分类：需要先知道父分类名
      const parent = db.prepare('SELECT name FROM categories WHERE id = ?').get(cat.parent_id)
      recordCount = db
        .prepare('SELECT COUNT(*) as count FROM records WHERE category_level1 = ? AND category_level2 = ?')
        .get(parent ? parent.name : '', cat.name).count
    }

    if (recordCount > 0) {
      return { success: false, message: `该分类下有 ${recordCount} 条记录，无法删除` }
    }

    // CASCADE 会自动删除子分类
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { success: true, message: '删除成功' }
  })

  // ==================== 导入导出 IPC ====================

  // 导出为 CSV
  ipcMain.handle('export:csv', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出数据',
      defaultPath: `记账工具_导出_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, message: '已取消' }
    }

    const records = db
      .prepare('SELECT * FROM records ORDER BY date DESC, created_at DESC')
      .all()

    // 生成 CSV
    const headers = ['类型', '金额', '一级分类', '二级分类', '日期', '备注']
    const rows = records.map((r) => [
      r.type === 'income' ? '收入' : '支出',
      r.amount.toFixed(2),
      r.category_level1,
      r.category_level2,
      r.date,
      r.note || '',
    ])

    const csvContent = [
      '﻿' + headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    fs.writeFileSync(result.filePath, csvContent, 'utf-8')
    return { success: true, message: `成功导出 ${records.length} 条记录` }
  })

  // 从 CSV 导入
  ipcMain.handle('import:csv', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入数据',
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: '已取消' }
    }

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')

    // 去掉 BOM
    const cleanContent = content.replace(/^﻿/, '')
    const lines = cleanContent.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      return { success: false, message: 'CSV 文件为空或格式不正确' }
    }

    // 跳过标题行，解析数据
    let imported = 0
    const insertStmt = db.prepare(`
      INSERT INTO records (amount, type, category_level1, category_level2, date, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i])
        if (cells.length < 5) continue

        const typeText = cells[0].trim()
        const type = typeText === '收入' ? 'income' : 'expense'
        const amount = parseFloat(cells[1])
        if (isNaN(amount) || amount <= 0) continue

        const category_level1 = cells[2].trim()
        const category_level2 = cells[3].trim()
        const date = cells[4].trim()
        const note = cells[5] ? cells[5].trim() : ''

        if (!category_level1 || !category_level2 || !date) continue

        insertStmt.run(amount, type, category_level1, category_level2, date, note, new Date().toISOString())
        imported++
      }
    })

    insertMany()
    return { success: true, message: `成功导入 ${imported} 条记录` }
  })
}

// 简易 CSV 行解析（支持引号内逗号）
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
