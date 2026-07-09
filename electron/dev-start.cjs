// Electron dev 启动脚本 - 清除 ELECTRON_RUN_AS_NODE 环境变量后启动 Electron
const { spawn } = require('child_process')
const path = require('path')

// 清除导致 Electron 降级为 Node.js 的环境变量
delete process.env.ELECTRON_RUN_AS_NODE

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const child = spawn(electronPath, ['.', '--dev'], {
  stdio: 'inherit',
  env: process.env,
})

child.on('close', (code) => {
  process.exit(code)
})
