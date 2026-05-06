<template>
  <div
    class="editContainer"
    @dragenter.stop.prevent="onDragenter"
    @dragleave.stop.prevent
    @dragover.stop.prevent
    @drop.stop.prevent
  >
    <div
      class="mindMapContainer"
      id="mindMapContainer"
      ref="mindMapContainer"
    ></div>
    <Count :mindMap="mindMap" v-if="!isZenMode"></Count>
    <Navigator v-if="mindMap" :mindMap="mindMap"></Navigator>
    <NavigatorToolbar :mindMap="mindMap" v-if="!isZenMode"></NavigatorToolbar>
    <OutlineSidebar :mindMap="mindMap"></OutlineSidebar>
    <Style v-if="mindMap && !isZenMode" :mindMap="mindMap"></Style>
    <BaseStyle
      :data="mindMapData"
      :configData="mindMapConfig"
      :mindMap="mindMap"
    ></BaseStyle>
    <AssociativeLineStyle
      v-if="mindMap"
      :mindMap="mindMap"
    ></AssociativeLineStyle>
    <Theme v-if="mindMap" :data="mindMapData" :mindMap="mindMap"></Theme>
    <Structure :mindMap="mindMap"></Structure>
    <ShortcutKey></ShortcutKey>
    <Contextmenu v-if="mindMap" :mindMap="mindMap"></Contextmenu>
    <RichTextToolbar v-if="mindMap" :mindMap="mindMap"></RichTextToolbar>
    <NodeNoteContentShow
      v-if="mindMap"
      :mindMap="mindMap"
    ></NodeNoteContentShow>
    <NodeImgPreview v-if="mindMap" :mindMap="mindMap"></NodeImgPreview>
    <SidebarTrigger v-if="!isZenMode"></SidebarTrigger>
    <Search v-if="mindMap" :mindMap="mindMap"></Search>
    <NodeIconSidebar v-if="mindMap" :mindMap="mindMap"></NodeIconSidebar>
    <NodeIconToolbar v-if="mindMap" :mindMap="mindMap"></NodeIconToolbar>
    <OutlineEdit v-if="mindMap" :mindMap="mindMap"></OutlineEdit>
    <Scrollbar v-if="isShowScrollbar && mindMap" :mindMap="mindMap"></Scrollbar>
    <FormulaSidebar v-if="mindMap" :mindMap="mindMap"></FormulaSidebar>
    <NodeOuterFrame v-if="mindMap" :mindMap="mindMap"></NodeOuterFrame>
    <NodeTagStyle v-if="mindMap" :mindMap="mindMap"></NodeTagStyle>
    <Setting :configData="mindMapConfig" :mindMap="mindMap"></Setting>
    <NodeImgPlacementToolbar
      v-if="mindMap"
      :mindMap="mindMap"
    ></NodeImgPlacementToolbar>
    <NodeNoteSidebar v-if="mindMap" :mindMap="mindMap"></NodeNoteSidebar>
    <AiCreate v-if="mindMap && enableAi" :mindMap="mindMap"></AiCreate>
    <AiChat v-if="enableAi"></AiChat>
    <AiSuggest v-if="mindMap && enableAi" :mindMap="mindMap"></AiSuggest>
    <AiExplain v-if="mindMap && enableAi" :mindMap="mindMap" ref="aiExplain"></AiExplain>
    <TopicTraversalPanel v-if="mindMap" :mindMap="mindMap"></TopicTraversalPanel>
    <div
      class="dragMask"
      v-if="showDragMask"
      @dragleave.stop.prevent="onDragleave"
      @dragover.stop.prevent
      @drop.stop.prevent="onDrop"
    >
      <div class="dragTip">{{ $t('edit.dragTip') }}</div>
    </div>
  </div>
</template>

<script>
import MindMap from 'simple-mind-map'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Watermark from 'simple-mind-map/src/plugins/Watermark.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import TopicTraversal from 'simple-mind-map/src/plugins/TopicTraversal.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import ExportFreeMind from 'simple-mind-map/src/plugins/ExportFreeMind.js'
import ExportEdrawMind from 'simple-mind-map/src/plugins/ExportEdrawMind.js'
import ExportMindManager from 'simple-mind-map/src/plugins/ExportMindManager.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import RichText from 'simple-mind-map/src/plugins/RichText.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import NodeImgAdjust from 'simple-mind-map/src/plugins/NodeImgAdjust.js'
import SearchPlugin from 'simple-mind-map/src/plugins/Search.js'
import Painter from 'simple-mind-map/src/plugins/Painter.js'
import ScrollbarPlugin from 'simple-mind-map/src/plugins/Scrollbar.js'
import Formula from 'simple-mind-map/src/plugins/Formula.js'
import RainbowLines from 'simple-mind-map/src/plugins/RainbowLines.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'
import OuterFrame from 'simple-mind-map/src/plugins/OuterFrame.js'
import MindMapLayoutPro from 'simple-mind-map/src/plugins/MindMapLayoutPro.js'
import NodeBase64ImageStorage from 'simple-mind-map/src/plugins/NodeBase64ImageStorage.js'
import Themes from 'simple-mind-map-plugin-themes'
// 协同编辑插件
// import Cooperate from 'simple-mind-map/src/plugins/Cooperate.js'
import OutlineSidebar from './OutlineSidebar.vue'
import Style from './Style.vue'
import BaseStyle from './BaseStyle.vue'
import Theme from './Theme.vue'
import Structure from './Structure.vue'
import Count from './Count.vue'
import NavigatorToolbar from './NavigatorToolbar.vue'
import ShortcutKey from './ShortcutKey.vue'
import Contextmenu from './Contextmenu.vue'
import RichTextToolbar from './RichTextToolbar.vue'
import NodeNoteContentShow from './NodeNoteContentShow.vue'
import { getData, getConfig, storeData } from '@/api'
import Navigator from './Navigator.vue'
import NodeImgPreview from './NodeImgPreview.vue'
import SidebarTrigger from './SidebarTrigger.vue'
import { mapState } from 'vuex'
import icon from '@/config/icon'
import Vue from 'vue'
import Search from './Search.vue'
import NodeIconSidebar from './NodeIconSidebar.vue'
import NodeIconToolbar from './NodeIconToolbar.vue'
import OutlineEdit from './OutlineEdit.vue'
import { showLoading, hideLoading } from '@/utils/loading'
import handleClipboardText from '@/utils/handleClipboardText'
import { getParentWithClass } from '@/utils'
import Scrollbar from './Scrollbar.vue'
import exampleData from 'simple-mind-map/example/exampleData'
import FormulaSidebar from './FormulaSidebar.vue'
import NodeOuterFrame from './NodeOuterFrame.vue'
import NodeTagStyle from './NodeTagStyle.vue'
import Setting from './Setting.vue'
import AssociativeLineStyle from './AssociativeLineStyle.vue'
import NodeImgPlacementToolbar from './NodeImgPlacementToolbar.vue'
import NodeNoteSidebar from './NodeNoteSidebar.vue'
import AiCreate from './AiCreate.vue'
import AiChat from './AiChat.vue'
import AiSuggest from './AiSuggest.vue'
import AiExplain from './AiExplain.vue'
import TopicTraversalPanel from './TopicTraversalPanel.vue'

// 注册插件
MindMap.usePlugin(MiniMap)
  .usePlugin(Watermark)
  .usePlugin(Drag)
  .usePlugin(KeyboardNavigation)
  .usePlugin(TopicTraversal)
  .usePlugin(ExportPDF)
  .usePlugin(ExportXMind)
  .usePlugin(Export)
  .usePlugin(ExportFreeMind)
  .usePlugin(ExportEdrawMind)
  .usePlugin(ExportMindManager)
  .usePlugin(Select)
  .usePlugin(AssociativeLine)
  .usePlugin(NodeImgAdjust)
  .usePlugin(TouchEvent)
  .usePlugin(SearchPlugin)
  .usePlugin(Painter)
  .usePlugin(Formula)
  .usePlugin(RainbowLines)
  .usePlugin(Demonstrate)
  .usePlugin(OuterFrame)
  .usePlugin(MindMapLayoutPro)
  .usePlugin(NodeBase64ImageStorage)
// .usePlugin(Cooperate) // 协同插件

// 注册主题
Themes.init(MindMap)
// 扩展主题列表
if (typeof MoreThemes !== 'undefined') {
  MoreThemes.init(MindMap)
}

export default {
  components: {
    OutlineSidebar,
    Style,
    BaseStyle,
    Theme,
    Structure,
    Count,
    NavigatorToolbar,
    ShortcutKey,
    Contextmenu,
    RichTextToolbar,
    NodeNoteContentShow,
    Navigator,
    NodeImgPreview,
    SidebarTrigger,
    Search,
    NodeIconSidebar,
    NodeIconToolbar,
    OutlineEdit,
    Scrollbar,
    FormulaSidebar,
    NodeOuterFrame,
    NodeTagStyle,
    Setting,
    AssociativeLineStyle,
    NodeImgPlacementToolbar,
    NodeNoteSidebar,
    AiCreate,
    AiChat,
    AiSuggest,
    AiExplain,
    TopicTraversalPanel
  },
  data() {
    return {
      enableShowLoading: true,
      mindMap: null,
      mindMapData: null,
      mindMapConfig: {},
      prevImg: '',
      storeConfigTimer: null,
      showDragMask: false
    }
  },
  computed: {
    ...mapState({
      isZenMode: state => state.localConfig.isZenMode,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      isShowScrollbar: state => state.localConfig.isShowScrollbar,
      enableDragImport: state => state.localConfig.enableDragImport,
      useLeftKeySelectionRightKeyDrag: state =>
        state.localConfig.useLeftKeySelectionRightKeyDrag,
      extraTextOnExport: state => state.extraTextOnExport,
      isDragOutlineTreeNode: state => state.isDragOutlineTreeNode,
      enableAi: state => state.localConfig.enableAi
    })
  },
  watch: {
    openNodeRichText() {
      if (this.openNodeRichText) {
        this.addRichTextPlugin()
      } else {
        this.removeRichTextPlugin()
      }
    },
    isShowScrollbar() {
      if (this.isShowScrollbar) {
        this.addScrollbarPlugin()
      } else {
        this.removeScrollbarPlugin()
      }
    }
  },
  mounted() {
    showLoading()
    this.getData()
    this.init()
    this.$bus.$on('execCommand', this.execCommand)
    this.$bus.$on('paddingChange', this.onPaddingChange)
    this.$bus.$on('export', this.export)
    this.$bus.$on('batchExport', this.batchExport)
    this.$bus.$on('setData', this.setData)
    this.$bus.$on('startTextEdit', this.handleStartTextEdit)
    this.$bus.$on('endTextEdit', this.handleEndTextEdit)
    this.$bus.$on('createAssociativeLine', this.handleCreateLineFromActiveNode)
    this.$bus.$on('startPainter', this.handleStartPainter)
    this.$bus.$on('node_tree_render_end', this.handleHideLoading)
    this.$bus.$on('showLoading', this.handleShowLoading)
    this.$bus.$on('localStorageExceeded', this.onLocalStorageExceeded)
    window.addEventListener('resize', this.handleResize)
    this.$bus.$on('showDownloadTip', this.showDownloadTip)
    this.$bus.$on('ai_explain', this.handleAiExplain)
    this.$bus.$on('apply_ai_explanation', this.handleApplyAiExplanation)
    this.$bus.$on('apply_ai_suggestion', this.handleApplyAiSuggestion)
    this.$bus.$on('getMindMapInstance', this.handleGetMindMapInstance)
    this.webTip()
  },
  beforeDestroy() {
    this.$bus.$off('execCommand', this.execCommand)
    this.$bus.$off('paddingChange', this.onPaddingChange)
    this.$bus.$off('export', this.export)
    this.$bus.$off('setData', this.setData)
    this.$bus.$off('startTextEdit', this.handleStartTextEdit)
    this.$bus.$off('endTextEdit', this.handleEndTextEdit)
    this.$bus.$off('createAssociativeLine', this.handleCreateLineFromActiveNode)
    this.$bus.$off('startPainter', this.handleStartPainter)
    this.$bus.$off('node_tree_render_end', this.handleHideLoading)
    this.$bus.$off('showLoading', this.handleShowLoading)
    this.$bus.$off('localStorageExceeded', this.onLocalStorageExceeded)
    window.removeEventListener('resize', this.handleResize)
    this.$bus.$off('showDownloadTip', this.showDownloadTip)
    this.$bus.$off('ai_explain', this.handleAiExplain)
    this.$bus.$off('apply_ai_explanation', this.handleApplyAiExplanation)
    this.$bus.$off('apply_ai_suggestion', this.handleApplyAiSuggestion)
    this.$bus.$off('getMindMapInstance', this.handleGetMindMapInstance)
    this.mindMap.destroy()
  },
  methods: {
    onLocalStorageExceeded() {
      this.$notify({
        type: 'warning',
        title: this.$t('edit.tip'),
        message: this.$t('edit.localStorageExceededTip'),
        duration: 5000
      })
    },

    handleStartTextEdit() {
      this.mindMap.renderer.startTextEdit()
    },

    handleEndTextEdit() {
      this.mindMap.renderer.endTextEdit()
    },

    handleCreateLineFromActiveNode() {
      this.mindMap.associativeLine.createLineFromActiveNode()
    },

    handleStartPainter() {
      this.mindMap.painter.startPainter()
    },

    handleResize() {
      this.mindMap.resize()
    },

    // 显示loading
    handleShowLoading() {
      this.enableShowLoading = true
      showLoading()
    },

    // 渲染结束后关闭loading
    handleHideLoading() {
      if (this.enableShowLoading) {
        this.enableShowLoading = false
        hideLoading()
      }
    },

    // 处理应用AI建议
    handleApplyAiSuggestion(nodeData, suggestion) {
      if (!nodeData || !suggestion) return
      
      // 创建子节点
      const newNode = this.mindMap.addChild(nodeData, {
        text: suggestion,
        richText: true
      })
      
      // 展开父节点
      this.mindMap.execCommand('EXPAND_NODE', true, nodeData)
      
      // 激活新节点
      this.mindMap.execCommand('SET_NODE_ACTIVE', newNode)
      
      // 开始编辑新节点
      this.mindMap.renderer.startTextEdit(newNode)
    },

    // 处理AI解释
    handleAiExplain(nodeData) {
      if (!nodeData) return
      // 直接调用AI解释组件，不要再触发事件
      this.$refs.aiExplain && this.$refs.aiExplain.handleAiExplain(nodeData)
    },

    // 处理应用AI解释
    handleApplyAiExplanation(nodeData, explanation) {
      if (!nodeData || !explanation) return

      try {
        // 将解释内容按段落分割
        const paragraphs = explanation.split('\n\n').filter(p => p.trim())

        // 为每个段落创建子节点
        paragraphs.forEach(paragraph => {
          const cleanText = paragraph.trim().replace(/^\*\*|\*\*$/g, '').replace(/^- |^• /, '')
          if (cleanText) {
            // 使用正确的API创建子节点
            this.mindMap.execCommand('INSERT_CHILD_NODE', false, nodeData, cleanText)
          }
        })

        // 展开父节点
        this.mindMap.execCommand('EXPAND_NODE', true, nodeData)

        this.$message.success('AI解释已应用到思维导图')
      } catch (error) {
        console.error('应用AI解释失败:', error)
        this.$message.error('应用AI解释失败')
      }
    },

    // 处理应用AI建议
    handleApplyAiSuggestion(nodeData, suggestion) {
      if (!nodeData || !suggestion) return

      try {
        console.log('应用AI建议:', suggestion)

        // 解析建议内容，提取关键点
        const lines = suggestion.split('\n').filter(line => line.trim())
        const suggestions = []

        lines.forEach(line => {
          const trimmed = line.trim()
          // 提取以数字、符号开头的建议项，或包含关键词的行
          if (trimmed.match(/^[\d\-•\*]\s*/) ||
              trimmed.includes('建议') ||
              trimmed.includes('：') ||
              trimmed.includes('提升') ||
              trimmed.includes('改进') ||
              trimmed.includes('优化')) {

            let cleanText = trimmed
              .replace(/^\d+\.\s*/, '')
              .replace(/^[\-•\*]\s*/, '')
              .replace(/^\*\*|\*\*$/g, '')
              .replace(/^【.*?】/, '')
              .trim()

            // 如果是标题行，提取标题
            if (cleanText.includes('：')) {
              const parts = cleanText.split('：')
              if (parts.length > 1 && parts[1].trim()) {
                cleanText = parts[0].trim()
              }
            }

            if (cleanText && cleanText.length > 3 && cleanText.length < 50) {
              suggestions.push(cleanText)
            }
          }
        })

        // 如果没有提取到具体建议，提取一些关键短语
        if (suggestions.length === 0) {
          const keyPhrases = [
            '明确性提升',
            '结构化改进',
            '关键词突出',
            '添加实例案例',
            '补充背景信息',
            '简洁语言表达'
          ]
          suggestions.push(...keyPhrases.slice(0, 3))
        }

        // 为每个建议创建子节点
        const finalSuggestions = suggestions.slice(0, 6) // 限制最多6个建议
        finalSuggestions.forEach(suggestionText => {
          this.mindMap.execCommand('INSERT_CHILD_NODE', false, nodeData, suggestionText)
        })

        // 展开父节点
        this.mindMap.execCommand('EXPAND_NODE', true, nodeData)

        this.$message.success(`AI建议已应用到思维导图 (${finalSuggestions.length}个建议)`)
      } catch (error) {
        console.error('应用AI建议失败:', error)
        this.$message.error('应用AI建议失败: ' + error.message)
      }
    },

    // 处理获取思维导图实例请求
    handleGetMindMapInstance(callback) {
      if (typeof callback === 'function') {
        callback(this.mindMap)
      }
    },

    // 获取思维导图数据，实际应该调接口获取
    getData() {
      this.mindMapData = getData()
      this.mindMapConfig = getConfig() || {}
    },

    // 存储数据当数据有变时
    bindSaveEvent() {
      this.$bus.$on('data_change', data => {
        storeData({ root: data })
      })
      this.$bus.$on('view_data_change', data => {
        clearTimeout(this.storeConfigTimer)
        this.storeConfigTimer = setTimeout(() => {
          storeData({
            view: data
          })
        }, 300)
      })
    },

    // 手动保存
    manualSave() {
      storeData(this.mindMap.getData(true))
    },

    // 初始化
    init() {
      let hasFileURL = this.hasFileURL()
      let { root, layout, theme, view } = this.mindMapData
      const config = this.mindMapConfig
      // 如果url中存在要打开的文件，那么思维导图数据、主题、布局都使用默认的
      if (hasFileURL) {
        root = {
          data: {
            text: this.$t('edit.root')
          },
          children: []
        }
        layout = exampleData.layout
        theme = exampleData.theme
        view = null
      }
      this.mindMap = new MindMap({
        el: this.$refs.mindMapContainer,
        data: root,
        fit: false,
        layout: layout,
        theme: theme.template,
        themeConfig: theme.config,
        viewData: view,
        nodeTextEditZIndex: 1000,
        nodeNoteTooltipZIndex: 1000,
        customNoteContentShow: {
          show: (content, left, top, node) => {
            this.$bus.$emit('showNoteContent', content, left, top, node)
          },
          hide: () => {
            // this.$bus.$emit('hideNoteContent')
          }
        },
        openRealtimeRenderOnNodeTextEdit: true,
        enableAutoEnterTextEditWhenKeydown: true,
        copyFormat: 'txt', // 设置复制格式为纯文本+缩进
        demonstrateConfig: {
          openBlankMode: false
        },
        ...(config || {}),
        iconList: [...icon],
        useLeftKeySelectionRightKeyDrag: this.useLeftKeySelectionRightKeyDrag,
        customInnerElsAppendTo: null,
        customHandleClipboardText: handleClipboardText,
        defaultNodeImage: require('../../../assets/img/图片加载失败.svg'),
        initRootNodePosition: ['center', 'center'],
        handleIsSplitByWrapOnPasteCreateNewNode: () => {
          return this.$confirm(
            this.$t('edit.splitByWrap'),
            this.$t('edit.tip'),
            {
              confirmButtonText: this.$t('edit.yes'),
              cancelButtonText: this.$t('edit.no'),
              type: 'warning'
            }
          )
        },
        errorHandler: (code, err) => {
          console.error(err)
          switch (code) {
            case 'export_error':
              this.$message.error(this.$t('edit.exportError'))
              break
            default:
              break
          }
        },
        addContentToFooter: () => {
          const text = this.extraTextOnExport.trim()
          if (!text) return null
          const el = document.createElement('div')
          el.className = 'footer'
          el.innerHTML = text
          const cssText = `
            .footer {
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 12px;
              color: #979797;
            }
          `
          return {
            el,
            cssText,
            height: 30
          }
        },
        expandBtnNumHandler: num => {
          return num >= 100 ? '…' : num
        },
        beforeDeleteNodeImg: node => {
          return new Promise(resolve => {
            this.$confirm(
              this.$t('edit.deleteNodeImgTip'),
              this.$t('edit.tip'),
              {
                confirmButtonText: this.$t('edit.yes'),
                cancelButtonText: this.$t('edit.no'),
                type: 'warning'
              }
            )
              .then(() => {
                resolve(false)
              })
              .catch(() => {
                resolve(true)
              })
          })
        }
      })
      this.loadPlugins()
      this.mindMap.keyCommand.addShortcut('Control+s', () => {
        this.manualSave()
      })
      // 转发事件
      ;[
        'node_active',
        'data_change',
        'view_data_change',
        'back_forward',
        'node_contextmenu',
        'node_click',
        'draw_click',
        'expand_btn_click',
        'svg_mousedown',
        'mouseup',
        'mode_change',
        'node_tree_render_end',
        'rich_text_selection_change',
        'transforming-dom-to-images',
        'generalization_node_contextmenu',
        'painter_start',
        'painter_end',
        'scrollbar_change',
        'scale',
        'translate',
        'node_attachmentClick',
        'node_attachmentContextmenu',
        'demonstrate_jump',
        'exit_demonstrate',
        'node_note_dblclick',
        'node_mousedown'
      ].forEach(event => {
        this.mindMap.on(event, (...args) => {
          this.$bus.$emit(event, ...args)
        })
      })
      this.bindSaveEvent()
      // 触发应用初始化事件，传递思维导图实例
      this.$bus.$emit('app_inited', this.mindMap)
      // 如果应用被接管，那么抛出事件传递思维导图实例
      if (window.takeOverApp) {
        this.$bus.$emit('app_inited', this.mindMap)
      }
      // 解析url中的文件
      if (hasFileURL) {
        this.$bus.$emit('handle_file_url')
      }
      // api/index.js文件使用
      // 当正在编辑本地文件时通过该方法获取最新数据
      Vue.prototype.getCurrentData = () => {
        const fullData = this.mindMap.getData(true)
        return { ...fullData }
      }
      // 协同测试
      this.cooperateTest()
    },

    // 加载相关插件
    loadPlugins() {
      if (this.openNodeRichText) this.addRichTextPlugin()
      if (this.isShowScrollbar) this.addScrollbarPlugin()
    },

    // url中是否存在要打开的文件
    hasFileURL() {
      const fileURL = this.$route.query.fileURL
      if (!fileURL) return false
      return /\.(smm|json|xmind|md|xlsx)$/.test(fileURL)
    },

    // 动态设置思维导图数据
    setData(data) {
      this.handleShowLoading()
      let rootNodeData = null
      if (data.root) {
        this.mindMap.setFullData(data)
        rootNodeData = data.root
      } else {
        this.mindMap.setData(data)
        rootNodeData = data
      }
      this.mindMap.view.reset()
      this.manualSave()
      // 如果导入的是富文本内容，那么自动开启富文本模式
      if (rootNodeData.data.richText && !this.openNodeRichText) {
        this.$bus.$emit('toggleOpenNodeRichText', true)
        this.$notify.info({
          title: this.$t('edit.tip'),
          message: this.$t('edit.autoOpenNodeRichTextTip')
        })
      }
    },

    // 重新渲染
    reRender() {
      this.mindMap.reRender()
    },

    // 执行命令
    execCommand(...args) {
      this.mindMap.execCommand(...args)
    },

    // 导出
    async export(type, isDownload = true, name, ...args) {
      try {
        showLoading()
        // 如果没有提供文件名，使用中心主题内容
        if (!name) {
          const rootNode = this.mindMap.renderer.root
          if (rootNode && rootNode.nodeData.data) {
            name = rootNode.nodeData.data.text || this.$t('mindMap')
          }
        }
        await this.mindMap.export(type, isDownload, name, ...args)
        hideLoading()
      } catch (error) {
        console.error('导出失败:', error)
        hideLoading()
        this.$message.error(this.$t('exportFailed') + ': ' + (error.message || error))
        // 如果是浏览器拦截了下载，提示用户手动点击下载
        if (error.message && error.message.includes('intercepted')) {
          this.$message.warning(this.$t('exportBrowserBlocked'))
        }
      }
    },

    // 获取文件类型对应的MIME类型
    getMimeType(type) {
      const mimeTypes = {
        'mm': 'application/xml;charset=utf-8',
        'emmx': 'application/xml;charset=utf-8',
        'mmap': 'application/xml;charset=utf-8',
        'xmind': 'application/zip',
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'pdf': 'application/pdf',
        'json': 'application/json',
        'smm': 'application/json',
        'md': 'text/markdown;charset=utf-8',
        'txt': 'text/plain;charset=utf-8'
      }
      return mimeTypes[type] || 'application/octet-stream'
    },

    // 批量导出
    async batchExport(types, baseName) {
      try {
        showLoading()

        // 如果没有提供文件名，使用中心主题内容
        if (!baseName) {
          const rootNode = this.mindMap.renderer.root
          if (rootNode && rootNode.nodeData.data) {
            baseName = rootNode.nodeData.data.text || this.$t('mindMap')
          }
        }

        // 动态导入JSZip
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        let successCount = 0
        let failCount = 0
        const errors = []

        // 逐个导出每种格式并添加到ZIP
        for (const type of types) {
          try {
            const fileName = `${baseName}.${type}`
            // 导出为数据而不是下载
            const result = await this.mindMap.export(type, false, fileName)

            // 将结果转换为Blob
            let blob
            if (result instanceof Blob) {
              blob = result
            } else if (typeof result === 'string') {
              if (result.startsWith('data:')) {
                // 处理data URL
                const response = await fetch(result)
                blob = await response.blob()
              } else {
                // 处理纯文本内容（如XML、JSON等）
                const mimeType = this.getMimeType(type)
                blob = new Blob([result], { type: mimeType })
              }
            } else {
              // 其他类型，尝试转换为JSON字符串
              const content = JSON.stringify(result)
              blob = new Blob([content], { type: 'application/json' })
            }

            // 添加到ZIP文件
            zip.file(fileName, blob)
            successCount++
          } catch (error) {
            console.error(`导出${type}格式失败:`, error)
            failCount++
            errors.push(`${type}: ${error.message || error}`)
          }
        }

        if (successCount > 0) {
          // 生成ZIP文件
          const zipBlob = await zip.generateAsync({ type: 'blob' })

          // 下载ZIP文件
          const link = document.createElement('a')
          link.href = URL.createObjectURL(zipBlob)
          link.download = `${baseName}_批量导出.zip`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(link.href)
        }

        hideLoading()

        // 显示结果
        if (successCount > 0 && failCount === 0) {
          this.$message.success(this.$t('export.batchExportSuccess', { count: successCount }))
        } else if (successCount > 0 && failCount > 0) {
          this.$message.warning(this.$t('export.batchExportPartial', { success: successCount, fail: failCount }))
          if (errors.length > 0) {
            console.error('批量导出错误详情:', errors)
          }
        } else {
          this.$message.error(this.$t('export.batchExportFailed'))
          if (errors.length > 0) {
            console.error('批量导出错误详情:', errors)
          }
        }
      } catch (error) {
        console.error('批量导出失败:', error)
        hideLoading()
        this.$message.error(this.$t('export.batchExportFailed') + ': ' + (error.message || error))
      }
    },

    // 修改导出内边距
    onPaddingChange(data) {
      this.mindMap.updateConfig(data)
    },

    // 加载节点富文本编辑插件
    addRichTextPlugin() {
      if (!this.mindMap) return
      this.mindMap.addPlugin(RichText)
    },

    // 移除节点富文本编辑插件
    removeRichTextPlugin() {
      this.mindMap.removePlugin(RichText)
    },

    // 加载滚动条插件
    addScrollbarPlugin() {
      if (!this.mindMap) return
      this.mindMap.addPlugin(ScrollbarPlugin)
    },

    // 移除滚动条插件
    removeScrollbarPlugin() {
      this.mindMap.removePlugin(ScrollbarPlugin)
    },

    // 协同测试
    cooperateTest() {
      if (this.mindMap.cooperate && this.$route.query.userName) {
        this.mindMap.cooperate.setProvider(null, {
          roomName: 'demo-room',
          signalingList: ['ws://localhost:4444']
        })
        this.mindMap.cooperate.setUserInfo({
          id: Math.random(),
          name: this.$route.query.userName,
          color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][
            Math.floor(Math.random() * 5)
          ],
          avatar:
            Math.random() > 0.5
              ? 'https://img0.baidu.com/it/u=4270674549,2416627993&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1696006800&t=4d32871d14a7224a4591d0c3c7a97311'
              : ''
        })
      }
    },

    // 拖拽文件到页面导入
    onDragenter() {
      if (!this.enableDragImport || this.isDragOutlineTreeNode) return
      this.showDragMask = true
    },

    onDragleave() {
      this.showDragMask = false
    },

    onDrop(e) {
      if (!this.enableDragImport) return
      this.showDragMask = false
      const dt = e.dataTransfer
      const file = dt.files && dt.files[0]
      if (!file) return
      this.$bus.$emit('importFile', file)
    },

    // 网页版试用提示
    webTip() {
      const storageKey = 'webUseTip'
      const data = localStorage.getItem(storageKey)
      if (data) {
        return
      }
      this.showDownloadTip(
        '重要提示',
        '网页版已暂停更新，部分功能缺失，请下载客户端获得完整体验~'
      )
      localStorage.setItem(storageKey, 1)
    },

    showDownloadTip(title, desc) {
      const h = this.$createElement
      this.$msgbox({
        title,
        message: h('div', null, [
          h(
            'p',
            {
              style: {
                marginBottom: '12px'
              }
            },
            desc
          ),
          h('div', null, [
            h(
              'a',
              {
                attrs: {
                  href:
                    'https://pan.baidu.com/s/1huasEbKsGNH2Af68dvWiOg?pwd=3bp3',
                  target: '_blank'
                },
                style: {
                  color: '#409eff',
                  marginRight: '12px'
                }
              },
              this.$t('edit.downBaidu')
            ),
            h(
              'a',
              {
                attrs: {
                  href: 'https://github.com/wanglin2/mind-map/releases',
                  target: '_blank'
                },
                style: {
                  color: '#409eff'
                }
              },
              this.$t('edit.downGithub')
            )
          ])
        ]),
        showCancelButton: false,
        showConfirmButton: false
      })
    }
  }
}
</script>

<style lang="less" scoped>
.editContainer {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  .dragMask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3999;

    .dragTip {
      pointer-events: none;
      font-weight: bold;
    }
  }

  .mindMapContainer {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
  }
}
</style>