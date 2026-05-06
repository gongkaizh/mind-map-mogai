<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div class="toolbar" ref="toolbarRef">
      <!-- 节点操作 -->
      <div class="toolbarBlock">
        <ToolbarNodeBtnList :list="horizontalList"></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <ToolbarNodeBtnList
            dir="v"
            :list="verticalList"
            @click.native="popoverShow = false"
          ></ToolbarNodeBtnList>
          <div slot="reference" class="toolbarBtn">
            <span class="icon iconfont icongongshi"></span>
            <span class="text">{{ $t('toolbar.more') }}</span>
          </div>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div class="toolbarBtn" @click="openDirectory" v-if="!isMobile">
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="createNewLocalFile">
            <span class="icon iconfont iconxinjian"></span>
            <span class="text">{{ $t('toolbar.newFile') }}</span>
          </div>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="openLocalFile">
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <div class="toolbarBtn" @click="saveLocalFile" v-if="!isMobile">
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div class="toolbarBtn" @click="$bus.$emit('showImport')">
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div
          class="toolbarBtn"
          @click="$bus.$emit('showExport')"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.export') }}</span>
        </div>

        <!-- 当前文件名显示 -->
        <div class="currentFileName" v-if="currentFileName" :title="currentFileFullName">
          <span class="icon iconfont iconwenjian1"></span>
          <span class="fileName">{{ currentFileName }}</span>
        </div>
        <!-- 本地文件树 -->
        <div
          class="fileTreeBox"
          v-if="fileTreeVisible"
          :class="{ expand: fileTreeExpand }"
        >
          <div class="fileTreeToolbar">
            <div class="fileTreeName">
              {{ rootDirName ? '/' + rootDirName : '' }}
            </div>
            <div class="fileTreeActionList">
              <div
                class="btn"
                :class="[
                  fileTreeExpand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                ]"
                @click="fileTreeExpand = !fileTreeExpand"
              ></div>
              <div
                class="btn el-icon-close"
                @click="fileTreeVisible = false"
              ></div>
            </div>
          </div>
          <div class="fileTreeWrap">
            <el-tree
              :props="fileTreeProps"
              :load="loadFileTreeNode"
              :expand-on-click-node="false"
              node-key="id"
              lazy
            >
              <span class="customTreeNode" slot-scope="{ node, data }">
                <div class="treeNodeInfo">
                  <span
                    class="treeNodeIcon iconfont"
                    :class="[
                      data.type === 'file' ? 'iconwenjian' : 'icondakai'
                    ]"
                  ></span>
                  <span class="treeNodeName">{{ node.label }}</span>
                </div>
                <div class="treeNodeBtnList" v-if="data.type === 'file'">
                  <el-button
                    type="text"
                    size="mini"
                    v-if="data.enableEdit"
                    @click="editLocalFile(data)"
                    >编辑</el-button
                  >
                  <el-button
                    type="text"
                    size="mini"
                    v-else
                    @click="importLocalFile(data)"
                    >导入</el-button
                  >
                </div>
              </span>
            </el-tree>
          </div>
        </div>
      </div>
    </div>
    <NodeImage></NodeImage>
    <NodeHyperlink></NodeHyperlink>
    <NodeIcon></NodeIcon>
    <NodeNote></NodeNote>
    <NodeTag></NodeTag>
    <Export></Export>
    <Import ref="ImportRef"></Import>

    <!-- 文件选择对话框 -->
    <el-dialog
      title="选择要打开的文件"
      :visible.sync="fileSelectionDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedFiles.length > 0">
        <p style="margin-bottom: 15px;">您选择了 {{ selectedFiles.length }} 个文件，请选择要打开的文件：</p>
        <el-radio-group v-model="selectedFileIndex" style="width: 100%;">
          <el-radio
            v-for="(file, index) in selectedFiles"
            :key="index"
            :label="index"
            style="display: block; margin-bottom: 10px; white-space: normal; line-height: 1.5;"
          >
            {{ file.name }}
          </el-radio>
        </el-radio-group>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelFileSelection">取消</el-button>
        <el-button type="primary" @click="confirmFileSelection">打开</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import NodeImage from './NodeImage.vue'
import NodeHyperlink from './NodeHyperlink.vue'
import NodeIcon from './NodeIcon.vue'
import NodeNote from './NodeNote.vue'
import NodeTag from './NodeTag.vue'
import Export from './Export.vue'
import Import from './Import.vue'
import { mapState } from 'vuex'
import { Notification } from 'element-ui'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData } from '../../../api'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'

// 工具栏
let fileHandle = null
const defaultBtnList = [
  'back',
  'forward',
  'painter',
  'siblingNode',
  'childNode',
  'deleteNode',
  'image',
  'icon',
  'link',
  'note',
  'tag',
  'summary',
  'associativeLine',
  'formula',
  // 'attachment',
  'outerFrame',
  'annotation',
  'ai',
  'systemCheck'
]

export default {
  components: {
    NodeImage,
    NodeHyperlink,
    NodeIcon,
    NodeNote,
    NodeTag,
    Export,
    Import,
    ToolbarNodeBtnList
  },
  data() {
    return {
      isMobile: isMobile(),
      horizontalList: [],
      verticalList: [],
      showMoreBtn: true,
      popoverShow: false,
      fileTreeProps: {
        label: 'name',
        children: 'children',
        isLeaf: 'leaf'
      },
      fileTreeVisible: false,
      rootDirName: '',
      fileTreeExpand: true,
      waitingWriteToLocalFile: false,
      fileSelectionDialogVisible: false,
      selectedFiles: [],
      selectedFileIndex: 0,
      fileSelectionResolve: null,
      currentFileName: '',
      currentFileFullName: '',
      currentFilePath: ''
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      isHandleLocalFile: state => state.isHandleLocalFile,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      enableAi: state => state.localConfig.enableAi
    }),

    btnLit() {
      let res = [...defaultBtnList]
      if (!this.openNodeRichText) {
        res = res.filter(item => {
          return item !== 'formula'
        })
      }
      if (!this.enableAi) {
        res = res.filter(item => {
          return item !== 'ai' && item !== 'systemCheck'
        })
      }
      return res
    }
  },
  watch: {
    isHandleLocalFile(val) {
      if (!val) {
        Notification.closeAll()
      }
    },
    btnLit: {
      deep: true,
      handler() {
        this.computeToolbarShow()
      }
    }
  },
  created() {
    this.$bus.$on('write_local_file', this.onWriteLocalFile)
    // 初始化时清空文件名显示
    this.setCurrentFileName('')
  },
  mounted() {
    this.computeToolbarShow()
    this.computeToolbarShowThrottle = throttle(this.computeToolbarShow, 300)
    window.addEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$on('lang_change', this.computeToolbarShowThrottle)
    window.addEventListener('beforeunload', this.onUnload)
    this.$bus.$on('node_note_dblclick', this.onNodeNoteDblclick)
  },
  beforeDestroy() {
    this.$bus.$off('write_local_file', this.onWriteLocalFile)
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$off('lang_change', this.computeToolbarShowThrottle)
    window.removeEventListener('beforeunload', this.onUnload)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
  },
  methods: {
    // 计算工具按钮如何显示
    computeToolbarShow() {
      if (!this.$refs.toolbarRef) return
      const windowWidth = window.innerWidth - 40
      const all = [...this.btnLit]
      let index = 1
      const loopCheck = () => {
        if (index > all.length) return done()
        this.horizontalList = all.slice(0, index)
        this.$nextTick(() => {
          const width = this.$refs.toolbarRef.getBoundingClientRect().width
          if (width < windowWidth) {
            index++
            loopCheck()
          } else if (index > 0 && width > windowWidth) {
            index--
            this.horizontalList = all.slice(0, index)
            done()
          }
        })
      }
      const done = () => {
        this.verticalList = all.slice(index)
        this.showMoreBtn = this.verticalList.length > 0
      }
      loopCheck()
    },

    // 监听本地文件读写
    onWriteLocalFile(content) {
      clearTimeout(this.timer)
      if (fileHandle && this.isHandleLocalFile) {
        this.waitingWriteToLocalFile = true
      }
      this.timer = setTimeout(() => {
        this.writeLocalFile(content)
      }, 1000)
    },

    onUnload(e) {
      if (this.waitingWriteToLocalFile) {
        const msg = '存在未保存的数据'
        e.returnValue = msg
        return msg
      }
    },

    // 加载本地文件树
    async loadFileTreeNode(node, resolve) {
      try {
        let dirHandle
        if (node.level === 0) {
          dirHandle = await window.showDirectoryPicker()
          this.rootDirName = dirHandle.name
        } else {
          dirHandle = node.data.handle
        }
        const dirList = []
        const fileList = []
        for await (const [key, value] of dirHandle.entries()) {
          const isFile = value.kind === 'file'
          if (isFile && !/\.(smm|xmind|md|json)$/.test(value.name)) {
            continue
          }
          const enableEdit = isFile && /\.smm$/.test(value.name)
          const data = {
            id: key,
            name: value.name,
            type: value.kind,
            handle: value,
            leaf: isFile,
            enableEdit
          }
          if (isFile) {
            fileList.push(data)
          } else {
            dirList.push(data)
          }
        }
        resolve([...dirList, ...fileList])
      } catch (error) {
        console.log(error)
        this.fileTreeVisible = false
        resolve([])
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    // 扫描本地文件夹
    openDirectory() {
      this.fileTreeVisible = false
      this.fileTreeExpand = true
      this.rootDirName = ''
      this.$nextTick(() => {
        this.fileTreeVisible = true
      })
    },

    // 编辑指定文件
    editLocalFile(data) {
      if (data.handle) {
        fileHandle = data.handle
        this.readFile()
      }
    },

    // 导入指定文件
    async importLocalFile(data) {
      try {
        const file = await data.handle.getFile()
        this.$refs.ImportRef.onChange({
          raw: file,
          name: file.name
        })
        this.$refs.ImportRef.confirm()
      } catch (error) {
        console.log(error)
      }
    },

    // 检测是否在Electron环境中
    isElectron() {
      return window.electronAPI || (window.process && window.process.type === 'renderer')
    },

    // 打开本地文件
    async openLocalFile() {
      try {
        // 检测是否在Electron环境中
        if (this.isElectron()) {
          // 使用Electron的文件对话框
          const result = await window.electronAPI.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
              { name: '思维导图文件', extensions: ['smm'] },
              { name: 'JSON文件', extensions: ['json'] }
            ]
          })

          if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return
          }

          // 如果选择了多个文件，让用户选择要打开哪一个
          let selectedFilePath
          if (result.filePaths.length > 1) {
            const selectedIndex = await this.showFilePathSelectionDialog(result.filePaths)
            if (selectedIndex === -1) {
              return
            }
            selectedFilePath = result.filePaths[selectedIndex]
          } else {
            selectedFilePath = result.filePaths[0]
          }

          // 读取文件内容
          const readResult = await window.electronAPI.readFile(selectedFilePath)
          if (!readResult.success) {
            this.$message.error('文件读取失败: ' + readResult.error)
            return
          }

          // 检查文件内容
          if (!readResult.content) {
            this.$message.error('文件内容为空')
            return
          }

          // 检查文件大小（字符串长度）
          if (readResult.content.length > 50 * 1024 * 1024) { // 50MB限制
            this.$message.error('文件过大，无法打开')
            return
          }

          this.setData(readResult.content)

          // 设置当前文件名显示
          const basenameResult = await window.electronAPI.getBasename(selectedFilePath)
          if (basenameResult.success) {
            this.setCurrentFileName(basenameResult.basename)
          }

          this.$store.commit('setIsHandleLocalFile', true)
          this.currentFilePath = selectedFilePath

          this.$notify({
            title: this.$t('toolbar.tip'),
            message: `${this.$t('toolbar.editingLocalFileTipFront')}${basenameResult.success ? basenameResult.basename : selectedFilePath}${this.$t('toolbar.editingLocalFileTipEnd')}`,
            duration: 3000
          })

          return
        }

        // 原有的Web API方式（用于浏览器环境）
        let fileHandles = await window.showOpenFilePicker({
          types: [
            {
              description: '',
              accept: {
                'application/json': ['.smm']
              }
            }
          ],
          excludeAcceptAllOption: true,
          multiple: true
        })
        if (!fileHandles || fileHandles.length === 0) {
          return
        }

        // 如果选择了多个文件，让用户选择要打开哪一个
        if (fileHandles.length > 1) {
          const selectedIndex = await this.showFileSelectionDialog(fileHandles)
          if (selectedIndex === -1) {
            return
          }
          fileHandle = fileHandles[selectedIndex]
        } else {
          fileHandle = fileHandles[0]
        }

        if (fileHandle.kind === 'directory') {
          this.$message.warning(this.$t('toolbar.selectFileTip'))
          return
        }
        this.readFile()
      } catch (error) {
        console.log(error)
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },



    // 显示文件选择对话框
    showFileSelectionDialog(fileHandles) {
      return new Promise((resolve) => {
        this.selectedFiles = fileHandles
        this.selectedFileIndex = 0
        this.fileSelectionResolve = resolve
        this.fileSelectionDialogVisible = true
      })
    },

    // 显示文件路径选择对话框（用于Electron环境）
    async showFilePathSelectionDialog(filePaths) {
      return new Promise(async (resolve) => {
        // 将文件路径转换为文件对象格式，以便复用现有的对话框
        const fileObjects = []
        for (const filePath of filePaths) {
          const basenameResult = await window.electronAPI.getBasename(filePath)
          fileObjects.push({
            name: basenameResult.success ? basenameResult.basename : filePath,
            path: filePath
          })
        }

        this.selectedFiles = fileObjects
        this.selectedFileIndex = 0
        this.fileSelectionResolve = resolve
        this.fileSelectionDialogVisible = true
      })
    },

    // 确认文件选择
    confirmFileSelection() {
      this.fileSelectionDialogVisible = false
      if (this.fileSelectionResolve) {
        this.fileSelectionResolve(this.selectedFileIndex)
        this.fileSelectionResolve = null
      }
    },

    // 取消文件选择
    cancelFileSelection() {
      this.fileSelectionDialogVisible = false
      if (this.fileSelectionResolve) {
        this.fileSelectionResolve(-1)
        this.fileSelectionResolve = null
      }
    },

    // 设置当前文件名显示
    setCurrentFileName(fileName) {
      if (fileName) {
        this.currentFileFullName = fileName
        // 如果文件名太长，截取显示
        if (fileName.length > 20) {
          this.currentFileName = fileName.substring(0, 17) + '...'
        } else {
          this.currentFileName = fileName
        }
      } else {
        this.currentFileName = ''
        this.currentFileFullName = ''
      }
    },

    // 读取本地文件
    async readFile() {
      try {
        let file = await fileHandle.getFile()

        // 检查文件大小
        if (file.size > 50 * 1024 * 1024) { // 50MB限制
          this.$message.error('文件过大，无法打开（超过50MB）')
          return
        }

        // 检查文件类型
        if (!file.name.endsWith('.smm') && !file.name.endsWith('.json')) {
          this.$message.error('不支持的文件格式，请选择.smm或.json文件')
          return
        }

        let fileReader = new FileReader()

        fileReader.onerror = () => {
          this.$message.error('文件读取失败')
        }

        fileReader.onload = async () => {
          try {
            // 检查读取结果
            if (!fileReader.result) {
              this.$message.error('文件内容为空')
              return
            }

            this.$store.commit('setIsHandleLocalFile', true)
            this.setData(fileReader.result)

            // 设置当前文件名显示
            this.setCurrentFileName(file.name)

            Notification.closeAll()
            Notification({
              title: this.$t('toolbar.tip'),
              message: `${this.$t('toolbar.editingLocalFileTipFront')}${
                file.name
              }${this.$t('toolbar.editingLocalFileTipEnd')}`,
              duration: 3000,
              showClose: true
            })
          } catch (error) {
            console.error('文件处理错误:', error)
            this.$message.error('文件处理失败: ' + error.message)
          }
        }

        fileReader.readAsText(file)
      } catch (error) {
        console.error('文件读取错误:', error)
        this.$message.error('文件读取失败: ' + error.message)
      }
    },

    // 渲染读取的数据
    setData(str) {
      // 添加加载提示
      const loading = this.$loading({
        lock: true,
        text: '正在解析文件...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      // 使用setTimeout确保UI能够更新
      setTimeout(() => {
        try {
          // 检查文件内容是否为空或过大
          if (!str || str.trim() === '') {
            throw new Error('文件内容为空')
          }

          if (str.length > 50 * 1024 * 1024) { // 50MB限制
            throw new Error('文件过大，无法解析')
          }

          // 检查是否为有效的JSON格式
          if (!str.trim().startsWith('{') && !str.trim().startsWith('[')) {
            throw new Error('文件格式不正确，不是有效的JSON文件')
          }

          // 使用超时机制解析JSON
          let data
          const parsePromise = new Promise((resolve, reject) => {
            try {
              const parsed = JSON.parse(str)
              resolve(parsed)
            } catch (e) {
              reject(e)
            }
          })

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('文件解析超时，可能文件已损坏')), 10000) // 10秒超时
          })

          Promise.race([parsePromise, timeoutPromise])
            .then(parsedData => {
              data = parsedData

              // 验证数据结构
              if (typeof data !== 'object' || data === null) {
                throw new Error('文件内容格式错误')
              }

              // 检查是否为思维导图数据
              if (!data.root && !data.data && !data.text) {
                throw new Error('不是有效的思维导图文件')
              }

              if (data.root) {
                this.isFullDataFile = true
              } else {
                this.isFullDataFile = false
                data = {
                  ...exampleData,
                  root: data
                }
              }

              loading.close()
              this.$bus.$emit('setData', data)

              // 显示成功提示
              this.$message.success('文件打开成功')
            })
            .catch(error => {
              loading.close()
              console.error('文件解析错误:', error)

              let errorMessage = '文件打开失败'
              if (error.message.includes('超时')) {
                errorMessage = '文件解析超时，文件可能已损坏或过于复杂'
              } else if (error.message.includes('JSON')) {
                errorMessage = '文件格式错误，不是有效的JSON文件'
              } else if (error.message.includes('思维导图')) {
                errorMessage = '不是有效的思维导图文件格式'
              } else if (error.message) {
                errorMessage = error.message
              }

              this.$message.error(errorMessage)
            })

        } catch (error) {
          loading.close()
          console.error('文件处理错误:', error)
          this.$message.error(error.message || '文件处理失败')
        }
      }, 100) // 延迟100ms确保加载提示显示
    },

    // 写入本地文件
    async writeLocalFile(content) {
      if (!fileHandle || !this.isHandleLocalFile) {
        this.waitingWriteToLocalFile = false
        return
      }
      if (!this.isFullDataFile) {
        content = content.root
      }
      let string = JSON.stringify(content)
      const writable = await fileHandle.createWritable()
      await writable.write(string)
      await writable.close()
      this.waitingWriteToLocalFile = false
    },

    // 创建本地文件
    async createNewLocalFile() {
      await this.createLocalFile(exampleData)
    },

    // 另存为
    async saveLocalFile() {
      let data = getData()
      await this.createLocalFile(data)
    },

    // 创建本地文件
    async createLocalFile(content) {
      try {
        // 检测是否在Electron环境中
        if (this.isElectron()) {
          // 使用Electron的文件保存对话框
          const result = await window.electronAPI.showSaveDialog({
            filters: [
              { name: '思维导图文件', extensions: ['smm'] },
              { name: 'JSON文件', extensions: ['json'] }
            ],
            defaultPath: this.$t('toolbar.defaultFileName') + '.smm'
          })

          if (result.canceled || !result.filePath) {
            return
          }

          const loading = this.$loading({
            lock: true,
            text: this.$t('toolbar.creatingTip'),
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })

          try {
            // 写入文件
            const fileContent = JSON.stringify(content, null, 2)
            const writeResult = await window.electronAPI.writeFile(result.filePath, fileContent)

            if (!writeResult.success) {
              loading.close()
              this.$message.error('文件保存失败: ' + writeResult.error)
              return
            }

            // 设置当前文件路径和状态
            this.currentFilePath = result.filePath
            this.$store.commit('setIsHandleLocalFile', true)
            this.isFullDataFile = true

            // 设置当前文件名显示
            const basenameResult = await window.electronAPI.getBasename(result.filePath)
            if (basenameResult.success) {
              this.setCurrentFileName(basenameResult.basename)
            }

            this.$notify({
              title: this.$t('toolbar.tip'),
              message: this.$t('toolbar.saveSuccess'),
              type: 'success',
              duration: 3000
            })

            loading.close()
            return
          } catch (writeError) {
            loading.close()
            console.error('写入文件失败:', writeError)
            this.$message.error('文件保存失败: ' + writeError.message)
            return
          }
        }

        // 原有的Web API方式（用于浏览器环境）
        let _fileHandle = await window.showSaveFilePicker({
          types: [
            {
              description: '',
              accept: { 'application/json': ['.smm'] }
            }
          ],
          suggestedName: this.$t('toolbar.defaultFileName')
        })
        if (!_fileHandle) {
          return
        }
        const loading = this.$loading({
          lock: true,
          text: this.$t('toolbar.creatingTip'),
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        fileHandle = _fileHandle
        this.$store.commit('setIsHandleLocalFile', true)
        this.isFullDataFile = true
        await this.writeLocalFile(content)
        await this.readFile()
        loading.close()
      } catch (error) {
        console.log(error)
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    onNodeNoteDblclick(node, e) {
      e.stopPropagation()
      this.$bus.$emit('showNodeNote', node)
    }
  }
}
</script>

<style lang="less" scoped>
.toolbarContainer {
  &.isDark {
    .toolbar {
      color: hsla(0, 0%, 100%, 0.9);
      .toolbarBlock {
        background-color: #262a2e;

        .fileTreeBox {
          background-color: #262a2e;

          /deep/ .el-tree {
            background-color: #262a2e;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: transparent;
          border-color: transparent;
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: hsla(0, 0%, 100%, 0.05);
            }
          }
        }

        &.disabled {
          color: #54595f;
        }
      }
    }
  }
  .toolbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    width: max-content;
    display: flex;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      background-color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 68px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 5px;
        min-width: 200px;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9e9e9;
          margin-bottom: 12px;
          padding-left: 12px;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              font-size: 18px;
              margin-left: 12px;
              cursor: pointer;
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBtn {
      display: flex;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;

      &:last-of-type {
        margin-right: 0;
      }

      &:hover {
        &:not(.disabled) {
          .icon {
            background: #f5f5f5;
          }
        }
      }

      &.active {
        .icon {
          background: #f5f5f5;
        }
      }

      &.disabled {
        color: #bcbcbc;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: flex;
        height: 26px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #e9e9e9;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0 5px;
      }

      .text {
        margin-top: 3px;
      }
    }

    // 当前文件名显示样式
    .currentFileName {
      display: flex;
      align-items: center;
      margin-left: 20px;
      padding: 4px 8px;
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      color: #1e40af;
      font-size: 12px;
      max-width: 200px;
      cursor: default;

      .icon {
        margin-right: 4px;
        font-size: 12px;
        border: none;
        background: none;
        padding: 0;
        height: auto;
      }

      .fileName {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &:hover {
        background: #dbeafe;
        border-color: #93c5fd;
      }
    }

    // 暗色主题下的文件名样式
    &.isDark {
      .currentFileName {
        background: #1e293b;
        border-color: #475569;
        color: #94a3b8;

        &:hover {
          background: #334155;
          border-color: #64748b;
        }
      }
    }
  }
}
</style>
