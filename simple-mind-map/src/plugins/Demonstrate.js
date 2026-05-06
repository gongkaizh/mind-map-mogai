import {
  walk,
  getNodeTreeBoundingRect,
  fullscreenEvent,
  fullScreen,
  exitFullScreen,
  formatGetNodeGeneralization
} from '../utils/index'
import { keyMap } from '../core/command/keyMap'

const defaultConfig = {
  boxShadowColor: 'rgba(0, 0, 0, 0.8)', // 高亮框四周的区域颜色
  borderRadius: '5px', // 高亮框的圆角大小
  transition: 'all 0.3s ease-out', // 高亮框动画的过渡
  zIndex: 9999, // 高亮框元素的层级
  padding: 20, // 高亮框的内边距
  margin: 50, // 高亮框的外边距
  openBlankMode: true, // 是否开启填空模式，即带下划线的文本默认不显示，按回车键才依次显示
  layeredMode: false // 是否开启分层演示模式，显示两层节点（当前层和上一层），按流程顺序切换
}

// 演示插件
class Demonstrate {
  constructor(opt) {
    this.mindMap = opt.mindMap
    // 是否正在演示中
    this.isInDemonstrate = false
    // 演示的步骤列表
    this.stepList = []
    // 当前所在步骤
    this.currentStepIndex = 0
    // 当前所在步骤对应的节点实例
    this.currentStepNode = null
    // 当前所在步骤节点的下划线文本数据
    this.currentUnderlineTextData = null
    // 临时的样式剩余
    this.tmpStyleEl = null
    // 高亮样式元素
    this.highlightEl = null
    this.transformState = null
    this.renderTree = null
    // 演示起始节点（用于从选中节点开始演示）
    this.startFromNode = null
    // 分层演示模式相关属性
    this.layeredStepList = [] // 分层演示的步骤列表
    this.currentLayeredIndex = 0 // 当前分层演示的索引
    this.config = Object.assign(
      { ...defaultConfig },
      this.mindMap.opt.demonstrateConfig || {}
    )
    this.needRestorePerformanceMode = false
    this.onConfigUpdate = this.onConfigUpdate.bind(this)
    this.mindMap.on('after_update_config', this.onConfigUpdate)
  }

  // 监听配置更新
  onConfigUpdate(opt) {
    if (typeof opt.demonstrateConfig !== 'undefined') {
      this.config = {
        ...this.config,
        ...opt.demonstrateConfig
      }
    }
  }

  // 更新配置
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    }
  }

  // 进入演示模式
  enter() {
    // 全屏
    this.bindFullscreenEvent()
    // 如果已经全屏了
    if (document.fullscreenElement === this.mindMap.el) {
      this._enter()
    } else {
      // 否则申请全屏
      fullScreen(this.mindMap.el)
    }
  }

  // 从当前选中节点开始进入演示模式
  enterFromCurrentNode() {
    // 检查是否有选中的节点
    const activeNodeList = this.mindMap.renderer.activeNodeList
    if (!activeNodeList || activeNodeList.length === 0) {
      // 如果没有选中节点，提示用户
      this.mindMap.emit('demonstrate_error', '请先选中一个节点作为演示起点')
      return
    }
    // 记录起始节点
    this.startFromNode = activeNodeList[0]
    // 全屏
    this.bindFullscreenEvent()
    // 如果已经全屏了
    if (document.fullscreenElement === this.mindMap.el) {
      this._enterFromCurrentNode()
    } else {
      // 否则申请全屏
      fullScreen(this.mindMap.el)
    }
  }

  _enter() {
    this.isInDemonstrate = true
    // 如果开启了性能模式，那么需要暂停
    this.pausePerformanceMode()
    // 添加演示用的临时的样式
    this.addTmpStyles()
    // 记录演示前的画布状态
    this.transformState = this.mindMap.view.getTransformData()
    // 记录演示前的画布数据
    this.renderTree = this.mindMap.getData()
    // 暂停收集历史记录
    this.mindMap.command.pause()
    // 暂停思维导图快捷键响应
    this.mindMap.keyCommand.pause()
    // 创建高亮元素
    this.createHighlightEl()
    // 根据配置选择演示模式
    if (this.config.layeredMode) {
      // 计算分层演示步骤数据
      this.getLayeredStepList()
    } else {
      // 计算传统演示步骤数据
      this.getStepList()
    }
    // 收起所有节点
    let wait = false
    if (this.mindMap.renderer.isRendering) {
      wait = true
    }
    this.mindMap.execCommand('UNEXPAND_ALL', false)
    const onRenderEnd = () => {
      if (wait) {
        wait = false
        return
      }
      this.mindMap.off('node_tree_render_end', onRenderEnd)
      // 聚焦到第一步
      this.jump(this.currentStepIndex)
      this.bindEvent()
    }
    this.mindMap.on('node_tree_render_end', onRenderEnd)
  }

  // 从当前选中节点开始进入演示模式的内部方法
  _enterFromCurrentNode() {
    this.isInDemonstrate = true
    // 如果开启了性能模式，那么需要暂停
    this.pausePerformanceMode()
    // 添加演示用的临时的样式
    this.addTmpStyles()
    // 记录演示前的画布状态
    this.transformState = this.mindMap.view.getTransformData()
    // 记录演示前的画布数据
    this.renderTree = this.mindMap.getData()
    // 暂停收集历史记录
    this.mindMap.command.pause()
    // 暂停思维导图快捷键响应
    this.mindMap.keyCommand.pause()
    // 创建高亮元素
    this.createHighlightEl()
    // 根据配置选择演示模式
    if (this.config.layeredMode) {
      // 计算从选中节点开始的分层演示步骤数据
      this.getLayeredStepListFromNode(this.startFromNode)
    } else {
      // 计算从选中节点开始的传统演示步骤数据
      this.getStepListFromNode(this.startFromNode)
    }
    // 收起所有节点
    let wait = false
    if (this.mindMap.renderer.isRendering) {
      wait = true
    }
    this.mindMap.execCommand('UNEXPAND_ALL', false)
    const onRenderEnd = () => {
      if (wait) {
        wait = false
        return
      }
      this.mindMap.off('node_tree_render_end', onRenderEnd)
      // 聚焦到第一步
      this.jump(this.currentStepIndex)
      this.bindEvent()
    }
    this.mindMap.on('node_tree_render_end', onRenderEnd)
  }

  // 退出演示模式
  exit() {
    exitFullScreen(this.mindMap.el)
    this.mindMap.updateData(this.renderTree)
    this.mindMap.view.setTransformData(this.transformState)
    this.renderTree = null
    this.transformState = null
    this.stepList = []
    this.currentStepIndex = 0
    this.currentStepNode = null
    this.currentUnderlineTextData = null
    this.startFromNode = null
    // 清理分层演示模式状态
    this.layeredStepList = []
    this.currentLayeredIndex = 0
    this.unBindEvent()
    this.removeTmpStyles()
    this.removeHighlightEl()
    this.mindMap.command.recovery()
    this.mindMap.keyCommand.recovery()
    this.restorePerformanceMode()
    this.mindMap.emit('exit_demonstrate')
    this.isInDemonstrate = false
  }

  // 暂停性能模式
  pausePerformanceMode() {
    const { openPerformance } = this.mindMap.opt
    if (openPerformance) {
      this.needRestorePerformanceMode = true
      this.mindMap.opt.openPerformance = false
      this.mindMap.renderer.forceLoadNode()
    }
  }

  // 恢复性能模式
  restorePerformanceMode() {
    if (!this.needRestorePerformanceMode) return
    this.mindMap.opt.openPerformance = true
    this.mindMap.renderer.forceLoadNode()
  }

  // 添加临时的样式
  addTmpStyles() {
    this.tmpStyleEl = document.createElement('style')
    let cssText = `
      /* 画布所有元素禁止响应鼠标事件 */
      .smm-mind-map-container {
        pointer-events: none;
      }
      /* 超链接图标允许响应鼠标事件 */
      .smm-node a {
        pointer-events: all;
      }
      /* 备注图标允许响应鼠标事件 */
      .smm-node .smm-node-note {
        pointer-events: all;
      }
    `
    if (this.config.openBlankMode) {
      cssText += `
        /* 带下划线的文本内容全部隐藏 */
        .smm-richtext-node-wrap u {
          opacity: 0;
        }
      `
    }
    this.tmpStyleEl.innerText = cssText
    document.head.appendChild(this.tmpStyleEl)
  }

  // 移除临时的样式
  removeTmpStyles() {
    if (this.tmpStyleEl) document.head.removeChild(this.tmpStyleEl)
  }

  // 创建高亮元素
  createHighlightEl() {
    if (!this.highlightEl) {
      // 高亮元素
      this.highlightEl = document.createElement('div')
      this.highlightEl.style.cssText = `
            position: absolute;
            box-shadow: 0 0 0 5000px ${this.config.boxShadowColor};
            border-radius: ${this.config.borderRadius};
            transition: ${this.config.transition};
            z-index: ${this.config.zIndex + 1};
            pointer-events: none;
        `
      this.mindMap.el.appendChild(this.highlightEl)
    }
    // 创建起始节点标识元素
    if (!this.startNodeIndicator) {
      this.startNodeIndicator = document.createElement('div')
      this.startNodeIndicator.style.cssText = `
            position: absolute;
            background: linear-gradient(45deg, #ff6b6b, #ffa500);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: ${this.config.zIndex + 2};
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s ease;
            transform: translateY(-10px);
        `
      this.startNodeIndicator.textContent = this.startFromNode ? '起始节点' : '根节点'
      this.mindMap.el.appendChild(this.startNodeIndicator)
    }
  }

  // 移除高亮元素
  removeHighlightEl() {
    if (this.highlightEl) {
      this.mindMap.el.removeChild(this.highlightEl)
      this.highlightEl = null
    }
    // 移除起始节点标识元素
    if (this.startNodeIndicator) {
      this.mindMap.el.removeChild(this.startNodeIndicator)
      this.startNodeIndicator = null
    }
  }

  // 更新高亮元素的位置和大小
  updateHighlightEl({ left, top, width, height }) {
    const padding = this.config.padding
    if (left) {
      this.highlightEl.style.left = left - padding + 'px'
    }
    if (top) {
      this.highlightEl.style.top = top - padding + 'px'
    }
    if (width) {
      this.highlightEl.style.width = width + padding * 2 + 'px'
    }
    if (height) {
      this.highlightEl.style.height = height + padding * 2 + 'px'
    }
    
    // 更新起始节点标识的位置
    this.updateStartNodeIndicator({ left, top, width, height })
  }
  
  // 更新起始节点标识的位置
  updateStartNodeIndicator({ left, top, width, height }) {
    if (!this.startNodeIndicator) return
    
    // 检查当前是否为起始节点
    const isStartNode = this.isCurrentStepStartNode()
    
    if (isStartNode) {
      // 显示起始节点标识，位置在高亮框的右上角
      this.startNodeIndicator.style.left = (left + width - 10) + 'px'
      this.startNodeIndicator.style.top = (top - 35) + 'px'
      this.startNodeIndicator.style.opacity = '1'
      this.startNodeIndicator.style.transform = 'translateY(0)'
    } else {
      // 隐藏起始节点标识
      this.startNodeIndicator.style.opacity = '0'
      this.startNodeIndicator.style.transform = 'translateY(-10px)'
    }
  }
  
  // 检查当前步骤是否为起始节点
  isCurrentStepStartNode() {
    if (this.stepList.length === 0 || this.currentStepIndex < 0) return false
    
    const currentStep = this.stepList[this.currentStepIndex]
    if (!currentStep || currentStep.type !== 'node') return false
    
    // 如果是从当前节点开始的演示，检查是否为起始节点
    if (this.startFromNode) {
      return currentStep.node.data.uid === this.startFromNode.nodeData.data.uid
    } else {
      // 如果是从根节点开始的演示，检查是否为根节点
      return currentStep.node.data.uid === this.mindMap.renderer.renderTree.data.uid
    }
  }

  // 绑定事件
  bindEvent() {
    // 重新绑定方法，防止之前被设置为null
    this.onKeydown = this.constructor.prototype.onKeydown.bind(this)
    this.onDemonstrateClick = this.constructor.prototype.onDemonstrateClick.bind(this)
    this.onDemonstrateWheel = this.constructor.prototype.onDemonstrateWheel.bind(this)

    window.addEventListener('keydown', this.onKeydown)
    this.mindMap.el.addEventListener('click', this.onDemonstrateClick)
    this.mindMap.el.addEventListener('wheel', this.onDemonstrateWheel)
  }

  // 绑定全屏事件
  bindFullscreenEvent() {
    this.onFullscreenChange = this.onFullscreenChange.bind(this)
    document.addEventListener(fullscreenEvent, this.onFullscreenChange)
  }

  // 解绑事件
  unBindEvent() {
    window.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener(fullscreenEvent, this.onFullscreenChange)

    if (this.onDemonstrateClick) {
      this.mindMap.el.removeEventListener('click', this.onDemonstrateClick)
      this.onDemonstrateClick = null
    }
    if (this.onDemonstrateWheel) {
      this.mindMap.el.removeEventListener('wheel', this.onDemonstrateWheel)
      this.onDemonstrateWheel = null
    }
  }

  // 全屏状态改变
  onFullscreenChange() {
    if (!document.fullscreenElement) {
      this.exit()
    } else if (document.fullscreenElement === this.mindMap.el) {
      // 如果有起始节点，说明是从选中节点开始的演示
      if (this.startFromNode) {
        this._enterFromCurrentNode()
      } else {
        this._enter()
      }
    }
  }

  // 按键事件
  onKeydown(e) {
    // 上一个
    if (e.keyCode === keyMap.Left) {
      this.prev()
    } else if (e.keyCode === keyMap.Right) {
      // 下一个
      this.next()
    } else if (e.keyCode === keyMap.Esc) {
      // 退出演示
      this.exit()
    } else if (e.keyCode === keyMap.Enter) {
      // 回车键显示隐藏的下划线文本
      this.showNextUnderlineText()
    }
  }

  // 演示模式鼠标点击事件
  onDemonstrateClick(e) {
    e.preventDefault()
    e.stopPropagation()
    this.next()
  }

  // 演示模式滚轮事件
  onDemonstrateWheel(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.deltaY > 0) {
      this.next()
    } else {
      this.prev()
    }
  }

  // 上一张
  prev() {
    if (this.config.layeredMode) {
      // 分层演示模式
      if (this.currentLayeredIndex > 0) {
        this.jump(this.currentLayeredIndex - 1)
      } else {
        // 已经是第一个，循环到最后一个
        this.jump(this.layeredStepList.length - 1)
      }
    } else {
      // 传统演示模式
      if (this.currentStepIndex > 0) {
        this.jump(this.currentStepIndex - 1)
      } else {
        // 已经是第一个，循环到最后一个
        this.jump(this.stepList.length - 1)
      }
    }
  }

  // 下一张
  next() {
    if (this.config.layeredMode) {
      // 分层演示模式
      const stepLength = this.layeredStepList.length
      if (this.currentLayeredIndex < stepLength - 1) {
        this.jump(this.currentLayeredIndex + 1)
      } else {
        // 已经是最后一个，循环到第一个
        this.jump(0)
      }
    } else {
      // 传统演示模式
      const stepLength = this.stepList.length
      if (this.currentStepIndex < stepLength - 1) {
        this.jump(this.currentStepIndex + 1)
      } else {
        // 已经是最后一个，循环到第一个
        this.jump(0)
      }
    }
  }

  // 显示隐藏的下划线文本
  showNextUnderlineText() {
    if (
      !this.config.openBlankMode ||
      !this.currentStepNode ||
      !this.currentUnderlineTextData
    )
      return
    const { index, list, length } = this.currentUnderlineTextData
    if (index >= length) return
    const node = list[index]
    this.currentUnderlineTextData.index++
    node.node.style.opacity = 1
  }

  // 跳转到某一张
  jump(index) {
    // 移除该当前下划线元素设置的样式
    if (this.currentUnderlineTextData) {
      this.currentUnderlineTextData.list.forEach(item => {
        item.node.style.opacity = ''
      })
      this.currentUnderlineTextData = null
    }
    this.currentStepNode = null
    
    // 根据演示模式选择不同的跳转逻辑
    if (this.config.layeredMode) {
      this.jumpLayered(index)
      return
    }
    
    // 传统演示模式的跳转逻辑
    this.currentStepIndex = index
    this.mindMap.emit(
      'demonstrate_jump',
      this.currentStepIndex,
      this.stepList.length
    )
    const step = this.stepList[index]
    // 这一步的节点数据
    const nodeData = step.node
    // 该节点的uid
    const uid = nodeData.data.uid
    // 根据uid在画布上找到该节点实例
    const node = this.mindMap.renderer.findNodeByUid(uid)
    // 如果该节点实例不存在，那么先展开到该节点
    if (!node) {
      this.mindMap.renderer.expandToNodeUid(uid, () => {
        const node = this.mindMap.renderer.findNodeByUid(uid)
        // 展开后还是没找到，那么就别进入了，否则会死循环
        if (node) {
          this.jump(index)
        }
      })
      return
    }
    // 1.聚焦到某个节点
    if (step.type === 'node') {
      this.currentStepNode = node
      // 当前节点存在带下划线的文本内容
      const uNodeList = this.config.openBlankMode ? node.group.find('u') : null
      if (uNodeList && uNodeList.length > 0) {
        this.currentUnderlineTextData = {
          index: 0,
          list: uNodeList,
          length: uNodeList.length
        }
      }
      // 适应画布大小
      this.mindMap.view.fit(
        () => {
          return node.group.rbox()
        },
        true,
        this.config.padding + this.config.margin
      )
      const rect = node.group.rbox()
      this.updateHighlightEl({
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height
      })
    } else {
      // 2.聚焦到某个节点的所有子节点
      // 聚焦该节点的所有子节点
      const task = () => {
        // 先收起该节点所有子节点的子节点
        nodeData.children.forEach(item => {
          item.data.expand = false
        })
        this.mindMap.render(() => {
          // 适应画布大小
          this.mindMap.view.fit(
            () => {
              const res = getNodeTreeBoundingRect(node, 0, 0, 0, 0, true)
              return {
                ...res,
                x: res.left,
                y: res.top
              }
            },
            true,
            this.config.padding + this.config.margin
          )
          const res = getNodeTreeBoundingRect(node, 0, 0, 0, 0, true)
          this.updateHighlightEl(res)
        })
      }
      // 如果该节点是收起状态，那么需要先展开
      if (!nodeData.data.expand) {
        this.mindMap.execCommand('SET_NODE_EXPAND', node, true)
        const onRenderEnd = () => {
          this.mindMap.off('node_tree_render_end', onRenderEnd)
          task()
        }
        this.mindMap.on('node_tree_render_end', onRenderEnd)
      } else {
        // 否则直接聚焦
        task()
      }
    }
  }

  // 深度度优先遍历所有节点，返回步骤列表
  getStepList() {
    walk(this.mindMap.renderer.renderTree, null, node => {
      this.stepList.push({
        type: 'node',
        node
      })
      // 添加概要步骤
      const generalizationList = formatGetNodeGeneralization(node.data)
      generalizationList.forEach(item => {
        // 没有uid的直接过滤掉，否则会死循环
        if (item.uid) {
          this.stepList.push({
            type: 'node',
            node: {
              data: item
            }
          })
        }
      })
      if (node.children.length > 1) {
        this.stepList.push({
          type: 'children',
          node
        })
      }
    })
  }

  // 从指定节点开始深度优先遍历，返回步骤列表
  getStepListFromNode(startNode) {
    // 首先找到起始节点在渲染树中对应的数据节点
    const findNodeInRenderTree = (renderTree, targetUid) => {
      if (renderTree.data.uid === targetUid) {
        return renderTree
      }
      for (let child of renderTree.children || []) {
        const found = findNodeInRenderTree(child, targetUid)
        if (found) return found
      }
      return null
    }

    const startNodeData = findNodeInRenderTree(this.mindMap.renderer.renderTree, startNode.nodeData.data.uid)
    if (!startNodeData) {
      // 如果找不到起始节点，回退到从根节点开始
      this.getStepList()
      return
    }

    // 从起始节点开始遍历
    walk(startNodeData, null, node => {
      this.stepList.push({
        type: 'node',
        node
      })
      // 添加概要步骤
      const generalizationList = formatGetNodeGeneralization(node.data)
      generalizationList.forEach(item => {
        // 没有uid的直接过滤掉，否则会死循环
        if (item.uid) {
          this.stepList.push({
            type: 'node',
            node: {
              data: item
            }
          })
        }
      })
      if (node.children.length > 1) {
        this.stepList.push({
          type: 'children',
          node
        })
      }
    })
  }

  // 生成分层演示步骤列表（从根节点开始）
  // 作者：AI Assistant
  // 日期：2025-01-06
  getLayeredStepList() {
    this.layeredStepList = []
    this.generateLayeredSteps(this.mindMap.renderer.renderTree, 0)
  }

  // 从指定节点开始生成分层演示步骤列表
  // 作者：AI Assistant
  // 日期：2025-01-06
  getLayeredStepListFromNode(startNode) {
    // 首先找到起始节点在渲染树中对应的数据节点
    const findNodeInRenderTree = (renderTree, targetUid) => {
      if (renderTree.data.uid === targetUid) {
        return renderTree
      }
      for (let child of renderTree.children || []) {
        const found = findNodeInRenderTree(child, targetUid)
        if (found) return found
      }
      return null
    }

    const startNodeData = findNodeInRenderTree(this.mindMap.renderer.renderTree, startNode.nodeData.data.uid)
    if (!startNodeData) {
      // 如果找不到起始节点，回退到从根节点开始
      this.getLayeredStepList()
      return
    }

    this.layeredStepList = []
    this.generateLayeredSteps(startNodeData, 0)
  }

  // 递归生成分层演示步骤
  // 作者：AI Assistant
  // 日期：2025-01-06
  generateLayeredSteps(node, level) {
    // 添加当前节点
    this.layeredStepList.push({
      type: 'layered_node',
      node: node,
      level: level
    })

    // 按顺序添加子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.generateLayeredSteps(child, level + 1)
      })
    }
  }

  // 分层演示模式的跳转逻辑
  // 作者：AI Assistant
  // 日期：2025-01-06
  jumpLayered(index) {
    this.currentLayeredIndex = index
    this.mindMap.emit(
      'demonstrate_jump',
      this.currentLayeredIndex,
      this.layeredStepList.length
    )
    
    const step = this.layeredStepList[index]
    if (!step) return
    
    const nodeData = step.node
    const uid = nodeData.data.uid
    const currentLevel = step.level
    
    // 根据uid在画布上找到该节点实例
    const node = this.mindMap.renderer.findNodeByUid(uid)
    if (!node) {
      this.mindMap.renderer.expandToNodeUid(uid, () => {
        const node = this.mindMap.renderer.findNodeByUid(uid)
        if (node) {
          this.jumpLayered(index)
        }
      })
      return
    }
    
    this.currentStepNode = node
    
    // 处理下划线文本
    const uNodeList = this.config.openBlankMode ? node.group.find('u') : null
    if (uNodeList && uNodeList.length > 0) {
      this.currentUnderlineTextData = {
        index: 0,
        list: uNodeList,
        length: uNodeList.length
      }
    }
    
    // 展开当前节点和父节点，收起其他节点
    this.setupLayeredDisplay(nodeData, currentLevel)
    
    // 等待渲染完成后聚焦
    const onRenderEnd = () => {
      this.mindMap.off('node_tree_render_end', onRenderEnd)
      this.focusLayeredNode(node, nodeData, currentLevel)
    }
    this.mindMap.on('node_tree_render_end', onRenderEnd)
    this.mindMap.render()
  }
  
  // 设置分层显示状态
  // 作者：AI Assistant
  // 日期：2025-01-06
  setupLayeredDisplay(targetNode, targetLevel) {
    // 获取当前节点的路径（从根节点到当前节点）
    const getNodePath = (node, target, path = []) => {
      path.push(node)
      if (node.data.uid === target.data.uid) {
        return path
      }
      if (node.children) {
        for (let child of node.children) {
          const result = getNodePath(child, target, [...path])
          if (result) return result
        }
      }
      return null
    }
    
    const nodePath = getNodePath(this.mindMap.renderer.renderTree, targetNode)
    if (!nodePath) return
    
    // 递归设置节点展开状态
    const setNodeExpandState = (node, level) => {
      const isInPath = nodePath.some(pathNode => pathNode.data.uid === node.data.uid)
      const isCurrentNode = node.data.uid === targetNode.data.uid
      
      if (level <= targetLevel && isInPath) {
        // 路径上的节点都需要展开
        node.data.expand = true
        
        if (node.children) {
          node.children.forEach(child => {
            const childIsInPath = nodePath.some(pathNode => pathNode.data.uid === child.data.uid)
            if (level < targetLevel && childIsInPath) {
              // 如果子节点在路径中且当前层级小于目标层级，继续递归
              setNodeExpandState(child, level + 1)
            } else if (level === targetLevel && isCurrentNode) {
              // 当前节点的子节点全部收起
              child.data.expand = false
            } else if (level < targetLevel) {
              // 路径上非目标节点的其他子节点收起
              if (!childIsInPath) {
                child.data.expand = false
              } else {
                setNodeExpandState(child, level + 1)
              }
            }
          })
        }
      } else {
        // 不在路径上的节点收起
        node.data.expand = false
        if (node.children) {
          node.children.forEach(child => {
            child.data.expand = false
          })
        }
      }
    }
    
    setNodeExpandState(this.mindMap.renderer.renderTree, 0)
  }
  
  // 聚焦分层节点
  // 作者：AI Assistant
  // 日期：2025-01-06
  focusLayeredNode(node, nodeData, level) {
    // 等待一小段时间确保节点渲染完成
    setTimeout(() => {
      // 计算需要显示的区域（只包含当前节点和上一层节点）
      let displayNodes = [node]
      let parentNodeInstance = null

      // 如果不是根节点，添加父节点到显示区域
      if (level > 0) {
        let parentNode = this.findParentNode(nodeData)
        if (parentNode) {
          parentNodeInstance = this.mindMap.renderer.findNodeByUid(parentNode.data.uid)
          if (parentNodeInstance) {
            displayNodes.unshift(parentNodeInstance)
          }
        }
      }

      // 验证所有节点都存在且已渲染
      const validNodes = displayNodes.filter(nodeInstance => {
        try {
          const rect = nodeInstance.group.rbox()
          return rect && rect.width > 0 && rect.height > 0
        } catch (e) {
          return false
        }
      })

      if (validNodes.length === 0) {
        // 如果没有有效节点，延迟重试
        setTimeout(() => this.focusLayeredNode(node, nodeData, level), 200)
        return
      }

      // 计算显示区域的边界（只考虑有效的节点）
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      validNodes.forEach(nodeInstance => {
        const rect = nodeInstance.group.rbox()
        minX = Math.min(minX, rect.x)
        minY = Math.min(minY, rect.y)
        maxX = Math.max(maxX, rect.x + rect.width)
        maxY = Math.max(maxY, rect.y + rect.height)
      })

      // 确保边界值有效
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        // 如果边界值无效，使用当前节点的边界
        const rect = node.group.rbox()
        minX = rect.x
        minY = rect.y
        maxX = rect.x + rect.width
        maxY = rect.y + rect.height
      }

      // 计算显示区域的尺寸
      const displayWidth = maxX - minX
      const displayHeight = maxY - minY
      const canvasWidth = this.mindMap.width
      const canvasHeight = this.mindMap.height

      // 动态计算边距，确保节点完全可见
      let dynamicPadding = Math.min(
        this.config.padding + this.config.margin,
        Math.min(canvasWidth, canvasHeight) * 0.1
      )

      // 如果显示区域太大，减少边距
      if (displayWidth > canvasWidth * 0.7 || displayHeight > canvasHeight * 0.7) {
        dynamicPadding = Math.min(dynamicPadding, 30)
      }

      // 使用fit方法将节点组合居中显示在全屏中
      this.mindMap.view.fit(
        () => {
          return {
            x: minX - dynamicPadding,
            y: minY - dynamicPadding,
            width: Math.max(displayWidth + dynamicPadding * 2, 200),
            height: Math.max(displayHeight + dynamicPadding * 2, 120)
          }
        },
        true,
        0 // 不使用额外边距，因为已经在计算中包含
      )

      // 延迟更新高亮，确保fit操作完成，只高亮当前节点
      setTimeout(() => {
        try {
          const rect = node.group.rbox()
          this.updateHighlightEl({
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height
          })
        } catch (e) {
          console.warn('更新高亮框失败:', e)
        }
      }, 150)
    }, 50)
  }
  
  // 查找父节点
  // 作者：AI Assistant
  // 日期：2025-01-06
  findParentNode(targetNode) {
    const findParent = (node, target) => {
      if (node.children) {
        for (let child of node.children) {
          if (child.data.uid === target.data.uid) {
            return node
          }
          const found = findParent(child, target)
          if (found) return found
        }
      }
      return null
    }
    
    return findParent(this.mindMap.renderer.renderTree, targetNode)
  }

  // 插件被移除前做的事情
  beforePluginRemove() {
    this.unBindEvent()
    this.mindMap.off('after_update_config', this.onConfigUpdate)
  }

  // 插件被卸载前做的事情
  beforePluginDestroy() {
    this.unBindEvent()
    this.mindMap.off('after_update_config', this.onConfigUpdate)
  }
}

Demonstrate.instanceName = 'demonstrate'

export default Demonstrate
