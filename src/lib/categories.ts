export interface Category {
  name: string
  icon: string
  children: string[]
}

export const CATEGORIES: Category[] = [
  {
    name: '餐饮饮食',
    icon: '🍽️',
    children: ['早餐', '午餐', '晚餐', '零食饮料', '水果', '聚餐请客', '外卖'],
  },
  {
    name: '交通出行',
    icon: '🚗',
    children: ['公交地铁', '出租车/网约车', '加油充电', '停车费', '火车/高铁', '飞机', '共享单车'],
  },
  {
    name: '购物消费',
    icon: '🛒',
    children: ['衣服鞋帽', '数码产品', '日用品', '美妆护肤', '书籍', '宠物用品'],
  },
  {
    name: '住房居家',
    icon: '🏠',
    children: ['房租/房贷', '水电燃气', '物业费', '网费话费', '家具家电', '维修'],
  },
  {
    name: '医疗健康',
    icon: '💊',
    children: ['门诊挂号', '药品', '体检', '牙科', '健身运动'],
  },
  {
    name: '教育学习',
    icon: '📚',
    children: ['培训课程', '考试报名', '文具', '图书', '网课会员'],
  },
  {
    name: '娱乐休闲',
    icon: '🎮',
    children: ['电影', '游戏充值', '旅行', 'KTV/酒吧', '演出门票', '景点门票'],
  },
  {
    name: '人情往来',
    icon: '🎁',
    children: ['送礼', '红包', '请客', '孝敬父母', '捐款'],
  },
  {
    name: '金融投资',
    icon: '💰',
    children: ['银行手续费', '保险', '基金股票', '利息支出'],
  },
  {
    name: '其他',
    icon: '📦',
    children: ['快递费', '其他杂项'],
  },
]

export function getCategoryIcon(level1: string): string {
  return CATEGORIES.find((c) => c.name === level1)?.icon ?? '📦'
}
