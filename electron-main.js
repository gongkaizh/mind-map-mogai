const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const express = require('express')
const http = require('http')
const { execSync } = require('child_process')

// 设置控制台编码为 UTF-8（仅 Windows）
if (process.platform === 'win32') {
  try {
    execSync('chcp 65001', { stdio: 'ignore' })
  } catch (e) {
    // 忽略错误
  }
}

// 保持对窗口对象的全局引用，如果不这么做的话，当JavaScript对象被垃圾回收的时候，窗口会自动关闭
let mainWindow
let aiServiceProcess
let webServer

// 检查是否是开发模式
const isDev = process.argv.includes('--dev')

// 服务端口
const AI_SERVICE_PORT = 3456
const WEB_SERVICE_PORT = 8081

function createWindow() {
  console.log('开始创建窗口...')
  console.log('当前目录:', __dirname)
  console.log('是否开发模式:', isDev)
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'dist/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
      webSecurity: false // 允许加载本地文件
    },
    show: true, // 立即显示窗口以便调试
    titleBarStyle: 'default'
  })
  
  console.log('窗口创建成功')

  // 设置窗口标题
  mainWindow.setTitle('思维导图 v0.15.0')

  // 加载应用
  console.log('开始加载应用...')
  if (isDev) {
    console.log('开发模式：加载Vue开发服务器')
    // 开发模式：加载Vue开发服务器
    mainWindow.loadURL('http://localhost:8080')
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    console.log('生产模式：启动内置web服务器')
    // 生产模式：启动内置web服务器
    startWebServer().then(() => {
      console.log('Web服务器启动成功，加载页面...')
      mainWindow.loadURL(`http://localhost:${WEB_SERVICE_PORT}`)
    }).catch(error => {
      console.error('启动web服务器失败:', error)
      console.log('降级到静态文件模式')
      // 降级到静态文件
      const indexPath = path.join(__dirname, 'dist/index.html')
      console.log('加载静态文件:', indexPath)
      mainWindow.loadFile(indexPath)
    })
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 启动AI服务
    if (!isDev) {
      startAiService()
    }
  })

  // 处理窗口关闭请求
  mainWindow.on('close', (event) => {
    console.log('窗口关闭请求')
    // 立即开始清理流程
    stopWebServer()
    stopAiService()

    // 设置强制退出定时器
    setTimeout(() => {
      console.log('强制退出应用程序')
      process.exit(0)
    }, 3000)
  })

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    console.log('主窗口关闭事件触发')
    mainWindow = null
    // 再次确保服务停止
    stopWebServer()
    stopAiService()
    // 强制退出应用
    app.quit()

    // 最后的保险：2秒后强制退出
    setTimeout(() => {
      console.log('最终强制退出')
      process.exit(0)
    }, 2000)
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 阻止导航到外部URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    const allowedOrigins = [
      'http://localhost:8080',  // 开发服务器
      `http://localhost:${WEB_SERVICE_PORT}`,  // 内置web服务器
      'file://'  // 本地文件
    ]
    
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// 启动Web服务器
function startWebServer() {
  return new Promise((resolve, reject) => {
    try {
      const app = express()
      
      // 设置静态文件服务
      app.use(express.static(path.join(__dirname, 'dist')))
      app.use('/dist', express.static(path.join(__dirname, 'dist')))  // 添加/dist路径映射
      app.use('/web', express.static(path.join(__dirname, 'web')))
      app.use('/simple-mind-map', express.static(path.join(__dirname, 'simple-mind-map')))
      
      // 处理所有路由，返回index.html（用于SPA路由）
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist/index.html'))
      })
      
      // 创建HTTP服务器
      webServer = http.createServer(app)
      
      // 启动服务器
      webServer.listen(WEB_SERVICE_PORT, 'localhost', () => {
        console.log(`Web服务器已启动，端口: ${WEB_SERVICE_PORT}`)
        resolve()
      })
      
      webServer.on('error', (error) => {
        console.error('Web服务器启动失败:', error)
        reject(error)
      })
      
    } catch (error) {
      console.error('创建Web服务器时出错:', error)
      reject(error)
    }
  })
}

// 停止Web服务器
function stopWebServer() {
  if (webServer) {
    console.log('停止Web服务器...')
    try {
      // 立即停止接受新连接
      webServer.close(() => {
        console.log('Web服务器已关闭')
      })

      // 强制关闭所有连接
      if (webServer.closeAllConnections) {
        webServer.closeAllConnections()
      }

      // 如果2秒后还没关闭，强制销毁
      setTimeout(() => {
        if (webServer) {
          console.log('强制销毁Web服务器')
          try {
            webServer.destroy && webServer.destroy()
          } catch (e) {
            console.error('销毁Web服务器时出错:', e)
          }
        }
      }, 2000)

    } catch (error) {
      console.error('关闭Web服务器时出错:', error)
    }
    webServer = null
  }
}

// 启动AI服务
function startAiService() {
  try {
    console.log('启动AI服务...')
    
    // AI服务脚本路径
    let aiServicePath
    if (isDev) {
      aiServicePath = path.join(__dirname, 'web/simple-ai-service.js')
    } else {
      // 在打包后的应用中，尝试多个可能的路径
      const possiblePaths = [
        path.join(process.resourcesPath, 'ai-service.js'),
        path.join(__dirname, 'web/simple-ai-service.js'),
        path.join(__dirname, 'resources/ai-service.js')
      ]
      
      aiServicePath = possiblePaths.find(p => {
        try {
          require('fs').accessSync(p)
          return true
        } catch {
          return false
        }
      })
      
      if (!aiServicePath) {
        console.log('AI服务文件未找到，跳过AI服务启动')
        return
      }
    }
    
    // 启动AI服务进程
    aiServiceProcess = spawn('node', [aiServicePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: AI_SERVICE_PORT }
    })

    aiServiceProcess.stdout.on('data', (data) => {
      console.log(`AI服务输出: ${data}`)
    })

    aiServiceProcess.stderr.on('data', (data) => {
      console.error(`AI服务错误: ${data}`)
    })

    aiServiceProcess.on('close', (code) => {
      console.log(`AI服务进程退出，代码: ${code}`)
    })

    aiServiceProcess.on('error', (error) => {
      console.error('AI服务启动失败:', error)
      // 不显示错误对话框，只记录日志
      console.log('AI服务启动失败，应用将继续运行但AI功能不可用')
    })

    console.log(`AI服务已启动，端口: ${AI_SERVICE_PORT}`)
  } catch (error) {
    console.error('启动AI服务时出错:', error)
  }
}

// 停止AI服务
function stopAiService() {
  if (aiServiceProcess) {
    console.log('停止AI服务...')
    try {
      // 直接强制杀死进程，不等待优雅关闭
      console.log('强制关闭AI服务进程')
      aiServiceProcess.kill('SIGKILL')

      // 备用方案：如果1秒后还没关闭，再次尝试
      setTimeout(() => {
        if (aiServiceProcess && !aiServiceProcess.killed) {
          console.log('再次尝试强制关闭AI服务进程')
          try {
            process.kill(aiServiceProcess.pid, 'SIGKILL')
          } catch (e) {
            console.error('无法杀死AI服务进程:', e)
          }
        }
      }, 1000)
    } catch (error) {
      console.error('关闭AI服务时出错:', error)
    }
    aiServiceProcess = null
  }
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new')
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open')
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于思维导图',
              message: '思维导图桌面应用',
              detail: 'Version 0.15.0\n\n一个功能强大的思维导图工具，支持AI续写功能。'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  console.log('Electron应用程序已准备就绪')
  createWindow()
  createMenu()

  app.on('activate', () => {
    console.log('应用程序被激活')
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  console.log('所有窗口已关闭')
  // 停止所有服务
  stopWebServer()
  stopAiService()

  // 强制退出应用（包括macOS）
  console.log('强制退出应用程序')
  app.quit()

  // 设置一个超时，如果5秒后还没退出就强制退出
  setTimeout(() => {
    console.log('强制退出进程')
    process.exit(0)
  }, 5000)
})

// 添加更多事件监听器用于调试
app.on('before-quit', () => {
  console.log('应用程序即将退出')
  // 确保所有服务都停止
  stopWebServer()
  stopAiService()
})

app.on('will-quit', () => {
  console.log('应用程序将要退出')
  // 最后一次确保清理
  stopWebServer()
  stopAiService()
})

app.on('quit', () => {
  console.log('应用程序已退出')
})

// 添加更多事件监听器用于调试
app.on('before-quit', () => {
  console.log('应用程序即将退出')
})

app.on('will-quit', () => {
  console.log('应用程序将要退出')
})

app.on('quit', () => {
  console.log('应用程序已退出')
})

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
})

// 在这个文件中，你可以包含应用程序剩余的所有主进程代码
// 也可以拆分成几个文件，然后用require导入

// IPC通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

// 文件读取
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const fs = require('fs')
    const path = require('path')

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }

    // 检查文件大小
    const stats = fs.statSync(filePath)
    const fileSizeInMB = stats.size / (1024 * 1024)

    if (fileSizeInMB > 50) { // 50MB限制
      return { success: false, error: '文件过大，无法读取（超过50MB）' }
    }

    // 检查文件扩展名
    const ext = path.extname(filePath).toLowerCase()
    if (ext !== '.smm' && ext !== '.json') {
      return { success: false, error: '不支持的文件格式' }
    }

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8')

    // 检查内容是否为空
    if (!content || content.trim() === '') {
      return { success: false, error: '文件内容为空' }
    }

    return { success: true, content }
  } catch (error) {
    console.error('文件读取错误:', error)
    return { success: false, error: error.message }
  }
})

// 文件写入
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    const fs = require('fs')
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 获取文件名
ipcMain.handle('get-basename', async (event, filePath) => {
  try {
    const path = require('path')
    return { success: true, basename: path.basename(filePath) }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
