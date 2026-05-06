const { contextBridge, ipcRenderer } = require('electron')

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 文件对话框
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  getBasename: (filePath) => ipcRenderer.invoke('get-basename', filePath),
  
  // 菜单事件监听
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // 平台信息
  platform: process.platform,
  
  // 检查是否在Electron环境中
  isElectron: true
})

// 在窗口加载完成后设置一些全局变量
window.addEventListener('DOMContentLoaded', () => {
  // 标记这是Electron环境
  window.isElectron = true
  
  // 设置AI服务端口
  window.AI_SERVICE_PORT = 3456
  
  console.log('Electron preload script loaded')
})
