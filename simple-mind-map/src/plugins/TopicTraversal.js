import { walk, bfsWalk, fullScreen, exitFullScreen, fullscreenEvent, getNodeTreeBoundingRect } from '../utils'
import { CONSTANTS } from '../constants/constant'

//  主题遍历插件 - 类似MindMaster/EdrawMind的主题遍历功能
class TopicTraversal {
  //  构造函数
  constructor(opt) {
    this.opt = opt
    this.mindMap = opt.mindMap
    
    // 遍历状态
    this.traversalMode = 'depth' // 'depth' | 'breadth' | 'level'
    this.currentTraversalList = [] // 当前遍历序列
    this.currentIndex = -1 // 当前遍历位置
    this.isTraversing = false // 是否正在遍历模式

    // 全屏遍历模式状态
    this.isInTraversalMode = false
    this.transformState = null
    this.renderTree = null
    this.highlightEl = null
    this.tmpStyleEl = null
    
    this.addShortcut()
    this.bindEvents()
  }

  // 添加快捷键
  addShortcut() {
    this.onEscKeyUp = this.onEscKeyUp.bind(this)

    // Esc: 退出遍历模式
    this.mindMap.keyCommand.addShortcut('Esc', this.onEscKeyUp)
  }

  // 移除快捷键
  removeShortcut() {
    this.mindMap.keyCommand.removeShortcut('Esc', this.onEscKeyUp)
  }

  // 绑定事件
  bindEvents() {
    // 监听节点激活事件，如果不在遍历模式下，清除遍历状态
    this.mindMap.on('node_active', (node, activeNodeList) => {
      if (!this.isTraversing) {
        this.resetTraversal()
      }
    })
  }

  // Esc - 退出遍历模式
  onEscKeyUp() {
    this.exitTraversalMode()
  }

  // 开始遍历
  startTraversal(mode = 'depth', direction = null) {
    this.traversalMode = mode
    this.isTraversing = true

    // 获取当前激活的节点，如果没有则从根节点开始
    let startNode = this.mindMap.renderer.activeNodeList[0] || this.mindMap.renderer.root

    // 根据遍历模式生成遍历序列（包括所有节点，不管是否折叠）
    this.generateTraversalList(startNode, mode, direction)

    // 找到当前节点在遍历序列中的位置
    this.currentIndex = this.findCurrentNodeIndex(startNode)

    // 记录起始节点索引，用于循环遍历
    this.startNodeIndex = this.currentIndex

    // 进入全屏遍历模式
    this.enterTraversalMode()

    // 触发遍历开始事件
    this.mindMap.emit('topic_traversal_start', {
      mode: this.traversalMode,
      direction,
      totalCount: this.currentTraversalList.length,
      currentIndex: this.currentIndex,
      startNodeIndex: this.startNodeIndex
    })
  }

  // 生成遍历序列
  generateTraversalList(startNode, mode, direction) {
    this.currentTraversalList = []
    
    switch (mode) {
      case 'depth':
        this.generateDepthFirstList(startNode)
        break
      case 'breadth':
        this.generateBreadthFirstList(startNode)
        break
      case 'level':
        this.generateLevelList(startNode, direction)
        break
      default:
        this.generateDepthFirstList(startNode)
    }
  }

  // 生成深度优先遍历序列
  generateDepthFirstList(startNode) {
    // 使用renderTree来遍历所有节点（包括折叠的）
    const renderTree = this.mindMap.renderer.renderTree
    if (!renderTree) return

    console.log('开始生成深度优先遍历序列，根节点:', renderTree.data.text)

    // 使用SimpleMindMap的walk函数遍历renderTree，包括折叠的节点
    walk(renderTree, null, (nodeData) => {
      console.log('遍历到节点:', nodeData.data.text, {
        hasNode: !!nodeData._node,
        expand: nodeData.data.expand,
        hasChildren: !!(nodeData.children && nodeData.children.length > 0)
      })

      // 直接使用nodeData的uid来记录，而不依赖_node实例
      this.currentTraversalList.push({
        uid: nodeData.data.uid,
        text: nodeData.data.text,
        nodeData: nodeData
      })
    }, null, true, true) // 最后一个参数true表示包括折叠的节点

    console.log('深度优先遍历序列生成完成，总共', this.currentTraversalList.length, '个节点')
  }

  // 生成广度优先遍历序列
  generateBreadthFirstList(startNode) {
    // 使用renderTree来遍历所有节点（包括折叠的）
    const renderTree = this.mindMap.renderer.renderTree
    if (!renderTree) return

    console.log('开始生成广度优先遍历序列，根节点:', renderTree.data.text)

    // 使用SimpleMindMap的bfsWalk函数遍历renderTree，包括折叠的节点
    bfsWalk(renderTree, (nodeData) => {
      console.log('遍历到节点:', nodeData.data.text, {
        hasNode: !!nodeData._node,
        expand: nodeData.data.expand,
        hasChildren: !!(nodeData.children && nodeData.children.length > 0)
      })

      // 直接使用nodeData的uid来记录，而不依赖_node实例
      this.currentTraversalList.push({
        uid: nodeData.data.uid,
        text: nodeData.data.text,
        nodeData: nodeData
      })
    }, true) // 参数true表示包括折叠的节点

    console.log('广度优先遍历序列生成完成，总共', this.currentTraversalList.length, '个节点')
  }

  // 生成同级遍历序列
  generateLevelList(startNode, direction) {
    if (startNode.isRoot) {
      // 如果是根节点，遍历所有一级子节点
      if (startNode.children && startNode.children.length > 0) {
        this.currentTraversalList = [...startNode.children]
        if (direction === 'left') {
          this.currentTraversalList.reverse()
        }
      }
    } else {
      // 如果不是根节点，遍历同级节点
      const parent = startNode.parent
      if (parent && parent.children) {
        this.currentTraversalList = [...parent.children]
        if (direction === 'left') {
          this.currentTraversalList.reverse()
        }
      }
    }
  }

  // 找到当前节点在遍历序列中的位置
  findCurrentNodeIndex(currentNode) {
    if (!currentNode) return 0
    const currentUid = currentNode.getData('uid')
    return this.currentTraversalList.findIndex(nodeInfo => nodeInfo.uid === currentUid)
  }



  // 下一个主题
  nextTopic() {
    if (!this.isTraversing || this.currentTraversalList.length === 0) {
      // 如果没有在遍历模式，开始深度优先遍历
      this.startTraversal('depth')
      return
    }

    if (this.currentIndex < this.currentTraversalList.length - 1) {
      this.currentIndex++
    } else {
      // 已经是最后一个，循环到第一个
      this.currentIndex = 0
    }
    this.goToCurrentTopic()
    this.updateTraversalInfo()
  }

  // 上一个主题
  previousTopic() {
    if (!this.isTraversing || this.currentTraversalList.length === 0) {
      // 如果没有在遍历模式，开始深度优先遍历
      this.startTraversal('depth')
      return
    }

    if (this.currentIndex > 0) {
      this.currentIndex--
    } else {
      // 已经是第一个，循环到最后一个
      this.currentIndex = this.currentTraversalList.length - 1
    }
    this.goToCurrentTopic()
    this.updateTraversalInfo()
  }

  // 跳转到当前主题
  goToCurrentTopic() {
    console.log('跳转到当前主题', {
      currentIndex: this.currentIndex,
      totalCount: this.currentTraversalList.length,
      hasTargetNode: this.currentIndex >= 0 && this.currentIndex < this.currentTraversalList.length
    })

    if (this.currentIndex >= 0 && this.currentIndex < this.currentTraversalList.length) {
      const targetNodeInfo = this.currentTraversalList[this.currentIndex]
      console.log('目标节点信息:', targetNodeInfo)

      // 清除之前的高亮
      this.clearCurrentHighlight()

      if (targetNodeInfo && targetNodeInfo.uid) {
        // 确保节点可见（如果是折叠状态则展开到该节点）
        const nodeUid = targetNodeInfo.uid
        console.log('展开到节点UID:', nodeUid)

        this.mindMap.renderer.expandToNodeUid(nodeUid, () => {
          const node = this.mindMap.renderer.findNodeByUid(nodeUid)
          console.log('找到的节点实例:', node ? node.nodeData.data.text : 'null')

          if (node) {
            // 等待一帧确保DOM更新完成
            setTimeout(() => {
              // 获取节点边界信息用于调试
              const rbox = node.group.rbox()
              console.log('节点rbox:', rbox)
              console.log('画布尺寸:', this.mindMap.elRect)

              // 先清除所有节点的激活状态
              this.mindMap.renderer.clearActiveNodeList()

              // 激活当前节点
              this.mindMap.renderer.addNodeToActiveList(node)

              // 使用更直接的方法：先移动到节点中心，再进行缩放
              this.mindMap.renderer.moveNodeToCenter(node)

              // 然后使用fit方法进行最终的缩放和居中
              this.mindMap.view.fit(
                () => {
                  const rect = node.group.rbox()
                  console.log('fit调用时的节点边界:', rect)
                  return rect
                },
                true, // enlarge = true，允许放大
                70   // 边距：演示模式的 padding(20) + margin(50) = 70
              )

              console.log('fit调用完成，当前变换状态:', this.mindMap.view.getTransformData())

              // 高亮当前节点
              this.highlightCurrentNode(node)

              // 更新信息显示
              this.updateTraversalInfo()

              // 触发遍历位置改变事件
              this.mindMap.emit('topic_traversal_change', {
                mode: this.traversalMode,
                currentIndex: this.currentIndex,
                totalCount: this.currentTraversalList.length,
                currentNode: node
              })

              console.log('节点聚焦完成:', node.nodeData.data.text)
            }, 50) // 等待50ms确保渲染完成
          } else {
            console.log('无法找到节点实例，UID:', nodeUid)
          }
        })
      }
    } else {
      console.log('无效的遍历索引或空的遍历列表')
    }
  }

  // 高亮当前节点
  highlightCurrentNode(node) {
    console.log('高亮节点:', {
      hasNode: !!node,
      hasGroup: !!(node && node.group),
      nodeText: node ? node.nodeData.data.text : 'null'
    })

    if (node && node.group) {
      node.group.addClass('smm-traversal-current')
      console.log('已添加高亮类')
    } else {
      console.log('无法高亮节点：节点或group不存在')
    }
  }

  // 清除当前高亮
  clearCurrentHighlight() {
    // 移除所有节点的高亮类
    this.currentTraversalList.forEach(nodeInfo => {
      if (nodeInfo && nodeInfo.uid) {
        const node = this.mindMap.renderer.findNodeByUid(nodeInfo.uid)
        if (node && node.group) {
          node.group.removeClass('smm-traversal-current')
        }
      }
    })
  }

  // 进入全屏遍历模式
  enterTraversalMode() {
    this.bindFullscreenEvent()
    // 如果已经全屏了
    if (document.fullscreenElement === this.mindMap.el) {
      this._enterTraversalMode()
    } else {
      // 否则申请全屏
      fullScreen(this.mindMap.el)
    }
  }

  // 实际进入遍历模式
  _enterTraversalMode() {
    this.isInTraversalMode = true

    // 记录遍历前的画布状态
    this.transformState = this.mindMap.view.getTransformData()
    this.renderTree = this.mindMap.getData()

    // 暂停收集历史记录
    this.mindMap.command.pause()

    // 添加遍历模式样式
    this.addTraversalStyles()

    // 创建高亮元素
    this.createHighlightEl()

    // 绑定遍历模式事件
    this.bindTraversalEvents()

    // 等待全屏模式完全生效后再进行聚焦
    setTimeout(() => {
      // 更新画布尺寸信息 - 使用正确的方法名
      if (this.mindMap.getElRectInfo) {
        this.mindMap.getElRectInfo()
      } else if (this.mindMap.resize) {
        this.mindMap.resize()
      }
      console.log('全屏后画布尺寸:', this.mindMap.elRect || '画布尺寸信息不可用')

      // 跳转到当前主题
      this.goToCurrentTopic()
    }, 200) // 等待200ms确保全屏完全生效
  }

  // 退出遍历模式
  exitTraversalMode() {
    if (this.isInTraversalMode) {
      // 退出全屏
      exitFullScreen(this.mindMap.el)

      // 恢复画布状态
      if (this.transformState) {
        this.mindMap.view.setTransformData(this.transformState)
        this.transformState = null
      }

      // 恢复命令收集
      this.mindMap.command.recovery()

      // 移除样式和事件
      this.removeTraversalStyles()
      this.removeHighlightEl()
      this.unbindTraversalEvents()
      this.unbindFullscreenEvent()

      this.isInTraversalMode = false
    }

    this.isTraversing = false
    this.resetTraversal()

    // 触发遍历结束事件
    this.mindMap.emit('topic_traversal_end')
  }

  // 重置遍历状态
  resetTraversal() {
    this.currentTraversalList = []
    this.currentIndex = -1
  }

  // 添加遍历模式样式
  addTraversalStyles() {
    if (this.tmpStyleEl) return

    this.tmpStyleEl = document.createElement('style')
    this.tmpStyleEl.innerHTML = `
      .smm-traversal-mode {
        background: rgba(0, 0, 0, 0.9) !important;
      }
      .smm-traversal-mode .smm-node {
        opacity: 0.1;
        transition: all 0.3s ease;
      }
      .smm-traversal-mode .smm-node.smm-traversal-current {
        opacity: 1 !important;
        transform: scale(1.2);
        filter: brightness(1.2);
      }
      .smm-traversal-mode .smm-node.smm-traversal-current * {
        opacity: 1 !important;
      }
      .smm-traversal-info {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.9);
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 14px;
        color: #333;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      .smm-traversal-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 12px;
        color: #666;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
    `
    document.head.appendChild(this.tmpStyleEl)

    // 添加遍历模式类
    this.mindMap.el.classList.add('smm-traversal-mode')
  }

  // 移除遍历模式样式
  removeTraversalStyles() {
    if (this.tmpStyleEl) {
      document.head.removeChild(this.tmpStyleEl)
      this.tmpStyleEl = null
    }
    this.mindMap.el.classList.remove('smm-traversal-mode')
  }

  // 创建高亮元素
  createHighlightEl() {
    // 创建信息显示元素
    this.infoEl = document.createElement('div')
    this.infoEl.className = 'smm-traversal-info'
    this.mindMap.el.appendChild(this.infoEl)

    // 创建控制提示元素
    this.controlsEl = document.createElement('div')
    this.controlsEl.className = 'smm-traversal-controls'
    this.controlsEl.innerHTML = '鼠标点击: 下一个 | 滚轮: 上下切换 | Esc: 退出'
    this.mindMap.el.appendChild(this.controlsEl)

    this.updateTraversalInfo()
  }

  // 移除高亮元素
  removeHighlightEl() {
    if (this.infoEl) {
      this.mindMap.el.removeChild(this.infoEl)
      this.infoEl = null
    }
    if (this.controlsEl) {
      this.mindMap.el.removeChild(this.controlsEl)
      this.controlsEl = null
    }
  }

  // 绑定全屏事件
  bindFullscreenEvent() {
    if (!this.onFullscreenChange) {
      this.onFullscreenChange = this.handleFullscreenChange.bind(this)
    }
    document.addEventListener(fullscreenEvent, this.onFullscreenChange)
  }

  // 解绑全屏事件
  unbindFullscreenEvent() {
    if (this.onFullscreenChange) {
      document.removeEventListener(fullscreenEvent, this.onFullscreenChange)
      this.onFullscreenChange = null
    }
  }

  // 全屏状态改变处理函数
  handleFullscreenChange() {
    if (document.fullscreenElement === this.mindMap.el) {
      this._enterTraversalMode()
    } else if (this.isInTraversalMode) {
      this.exitTraversalMode()
    }
  }

  // 绑定遍历模式事件
  bindTraversalEvents() {
    // 确保方法存在后再绑定
    if (typeof this.onTraversalClick === 'function') {
      this.boundOnTraversalClick = this.onTraversalClick.bind(this)
      this.mindMap.el.addEventListener('click', this.boundOnTraversalClick)
    }

    if (typeof this.onTraversalWheel === 'function') {
      this.boundOnTraversalWheel = this.onTraversalWheel.bind(this)
      this.mindMap.el.addEventListener('wheel', this.boundOnTraversalWheel)
    }
  }

  // 解绑遍历模式事件
  unbindTraversalEvents() {
    if (this.boundOnTraversalClick) {
      this.mindMap.el.removeEventListener('click', this.boundOnTraversalClick)
      this.boundOnTraversalClick = null
    }
    if (this.boundOnTraversalWheel) {
      this.mindMap.el.removeEventListener('wheel', this.boundOnTraversalWheel)
      this.boundOnTraversalWheel = null
    }
  }

  // 遍历模式点击事件
  onTraversalClick(e) {
    e.preventDefault()
    e.stopPropagation()
    this.nextTopic()
  }

  // 遍历模式滚轮事件
  onTraversalWheel(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.deltaY > 0) {
      this.nextTopic()
    } else {
      this.previousTopic()
    }
  }

  // 更新遍历信息显示
  updateTraversalInfo() {
    if (this.infoEl) {
      const modeText = {
        'depth': '深度优先',
        'breadth': '广度优先',
        'level': '同级遍历'
      }[this.traversalMode] || '深度优先'

      this.infoEl.innerHTML = `
        <div>遍历模式: ${modeText}</div>
        <div>进度: ${this.currentIndex + 1} / ${this.currentTraversalList.length}</div>
      `
    }
  }

  // 获取当前遍历状态
  getTraversalStatus() {
    return {
      isTraversing: this.isTraversing,
      isInTraversalMode: this.isInTraversalMode,
      mode: this.traversalMode,
      currentIndex: this.currentIndex,
      totalCount: this.currentTraversalList.length,
      currentNode: this.currentIndex >= 0 ? this.currentTraversalList[this.currentIndex] : null
    }
  }

  // 插件被移除前做的事情
  beforePluginRemove() {
    this.removeShortcut()
    this.exitTraversalMode()
    this.unbindFullscreenEvent()
  }

  // 插件被卸载前做的事情
  beforePluginDestroy() {
    this.removeShortcut()
    this.exitTraversalMode()
    this.unbindFullscreenEvent()
  }

  // 公共方法：开始主题遍历（供右键菜单等外部调用）
  startTopicTraversal(mode = 'depth', startNode = null) {
    // 如果没有指定起始节点，使用当前激活节点或根节点
    if (!startNode) {
      startNode = this.mindMap.renderer.activeNodeList[0] || this.mindMap.renderer.root
    }

    // 先激活起始节点
    this.mindMap.renderer.clearActiveNodeList()
    this.mindMap.renderer.addNodeToActiveList(startNode)

    // 开始遍历
    this.startTraversal(mode)
  }
}

TopicTraversal.instanceName = 'topicTraversal'

export default TopicTraversal
