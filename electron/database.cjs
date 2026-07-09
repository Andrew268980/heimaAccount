const Database = require('better-sqlite3')
const path = require('path')

let db = null

function initDatabase(dbPath) {
  console.log('[DB] Database path:', dbPath)

  db = new Database(dbPath)

  // 启用 WAL 模式，提升并发性能
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 创建记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      category_level1 TEXT NOT NULL,
      category_level2 TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
    CREATE INDEX IF NOT EXISTS idx_records_category_level1 ON records(category_level1);
    CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
  `)

  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      parent_id INTEGER DEFAULT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
  `)

  // 检查是否需要插入初始分类数据
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  if (catCount.count === 0) {
    seedCategories(db)
  }

  console.log('[DB] Database initialized successfully')
  return db
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

// ==================== 内置分类数据 ====================

function seedCategories(db) {
  console.log('[DB] Seeding initial category data...')

  const insertCategory = db.prepare('INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, ?)')

  const categories = [
    { name: '餐饮饮食', icon: '🍽️', children: ['早餐', '午餐', '晚餐', '零食饮料', '水果', '聚餐请客', '外卖'] },
    { name: '交通出行', icon: '🚗', children: ['公交地铁', '出租车/网约车', '加油充电', '停车费', '火车/高铁', '飞机', '共享单车'] },
    { name: '购物消费', icon: '🛒', children: ['衣服鞋帽', '数码产品', '日用品', '美妆护肤', '书籍', '宠物用品'] },
    { name: '住房居家', icon: '🏠', children: ['房租/房贷', '水电燃气', '物业费', '网费话费', '家具家电', '维修'] },
    { name: '医疗健康', icon: '💊', children: ['门诊挂号', '药品', '体检', '牙科', '健身运动'] },
    { name: '教育学习', icon: '📚', children: ['培训课程', '考试报名', '文具', '图书', '网课会员'] },
    { name: '娱乐休闲', icon: '🎮', children: ['电影', '游戏充值', '旅行', 'KTV/酒吧', '演出门票', '景点门票'] },
    { name: '人情往来', icon: '🎁', children: ['送礼', '红包', '请客', '孝敬父母', '捐款'] },
    { name: '金融投资', icon: '💰', children: ['银行手续费', '保险', '基金股票', '利息支出'] },
    { name: '其他', icon: '📦', children: ['快递费', '其他杂项'] },
  ]

  const insertMany = db.transaction(() => {
    for (const cat of categories) {
      const result = insertCategory.run(cat.name, cat.icon, null)
      const parentId = result.lastInsertRowid
      for (const childName of cat.children) {
        insertCategory.run(childName, '', parentId)
      }
    }
  })

  insertMany()
  console.log(`[DB] Seeded ${categories.length} primary categories with ${categories.reduce((sum, c) => sum + c.children.length, 0)} secondary categories`)
}

module.exports = { initDatabase, getDatabase }
