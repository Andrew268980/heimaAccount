# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

黑马记账 — 跨平台桌面记账应用，支持 Windows 10+ / macOS 11+。

## 技术栈

- **前端**：React 19 + TypeScript 6 + Tailwind CSS 4 + Vite 8
- **桌面框架**：Electron 35
- **数据库**：SQLite（通过 better-sqlite3，在主进程直接调用）
- **图表**：ECharts 6（echarts-for-react 封装）
- **图标**：Lucide React
- **包管理**：pnpm
- **代码检查**：oxlint
- **打包**：electron-builder

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（仅前端，浏览器中运行）
pnpm dev

# 开发模式（Electron 窗口）
pnpm electron:dev

# 构建前端
pnpm build

# 构建 Electron 安装包
pnpm electron:build

# 代码检查
pnpm lint

# 填充示例数据
node electron/seed-data.cjs
```

`.npmrc` 配置了淘宝镜像源（npm、Electron、electron-builder），国内环境安装更快。

## 架构概览

### 进程模型（Electron）

```
┌─────────────────────────────────┐
│  渲染进程 (React)                │
│  src/                           │
│  └─ lib/db.ts  → window.electronAPI │
└──────────┬──────────────────────┘
           │ IPC (invoke/handle)
┌──────────▼──────────────────────┐
│  预加载脚本                      │
│  electron/preload.cjs           │
│  contextBridge.exposeInMainWorld│
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  主进程                          │
│  electron/main.cjs              │
│  ├─ 创建 BrowserWindow          │
│  ├─ 注册 IPC handlers           │
│  └─ 调用 electron/database.cjs  │
│       └─ better-sqlite3 操作    │
└─────────────────────────────────┘
```

- **前端 `src/lib/db.ts`** 是对 `window.electronAPI` 的薄封装，每个函数对应一个 IPC 调用
- **`electron/preload.cjs`** 通过 `contextBridge` 暴露安全的 API 给渲染进程
- **`electron/main.cjs`** 注册所有 IPC handler，直接调用 better-sqlite3
- **`electron/database.cjs`** 负责数据库初始化、建表、建索引、填充初始分类数据

### IPC 通信约定

所有 IPC channel 命名遵循 `模块:操作` 格式：

| Channel | 用途 |
|---------|------|
| `expense:add` | 添加记录 |
| `expense:getAll` | 获取全部记录 |
| `expense:update` | 更新记录 |
| `expense:delete` | 删除记录 |
| `expense:getMonthlyStats` | 按月分类统计 |
| `expense:getMonthlyTotal` | 月度总支出 |
| `income:getMonthlyTotal` | 月度总收入 |
| `stats:getDailyStats` | 每日收支明细（用于折线图） |
| `expense:getByCategory` | 按分类筛选 |
| `category:getTree` | 获取分类树 |
| `export:csv` | 导出 CSV（通过原生保存对话框） |
| `import:csv` | 导入 CSV（通过原生打开对话框） |

### 数据库

数据库文件路径：`app.getPath('userData')/heimaaccount.db`（Windows 上在 `%APPDATA%/heimaaccount/`）。

**records 表**：`id, amount, type, category_level1, category_level2, date, note, created_at`
- `type` 取值为 `'expense'` 或 `'income'`
- 有索引：`date`, `category_level1`, `type`

**categories 表**：`id, name, icon, parent_id`（自引用外键，`parent_id` 为 NULL 表示一级分类）

### 前端组件结构

```
App.tsx                     # 根组件：Tab 切换（账单/统计）、表单显隐、导入导出 toast
├─ ExpenseForm.tsx          # 添加/编辑记录表单，含收入/支出类型切换
├─ ExpenseList.tsx          # 账单列表，按月分组，支持编辑/删除
│  └─ ConfirmDialog         # 删除确认弹窗 (components/ui/dialog.tsx)
├─ StatsPage.tsx            # 统计页：月度汇总卡片 + ECharts 饼图 + 折线图
├─ components/ui/
│  ├─ button.tsx            # Button（variant: default/outline/ghost/destructive）
│  ├─ input.tsx             # Input
│  ├─ label.tsx             # Label
│  └─ dialog.tsx            # ConfirmDialog
├─ lib/
│  ├─ db.ts                 # 数据库操作（IPC 封装层）
│  ├─ categories.ts         # 分类常量 CATEGORIES + getCategoryIcon()
│  └─ utils.ts              # cn() 工具函数（clsx + tailwind-merge）
└─ types/
   ├─ expense.ts            # Expense, AddExpenseRequest, RecordType
   └─ electron.d.ts         # ElectronAPI 类型声明 + Window 全局扩展
```

### 状态管理

没有使用全局状态库。App.tsx 通过 `refreshKey`（自增数字）在增/删/改/导入后将 key 传给子组件，子组件的 `useEffect` 依赖该 key 重新加载数据。

### 分类数据：双重来源（⚠️ 需同步）

分类数据存在两个位置，**修改分类时必须同时更新**：

1. **[electron/database.cjs](electron/database.cjs)** 的 `seedCategories()` — 数据库初始种子数据
2. **[src/lib/categories.ts](src/lib/categories.ts)** 的 `CATEGORIES` 常量 — 前端表单使用的静态数据

### 路径别名

`@/` 映射到 `src/`，在 [vite.config.ts](vite.config.ts) 和 [tsconfig.app.json](tsconfig.app.json) 中均有配置。

## 开发注意事项

- 数据库文件存储在用户数据目录（`%APPDATA%/heimaaccount/`），不在项目内。开发模式每次启动 Electron 使用同一数据库，数据持久保留。
- [electron/dev-start.cjs](electron/dev-start.cjs) 清除 `ELECTRON_RUN_AS_NODE` 环境变量，解决某些环境下 Electron 被降级为 Node.js 运行的问题。
- `vite.config.ts` 设置 `base: './'`，适配 Electron 生产模式 `file://` 协议加载资源。
- TypeScript 6.x 要求 `erasableSyntaxOnly: true`，不允许使用 `enum`/`namespace` 等运行时语法。
- Tailwind CSS 4 使用 `@import "tailwindcss"` 语法，不再需要 `tailwind.config.js`。
- 生产构建时 `vite build` 输出到 `dist/`，electron-builder 将 `dist/` 和 `electron/` 一起打包。

## 开发协作规则（重要！）

> ⚠️ **用户不是程序员，不懂任何编程技术。在整个项目开发过程中，遇到任何技术决策时，Claude 必须：**

1. **列出至少 2-3 个可选方案**
2. **用通俗语言解释每个方案是什么、有什么优缺点**
3. **给出明确推荐（标注"推荐"）**
4. **等待用户做出选择后，再继续开发**
5. **不要假设用户懂技术术语——所有解释必须用类比、生活中的例子来说明**

### 需要用户决策的典型场景：

- UI 组件库的选择
- 图标库的选择
- 页面布局方案（侧边栏 vs 顶部导航 vs Tab 导航）
- 图表库的选择
- 任何引入新依赖的决策
- 功能实现方式的二选一/三选一
- UI 配色方案

### 不需要用户决策的场景：

- 代码结构、文件组织
- TypeScript 类型定义
- 后端实现细节
- 构建配置细节
- Bug 修复
