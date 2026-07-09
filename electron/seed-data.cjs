// 填充示例数据脚本
// 用法: node electron/seed-data.cjs

const Database = require('better-sqlite3')
const path = require('path')
const os = require('os')

// 确定数据库路径（与 Electron app.getPath('userData') 一致）
function getDbPath() {
  const platform = os.platform()
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'heimaaccount', 'heimaaccount.db')
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'heimaaccount', 'heimaaccount.db')
  } else {
    return path.join(os.homedir(), '.config', 'heimaaccount', 'heimaaccount.db')
  }
}

const dbPath = getDbPath()
console.log('数据库路径:', dbPath)

const fs = require('fs')
if (!fs.existsSync(dbPath)) {
  console.error('❌ 数据库文件不存在！请先启动一次应用。')
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// 检查现有数据
const existingCount = db.prepare('SELECT COUNT(*) as count FROM records').get()
console.log('当前记录数:', existingCount.count)

if (existingCount.count > 0) {
  console.log('⚠️  数据库中已有记录，将追加示例数据...')
}

// 生成过去 N 天的日期
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// 示例数据：模拟一个正常用户 3 个月的记账记录
const sampleData = [
  // ========== 2026年7月 (本月) ==========
  { amount: 15.5, type: 'expense', level1: '餐饮饮食', level2: '午餐', date: daysAgo(1), note: '公司楼下黄焖鸡' },
  { amount: 8.0, type: 'expense', level1: '餐饮饮食', level2: '早餐', date: daysAgo(1), note: '豆浆油条' },
  { amount: 22.0, type: 'expense', level1: '餐饮饮食', level2: '晚餐', date: daysAgo(1), note: '外卖麻辣烫' },
  { amount: 4.0, type: 'expense', level1: '交通出行', level2: '公交地铁', date: daysAgo(1), note: '上下班通勤' },
  { amount: 35.0, type: 'expense', level1: '餐饮饮食', level2: '外卖', date: daysAgo(2), note: '周末宅家点外卖' },
  { amount: 12.0, type: 'expense', level1: '交通出行', level2: '共享单车', date: daysAgo(2), note: '月卡续费' },
  { amount: 55.0, type: 'expense', level1: '购物消费', level2: '日用品', date: daysAgo(3), note: '超市采购洗衣液纸巾' },
  { amount: 28.5, type: 'expense', level1: '餐饮饮食', level2: '零食饮料', date: daysAgo(3), note: '便利店买零食' },
  { amount: 18.0, type: 'expense', level1: '餐饮饮食', level2: '午餐', date: daysAgo(4), note: '兰州拉面' },
  { amount: 3.0, type: 'expense', level1: '交通出行', level2: '公交地铁', date: daysAgo(4), note: '' },
  { amount: 120.0, type: 'expense', level1: '餐饮饮食', level2: '聚餐请客', date: daysAgo(5), note: '和朋友吃火锅AA' },
  { amount: 68.0, type: 'expense', level1: '娱乐休闲', level2: '电影', date: daysAgo(5), note: '《哪吒3》IMAX' },
  { amount: 9.9, type: 'expense', level1: '餐饮饮食', level2: '水果', date: daysAgo(6), note: '买西瓜' },
  { amount: 200.0, type: 'expense', level1: '住房居家', level2: '网费话费', date: daysAgo(6), note: '手机话费充值' },

  // ========== 2026年6月 ==========
  { amount: 1500.0, type: 'expense', level1: '住房居家', level2: '房租/房贷', date: '2026-06-01', note: '6月房租' },
  { amount: 85.0, type: 'expense', level1: '住房居家', level2: '水电燃气', date: '2026-06-03', note: '5月电费' },
  { amount: 45.0, type: 'expense', level1: '住房居家', level2: '物业费', date: '2026-06-03', note: '' },
  { amount: 16.0, type: 'expense', level1: '餐饮饮食', level2: '午餐', date: '2026-06-05', note: '' },
  { amount: 25.0, type: 'expense', level1: '交通出行', level2: '出租车/网约车', date: '2026-06-07', note: '下雨打车上班' },
  { amount: 320.0, type: 'expense', level1: '购物消费', level2: '衣服鞋帽', date: '2026-06-10', note: '夏天买了两件T恤和短裤' },
  { amount: 88.0, type: 'expense', level1: '医疗健康', level2: '药品', date: '2026-06-12', note: '感冒买药' },
  { amount: 35.0, type: 'expense', level1: '餐饮饮食', level2: '外卖', date: '2026-06-12', note: '生病不想做饭' },
  { amount: 168.0, type: 'expense', level1: '餐饮饮食', level2: '聚餐请客', date: '2026-06-15', note: '同事聚餐' },
  { amount: 299.0, type: 'expense', level1: '购物消费', level2: '数码产品', date: '2026-06-18', note: '618买了个机械键盘' },
  { amount: 18.5, type: 'expense', level1: '餐饮饮食', level2: '午餐', date: '2026-06-20', note: '' },
  { amount: 50.0, type: 'expense', level1: '教育学习', level2: '图书', date: '2026-06-22', note: '买了两本技术书' },
  { amount: 128.0, type: 'expense', level1: '娱乐休闲', level2: '游戏充值', date: '2026-06-25', note: 'Steam夏促剁手' },
  { amount: 66.0, type: 'expense', level1: '餐饮饮食', level2: '晚餐', date: '2026-06-28', note: '周末改善伙食吃烤鱼' },
  { amount: 15.0, type: 'expense', level1: '交通出行', level2: '公交地铁', date: '2026-06-28', note: '' },

  // ========== 2026年5月 ==========
  { amount: 1500.0, type: 'expense', level1: '住房居家', level2: '房租/房贷', date: '2026-05-01', note: '5月房租' },
  { amount: 92.0, type: 'expense', level1: '住房居家', level2: '水电燃气', date: '2026-05-03', note: '4月电费，开空调费电' },
  { amount: 20.0, type: 'expense', level1: '交通出行', level2: '出租车/网约车', date: '2026-05-05', note: '五一出去玩打车' },
  { amount: 580.0, type: 'expense', level1: '娱乐休闲', level2: '旅行', date: '2026-05-05', note: '五一周边游住宿+门票' },
  { amount: 200.0, type: 'expense', level1: '餐饮饮食', level2: '聚餐请客', date: '2026-05-05', note: '旅行中吃的' },
  { amount: 199.0, type: 'expense', level1: '购物消费', level2: '书籍', date: '2026-05-10', note: '京东图书促销' },
  { amount: 300.0, type: 'expense', level1: '教育学习', level2: '培训课程', date: '2026-05-12', note: '买了一个网课' },
  { amount: 48.0, type: 'expense', level1: '医疗健康', level2: '健身运动', date: '2026-05-15', note: '健身房日卡' },
  { amount: 88.0, type: 'expense', level1: '人情往来', level2: '送礼', date: '2026-05-20', note: '朋友生日礼物' },
  { amount: 12.0, type: 'expense', level1: '交通出行', level2: '停车费', date: '2026-05-22', note: '' },
  { amount: 30.0, type: 'expense', level1: '其他', level2: '快递费', date: '2026-05-25', note: '寄快递回家' },
  { amount: 26.0, type: 'expense', level1: '餐饮饮食', level2: '水果', date: '2026-05-28', note: '买荔枝和樱桃' },

  // ========== 收入记录 ==========
  { amount: 12000.0, type: 'income', level1: '工资', level2: '工资', date: '2026-05-01', note: '5月工资' },
  { amount: 12000.0, type: 'income', level1: '工资', level2: '工资', date: '2026-06-01', note: '6月工资' },
  { amount: 12000.0, type: 'income', level1: '工资', level2: '工资', date: '2026-07-01', note: '7月工资' },
  { amount: 500.0, type: 'income', level1: '兼职', level2: '兼职', date: '2026-06-20', note: '周末帮朋友做项目' },
]

// 插入数据
const insertStmt = db.prepare(`
  INSERT INTO records (amount, type, category_level1, category_level2, date, note, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const insertMany = db.transaction(() => {
  for (const item of sampleData) {
    insertStmt.run(
      item.amount,
      item.type,
      item.level1,
      item.level2,
      item.date,
      item.note,
      new Date().toISOString()
    )
  }
})

insertMany()

const newCount = db.prepare('SELECT COUNT(*) as count FROM records').get()
console.log(`✅ 成功插入 ${newCount.count - existingCount.count} 条记录`)
console.log(`📊 数据库共有 ${newCount.count} 条记录`)

// 按月份统计
const monthlyStats = db.prepare(`
  SELECT strftime('%Y-%m', date) as month,
         type,
         COUNT(*) as count,
         SUM(amount) as total
  FROM records
  GROUP BY month, type
  ORDER BY month DESC, type
`).all()
console.log('\n📅 各月统计:')
for (const row of monthlyStats) {
  const typeLabel = row.type === 'income' ? '收入' : '支出'
  console.log(`  ${row.month} | ${typeLabel} | ${row.count}笔 | ¥${row.total.toFixed(2)}`)
}

db.close()
console.log('\n🎉 示例数据填充完成！重启应用即可看到效果。')
