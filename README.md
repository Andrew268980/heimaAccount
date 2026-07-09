# 🐴 黑马记账

跨平台桌面记账应用，支持 Windows 10+ / macOS 11+。

## 功能

- 📝 **收支记录** — 支出/收入，金额、分类、日期、备注
- 📊 **月度统计** — ECharts 饼图 + 折线图，直观查看消费结构
- 🗂️ **自定义分类** — 增删改分类，自定义图标和名称
- 📁 **CSV 导入导出** — 数据可备份导出，也可从 CSV 导入
- 💻 **跨平台** — Windows / macOS 桌面应用

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 4 + Vite |
| 桌面框架 | Electron 35 |
| 数据库 | SQLite（better-sqlite3） |
| 图表 | ECharts 6 |
| 图标 | Lucide React |
| 包管理 | pnpm |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（仅浏览器）
pnpm dev

# 开发模式（Electron 窗口）
pnpm electron:dev

# 构建桌面安装包
pnpm electron:build
```

## 项目结构

```
heimaAccount/
├── src/                    # 前端代码
│   ├── App.tsx             # 主界面（账单/统计/设置）
│   ├── components/         # 组件
│   │   ├── ExpenseForm.tsx # 记账表单
│   │   ├── ExpenseList.tsx # 账单列表
│   │   └── ui/             # 通用 UI 组件
│   ├── pages/
│   │   ├── StatsPage.tsx   # 统计页
│   │   └── SettingsPage.tsx# 设置页（分类管理）
│   ├── lib/
│   │   ├── db.ts           # 数据库操作封装
│   │   ├── categories.ts   # 分类常量
│   │   └── utils.ts        # 工具函数
│   └── types/              # TypeScript 类型
├── electron/               # Electron 主进程
│   ├── main.cjs            # 主进程入口 + IPC
│   ├── preload.cjs         # 预加载脚本
│   ├── database.cjs        # 数据库初始化
│   └── dev-start.cjs       # 开发模式启动
└── package.json
```
