<h1 align="center">Mind Map - 思维导图应用</h1>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

> 一个简单、高效的思维导图工具，支持 Web 在线使用和桌面应用

## 📖 项目简介

本项目是一个功能完整的思维导图应用，基于 [simple-mind-map](https://github.com/wanglin2/mind-map) 核心库开发，包含：

- **Web 在线版**：浏览器即可使用，无需安装
- **桌面应用**：基于 Electron，支持 Windows、Mac、Linux
- **一键启动**：提供便捷的启动脚本，快速上手

##  主要特性

- 🎨 **多种结构**：逻辑结构图、思维导图、组织结构图、目录组织图、时间轴、鱼骨图等
- 🎯 **丰富内容**：支持文本、富文本、图片、图标、超链接、备注、标签、数学公式
- ️ **便捷操作**：节点拖拽、画布缩放、多选节点、快捷键支持
-  **导入导出**：支持 JSON、PNG、SVG、PDF、Markdown、XMind、TXT 等格式
- 🔧 **实用工具**：小地图、水印、搜索、关联线、格式刷、演示模式
-  **桌面应用**：完整的离线桌面应用，支持本地文件操作
-  **一键启动**：提供多种启动脚本，开发、生产、打包一应俱全

##  快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
cd web && npm install
```

### 启动方式

本项目提供了一键启动脚本，双击即可运行：

| 启动脚本 | 功能说明 | 使用场景 |
|---------|---------|---------|
| `start-all.bat` | 同时启动 Web + Electron | 完整开发体验 |
| `快速启动.bat` | 启动 Web 开发服务器 + AI 服务 | Web 开发 |
| `启动项目.bat` | 交互式选择启动模式 | 灵活选择 |
| `启动桌面应用.bat` | 仅启动 Electron 桌面应用 | 桌面应用测试 |

### 手动启动

```bash
# 启动 Web 开发服务器
cd web
npm run serve

# 启动桌面应用
cd ..
npm run electron
```

## 📁 项目结构

```
mind-map-0.15.0/
├── simple-mind-map/      # 思维导图核心库
│   ├── src/              # 核心源代码
│   └── package.json      # 核心库配置
├── web/                  # Web 应用
│   ├── src/              # Vue 应用源代码
│   ├── public/           # 静态资源
│   └── package.json      # Web 应用配置
├── electron-main.js      # Electron 主进程
├── electron-preload.js   # Electron 预加载脚本
├── electron-package.json # Electron 配置
├── start-all.bat         # 一键启动脚本（完整版）
├── 快速启动.bat           # 快速启动脚本
── 启动项目.bat           # 交互式启动脚本
├── 启动桌面应用.bat        # 桌面应用启动脚本
├── README.md             # 项目说明
└── LICENSE               # MIT 开源协议
```

## 🔧 构建与打包

### Web 端构建

```bash
cd web
npm run build
```

### 桌面应用打包

```bash
# Windows
npm run build:win

# Mac
npm run build:mac

# Linux
npm run build:linux
```

## 📝 功能说明

### 思维导图功能

- ✅ 支持多种布局结构
- ✅ 节点样式自定义
- ✅ 主题切换
- ✅ 快捷键操作
- ✅ 撤销/重做
- ✅ 节点拖拽排序

### 导出格式

- JSON - 思维导图数据
- PNG - 图片格式
- SVG - 矢量图格式
- PDF - 文档格式
- Markdown - 文本格式
- XMind - XMind 格式
- TXT - 纯文本格式

### 导入格式

- JSON - 从 JSON 文件导入
- XMind - 从 XMind 文件导入
- Markdown - 从 Markdown 文件导入

## 🤝 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

保留 `simple-mind-map` 版权声明和注明来源的情况下可随意商用。

**免责声明**：本项目基于开源项目 [simple-mind-map](https://github.com/wanglin2/mind-map) 开发，感谢原作者的贡献。

## 🙏 致谢

- [simple-mind-map](https://github.com/wanglin2/mind-map) - 优秀的思维导图核心库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [ElementUI](https://element.eleme.io/) - Vue UI 组件库

## 📧 联系方式

如有问题或建议，欢迎提交 Issue。

---

**Happy Coding! 🎉**
