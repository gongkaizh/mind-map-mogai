<template>
  <div
    class="container"
    :class="{ isDark: isDark, activeSidebar: activeSidebar }"
  >
    <!-- 启动选择对话框 -->
    <el-dialog
      title="选择模式"
      :visible.sync="startupDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      center
      custom-class="startup-dialog"
      :append-to-body="true"
    >
      <div class="startup-options">
        <div class="option-card" @click="selectEditMode">
          <div class="option-icon">
            <i class="el-icon-edit"></i>
          </div>
          <div class="option-title">编辑脑图</div>
          <div class="option-desc">
            {{ hasLastMindMap ? '继续编辑上次的思维导图' : '创建新的思维导图' }}
          </div>
        </div>
        <div class="option-card" @click="showDemoSettings">
          <div class="option-icon">
            <i class="el-icon-video-play"></i>
          </div>
          <div class="option-title">自动演示脑图</div>
          <div class="option-desc">
            {{ hasLastMindMap ? '演示上次的思维导图' : '演示默认模板' }}
          </div>
        </div>
      </div>

      <!-- 演示设置区域 -->
      <div v-if="showDemoConfig" class="demo-config">
        <div class="config-title">演示设置</div>
        <div class="config-item">
          <label>切换间隔：</label>
          <el-select v-model="autoPlayInterval" placeholder="选择切换间隔">
            <el-option label="0.3秒 (极速)" :value="300"></el-option>
            <el-option label="0.5秒 (超快)" :value="500"></el-option>
            <el-option label="1秒 (快速)" :value="1000"></el-option>
            <el-option label="2秒 (较快)" :value="2000"></el-option>
            <el-option label="3秒 (默认)" :value="3000"></el-option>
            <el-option label="5秒 (慢速)" :value="5000"></el-option>
            <el-option label="8秒 (较慢)" :value="8000"></el-option>
            <el-option label="10秒 (最慢)" :value="10000"></el-option>
          </el-select>
        </div>
        <div class="config-buttons">
          <el-button @click="backToModeSelection">返回</el-button>
          <el-button type="primary" @click="selectDemoMode">开始演示</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 测试按钮 -->
    <div v-if="!startupDialogVisible" style="position: fixed; top: 10px; right: 10px; z-index: 10000;">
      <el-button @click="startupDialogVisible = true" type="primary">测试对话框</el-button>
    </div>

    <template v-if="show">
      <Toolbar v-if="!isZenMode"></Toolbar>
      <Edit ref="editComponent"></Edit>
    </template>
  </div>
</template>

<script>
import Toolbar from './components/Toolbar.vue'
import Edit from './components/Edit.vue'
import { mapState, mapMutations } from 'vuex'
import { getLocalConfig } from '@/api'

export default {
  components: {
    Toolbar,
    Edit
  },
  data() {
    return {
      show: false,
      startupDialogVisible: false, // 启动选择对话框是否显示
      selectedMode: null, // 选择的模式：'edit' 或 'demo'
      autoPlayTimer: null, // 自动播放定时器
      autoPlayInterval: 3000, // 自动播放间隔（毫秒）
      showDemoConfig: false, // 是否显示演示配置
      mindMapData: null, // 预加载的思维导图数据
      hasLastMindMap: false, // 是否有上次的思维导图
      saveTimer: null // 保存定时器
    }
  },
  computed: {
    ...mapState({
      isZenMode: state => state.localConfig.isZenMode,
      isDark: state => state.localConfig.isDark,
      activeSidebar: state => state.activeSidebar
    })
  },
  watch: {
    isDark() {
      this.setBodyDark()
    }
  },
  async created() {
    this.initLocalConfig()
    this.setBodyDark()
    // 预加载内容
    await this.prepareContent()
  },

  mounted() {
    // 在DOM挂载完成后显示启动选择对话框
    this.$nextTick(() => {
      this.startupDialogVisible = true
      console.log('启动选择对话框已显示，内容已预加载')
    })
  },
  methods: {
    ...mapMutations(['setLocalConfig']),

    // 初始化本地配置
    initLocalConfig() {
      let config = getLocalConfig()
      if (config) {
        this.setLocalConfig({
          ...this.$store.state.localConfig,
          ...config
        })
      }
    },

    setBodyDark() {
      this.isDark
        ? document.body.classList.add('isDark')
        : document.body.classList.remove('isDark')
    },

    // 预加载内容
    async prepareContent() {
      console.log('开始预加载内容...')

      try {
        // 1. 尝试加载上次的思维导图
        const lastMindMap = await this.loadLastMindMap()

        if (lastMindMap) {
          console.log('找到上次的思维导图，准备加载')
          this.mindMapData = lastMindMap
          this.hasLastMindMap = true
        } else {
          console.log('没有找到历史记录，准备默认模板')
          this.mindMapData = this.createDefaultTemplate()
          this.hasLastMindMap = false
        }

        console.log('内容预加载完成')
      } catch (error) {
        console.error('预加载内容时出错:', error)
        // 出错时使用默认模板
        this.mindMapData = this.createDefaultTemplate()
        this.hasLastMindMap = false
      }
    },

    // 加载上次的思维导图
    async loadLastMindMap() {
      // 从localStorage获取上次保存的思维导图数据
      const lastData = localStorage.getItem('lastMindMapData')
      if (lastData) {
        try {
          return JSON.parse(lastData)
        } catch (error) {
          console.error('解析上次思维导图数据失败:', error)
          return null
        }
      }
      return null
    },

    // 创建默认模板
    createDefaultTemplate() {
      return {
        "data": {
          "text": "中心主题",
          "expand": true,
          "uid": "root"
        },
        "children": [
          {
            "data": {
              "text": "分支主题1",
              "expand": true,
              "uid": "branch1"
            },
            "children": []
          },
          {
            "data": {
              "text": "分支主题2",
              "expand": true,
              "uid": "branch2"
            },
            "children": []
          },
          {
            "data": {
              "text": "分支主题3",
              "expand": true,
              "uid": "branch3"
            },
            "children": []
          }
        ]
      }
    },

    // 选择编辑模式
    selectEditMode() {
      console.log('选择编辑模式')
      this.selectedMode = 'edit'
      this.startupDialogVisible = false
      this.showDemoConfig = false
      this.initAppWithContent()
    },

    // 显示演示设置
    showDemoSettings() {
      console.log('显示演示设置')
      this.showDemoConfig = true
    },

    // 返回模式选择
    backToModeSelection() {
      this.showDemoConfig = false
    },

    // 选择演示模式
    selectDemoMode() {
      console.log('选择演示模式，切换间隔:', this.autoPlayInterval + 'ms')
      this.selectedMode = 'demo'
      this.startupDialogVisible = false
      this.showDemoConfig = false
      this.initAppWithContent()
    },

    // 使用预加载内容初始化应用
    async initAppWithContent() {
      const loading = this.$loading({
        lock: true,
        text: this.$t('other.loading')
      })

      this.show = true

      // 等待组件渲染完成
      await this.$nextTick()

      // 加载预准备的内容到思维导图
      await this.loadContentToMindMap()

      loading.close()

      console.log('应用初始化完成，选择的模式:', this.selectedMode)
      console.log('已加载预准备的内容')

      // 如果选择的是演示模式，等待思维导图初始化完成后进入演示
      if (this.selectedMode === 'demo') {
        // 再等待一下确保Edit组件完全加载
        setTimeout(() => {
          console.log('准备开始自动演示')
          this.waitForMindMapAndStartDemo()
        }, 2000)
      }
    },

    // 将预加载的内容加载到思维导图
    async loadContentToMindMap() {
      if (this.mindMapData) {
        console.log('正在加载预准备的内容到思维导图')
        // 这里需要等待Edit组件完全初始化后再加载数据
        // 具体的加载逻辑需要根据Edit组件的API来实现

        // 监听思维导图初始化完成事件
        this.$bus.$on('app_inited', (mindMap) => {
          console.log('思维导图初始化完成，加载预准备的数据')
          if (mindMap && this.mindMapData) {
            // 加载数据到思维导图
            mindMap.setData(this.mindMapData)
            console.log('预准备的数据已加载到思维导图')

            // 监听数据变化，自动保存
            mindMap.on('data_change', (data) => {
              // 延迟保存，避免频繁操作
              clearTimeout(this.saveTimer)
              this.saveTimer = setTimeout(() => {
                this.saveCurrentMindMap(data)
              }, 1000)
            })
          }
        })
      }
    },

    // 等待思维导图初始化完成并开始演示
    waitForMindMapAndStartDemo() {
      console.log('开始等待思维导图初始化...')

      // 检查是否已经有思维导图实例
      if (this.$refs.editComponent && this.$refs.editComponent.mindMap) {
        console.log('思维导图已经存在，直接开始演示')
        setTimeout(() => {
          this.startAutoDemo(this.$refs.editComponent.mindMap)
        }, 1000)
        return
      }

      // 监听思维导图初始化完成事件
      this.$bus.$on('app_inited', (mindMap) => {
        console.log('收到app_inited事件，思维导图实例:', mindMap)
        console.log('演示插件是否可用:', mindMap && mindMap.demonstrate)
        // 延迟一下确保思维导图完全渲染
        setTimeout(() => {
          this.startAutoDemo(mindMap)
        }, 1000)
      })

      // 添加超时检查，如果10秒内没有收到事件，尝试其他方法
      setTimeout(() => {
        if (this.selectedMode === 'demo') {
          console.log('超时检查：尝试直接获取思维导图实例')
          if (this.$refs.editComponent && this.$refs.editComponent.mindMap) {
            console.log('找到思维导图实例，开始演示')
            this.startAutoDemo(this.$refs.editComponent.mindMap)
          } else {
            console.error('超时：无法获取思维导图实例')
          }
        }
      }, 10000)
    },

    // 开始自动演示
    startAutoDemo(mindMap) {
      console.log('开始自动演示，思维导图实例:', mindMap)
      if (!mindMap || !mindMap.demonstrate) {
        console.error('思维导图实例或演示插件不可用', {
          mindMap: !!mindMap,
          demonstrate: mindMap && !!mindMap.demonstrate
        })
        return
      }

      console.log('演示插件可用，开始进入演示模式')

      // 监听演示模式退出事件，以便重新开始
      mindMap.on('exit_demonstrate', () => {
        console.log('演示模式退出')
        this.stopAutoPlay()
        // 演示退出后，延迟重新开始
        setTimeout(() => {
          if (this.selectedMode === 'demo') {
            console.log('重新开始自动演示')
            this.startAutoDemo(mindMap)
          }
        }, 2000)
      })

      // 监听键盘事件，允许用户按ESC键切换到编辑模式
      const handleKeydown = (e) => {
        if (e.keyCode === 27 && this.selectedMode === 'demo') { // ESC键
          console.log('用户按ESC键退出演示模式')
          this.selectedMode = 'edit'
          this.stopAutoPlay()
          mindMap.demonstrate.exit()
          window.removeEventListener('keydown', handleKeydown)
        }
      }
      window.addEventListener('keydown', handleKeydown)

      // 进入演示模式
      console.log('调用mindMap.demonstrate.enter()')
      mindMap.demonstrate.enter()

      // 开始自动播放
      console.log('开始自动播放')
      this.startAutoPlay(mindMap)
    },

    // 开始自动播放
    startAutoPlay(mindMap) {
      console.log('启动自动播放定时器')
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer)
      }

      this.autoPlayTimer = setInterval(() => {
        console.log('自动播放定时器触发，检查演示状态:', {
          mindMap: !!mindMap,
          demonstrate: mindMap && !!mindMap.demonstrate,
          isInDemonstrate: mindMap && mindMap.demonstrate && mindMap.demonstrate.isInDemonstrate
        })
        if (mindMap && mindMap.demonstrate && mindMap.demonstrate.isInDemonstrate) {
          console.log('调用mindMap.demonstrate.next()')
          mindMap.demonstrate.next()
        } else {
          console.log('演示模式已退出，清除定时器')
          // 如果演示模式已退出，清除定时器
          this.stopAutoPlay()
        }
      }, this.autoPlayInterval)
    },

    // 停止自动播放
    stopAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer)
        this.autoPlayTimer = null
      }
    },

    // 保存当前思维导图数据
    saveCurrentMindMap(mindMapData) {
      try {
        localStorage.setItem('lastMindMapData', JSON.stringify(mindMapData))
        console.log('思维导图数据已保存')
      } catch (error) {
        console.error('保存思维导图数据失败:', error)
      }
    }
  },

  // 组件销毁时清理定时器
  beforeDestroy() {
    this.stopAutoPlay()
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
    this.$bus.$off('app_inited')
  }
}
</script>

<style lang="less">
.container {
}

// 启动选择对话框样式
.startup-dialog {
  z-index: 9999 !important;

  .el-dialog {
    z-index: 9999 !important;
  }

  .el-dialog__body {
    padding: 30px 20px;
  }
}

.startup-options {
  display: flex;
  gap: 20px;
  justify-content: center;

  .option-card {
    flex: 1;
    max-width: 150px;
    padding: 30px 20px;
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      transform: translateY(-2px);
    }

    .option-icon {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 15px;

      i {
        display: block;
      }
    }

    .option-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .option-desc {
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }
  }
}

.demo-config {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;

  .config-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 15px;
    text-align: center;
  }

  .config-item {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;

    label {
      margin-right: 10px;
      font-size: 14px;
      color: #606266;
      min-width: 80px;
    }

    .el-select {
      width: 120px;
    }
  }

  .config-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}</style>

body {
  &.isDark {
    /* el-button */
    .el-button {
      background-color: #363b3f;
      color: hsla(0, 0%, 100%, 0.9);
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    /* el-input */
    .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.9);
    }

    .el-input.is-disabled .el-input__inner {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
      color: hsla(0, 0%, 100%, 0.3);
    }

    .el-input-group__append,
    .el-input-group__prepend {
      background-color: #363b3f;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-input-group__append button.el-button {
      color: hsla(0, 0%, 100%, 0.9);
    }

    /* el-select */
    .el-select-dropdown {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);

      .el-select-dropdown__item {
        color: hsla(0, 0%, 100%, 0.6);
      }

      .el-select-dropdown__item.selected {
        color: #409eff;
      }

      .el-select-dropdown__item.hover,
      .el-select-dropdown__item:hover {
        background-color: hsla(0, 0%, 100%, 0.05);
      }
    }

    .el-select .el-input.is-disabled .el-input__inner:hover {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    /* el-popper*/
    .el-popper {
      background-color: #36393d;
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    .el-popper[x-placement^='bottom'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='bottom'] .popper__arrow::after {
      border-bottom-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow {
      background-color: #36393d;
    }

    .el-popper[x-placement^='top'] .popper__arrow::after {
      border-top-color: #36393d;
    }

    /* el-tabs */
    .el-tabs__item {
      color: hsla(0, 0%, 100%, 0.6);

      &:hover,
      &.is-active {
        color: #409eff;
      }
    }

    .el-tabs__nav-wrap::after {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-slider */
    .el-slider__runway {
      background-color: hsla(0, 0%, 100%, 0.6);
    }

    /* el-radio-group */
    .el-radio-group {
      .el-radio-button__inner {
        background-color: #36393d;
        color: hsla(0, 0%, 100%, 0.6);
      }

      .el-radio-button__orig-radio:checked + .el-radio-button__inner {
        color: #fff;
        background-color: #409eff;
      }
    }

    /* el-dialog */
    .el-dialog {
      background-color: #262a2e;

      .el-dialog__header {
        border-bottom: 1px solid hsla(0, 0%, 100%, 0.1);
      }

      .el-dialog__title {
        color: hsla(0, 0%, 100%, 0.9);
      }

      .el-dialog__body {
        background-color: #262a2e;
      }

      .el-dialog__footer {
        border-top: 1px solid hsla(0, 0%, 100%, 0.1);
      }
    }

    /* el-upload */
    .el-upload__tip {
      color: #999;
    }

    /* 富文本编辑器 */
    .toastui-editor-main-container {
      background-color: #fff;
    }

    /* 启动对话框暗黑模式 */
    .startup-dialog {
      .startup-options {
        .option-card {
          background: #363b3f;
          border-color: hsla(0, 0%, 100%, 0.1);

          &:hover {
            border-color: #409eff;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
          }

          .option-title {
            color: hsla(0, 0%, 100%, 0.9);
          }

          .option-desc {
            color: hsla(0, 0%, 100%, 0.6);
          }
        }
      }

      .demo-config {
        border-top-color: hsla(0, 0%, 100%, 0.1);

        .config-title {
          color: hsla(0, 0%, 100%, 0.9);
        }

        .config-item {
          label {
            color: hsla(0, 0%, 100%, 0.7);
          }
        }
      }
    }
  }
}
</style>
