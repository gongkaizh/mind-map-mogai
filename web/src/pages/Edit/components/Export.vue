<template>
  <el-dialog
    class="nodeExportDialog"
    :class="{ isMobile: isMobile, isDark: isDark }"
    :title="$t('export.title')"
    :visible.sync="dialogVisible"
    v-loading.fullscreen.lock="loading"
    :element-loading-text="loadingText"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)"
    :width="isMobile ? '90%' : '800px'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <div class="exportContainer" :class="{ isDark: isDark }">
      <!-- 导出类型选择 -->
      <div class="downloadTypeSelectBox">
        <!-- 类型列表 -->
        <div class="downloadTypeList customScrollbar">
          <!-- 批量导出选项 -->
          <div class="batchExportHeader">
            <el-checkbox
              v-model="enableBatchExport"
              @change="onBatchExportChange"
              size="small"
            >
              {{ $t('export.batchExport') }}
            </el-checkbox>
          </div>

          <div
            class="downloadTypeItem"
            v-for="item in downTypeList"
            :key="item.type"
            :class="{
              active: !enableBatchExport && exportType === item.type,
              selected: enableBatchExport && selectedTypes.includes(item.type)
            }"
            @click="handleTypeClick(item.type)"
          >
            <div class="typeIcon" :class="[item.type]"></div>
            <div class="name">{{ item.name }}</div>
            <div class="icon checked el-icon-check" v-if="!enableBatchExport"></div>
            <el-checkbox
              v-if="enableBatchExport"
              :value="selectedTypes.includes(item.type)"
              @change="(val) => handleTypeSelect(item.type, val)"
              @click.stop
            ></el-checkbox>
          </div>
        </div>
        <!-- 类型内容 -->
        <div class="downloadTypeContent">
          <!-- 文件名称输入 -->
          <div class="nameInputBox">
            <div class="nameInput">
              <span class="name">{{ $t('export.filename') }}</span>
              <el-input
                style="max-width: 250px"
                v-model="fileName"
                size="mini"
                @keydown.native.stop
              ></el-input>
            </div>
            <span class="closeBtn el-icon-close" @click="cancel"></span>
          </div>
          <!-- 配置 -->
          <div class="contentBox customScrollbar">
            <div class="contentRow">
              <div class="contentName">{{ $t('export.format') }}</div>
              <div class="contentValue info">
                {{ currentTypeData ? '.' + currentTypeData.type : '' }}
              </div>
            </div>
            <div class="contentRow">
              <div class="contentName">{{ $t('export.desc') }}</div>
              <div class="contentValue info">
                {{ currentTypeData ? currentTypeData.desc : '' }}
              </div>
            </div>
            <div class="contentRow">
              <div class="contentName">{{ $t('export.options') }}</div>
              <div class="contentValue info" v-if="noOptions">无</div>
              <div class="contentValue" v-else>
                <div
                  class="valueItem"
                  v-show="['smm', 'json'].includes(exportType)"
                >
                  <el-checkbox v-model="widthConfig">{{
                    $t('export.include')
                  }}</el-checkbox>
                </div>
                <div
                  class="valueItem"
                  v-show="['svg', 'png', 'pdf'].includes(exportType)"
                >
                  <div class="valueSubItem" v-if="['png'].includes(exportType)">
                    <span class="name">{{ $t('export.format') }}</span>
                    <el-radio-group v-model="imageFormat">
                      <el-radio label="png">PNG</el-radio>
                    </el-radio-group>
                  </div>
                  <div class="valueSubItem">
                    <span class="name">{{ $t('export.paddingX') }}</span>
                    <el-input
                      style="width: 200px"
                      v-model="paddingX"
                      size="mini"
                      @change="onPaddingChange"
                      @keydown.native.stop
                    ></el-input>
                  </div>
                  <div class="valueSubItem">
                    <span class="name">{{ $t('export.paddingY') }}</span>
                    <el-input
                      style="width: 200px"
                      v-model="paddingY"
                      size="mini"
                      @change="onPaddingChange"
                      @keydown.native.stop
                    ></el-input>
                  </div>
                  <div class="valueSubItem">
                    <span class="name">{{
                      this.$t('export.addFooterText')
                    }}</span>
                    <el-input
                      style="width: 200px"
                      v-model="extraText"
                      size="mini"
                      :placeholder="$t('export.addFooterTextPlaceholder')"
                      @keydown.native.stop
                    ></el-input>
                  </div>
                  <div class="valueSubItem">
                    <el-checkbox
                      v-show="['png', 'pdf'].includes(exportType)"
                      v-model="isTransparent"
                      >{{ $t('export.isTransparent') }}</el-checkbox
                    >
                  </div>
                  <div class="valueSubItem">
                    <el-checkbox v-show="showFitBgOption" v-model="isFitBg">{{
                      $t('export.isFitBg')
                    }}</el-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 按钮 -->
          <div class="btnList">
            <el-button @click="cancel" size="small">{{
              $t('dialog.cancel')
            }}</el-button>
            <el-button type="primary" @click="confirm" size="small">{{
              $t('export.confirm')
            }}</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { downTypeList } from '@/config'
import { isMobile } from 'simple-mind-map/src/utils/index'
import MarkdownIt from 'markdown-it'

// 导出
let md = null
export default {
  data() {
    return {
      dialogVisible: false,
      exportType: 'smm',
      fileName: '',
      widthConfig: true,
      isTransparent: false,
      loading: false,
      loadingText: '',
      paddingX: 10,
      paddingY: 10,
      extraText: '',
      isMobile: isMobile(),
      isFitBg: true,
      imageFormat: 'png',
      enableBatchExport: false,
      selectedTypes: [],
      mindMapInstance: null
    }
  },
  computed: {
    ...mapState({
      openNodeRichText: state => state.localConfig.openNodeRichText,
      isDark: state => state.localConfig.isDark,
    }),

    downTypeList() {
      const list = downTypeList[this.$i18n.locale] || downTypeList.zh
      return list.filter(item => {
        if (item.type === 'xlsx') {
          return false
        } else {
          return true
        }
      })
    },

    currentTypeData() {
      if (this.enableBatchExport) {
        return {
          type: 'batch',
          name: this.$t('export.batchExport'),
          desc: this.$t('export.batchExportDesc')
        }
      }
      const cur = this.downTypeList.find(item => {
        return item.type === this.exportType
      })
      return cur
    },

    showFitBgOption() {
      return !this.enableBatchExport && ['png', 'pdf'].includes(this.exportType) && !this.isTransparent
    },

    noOptions() {
      return this.enableBatchExport || ['md', 'xmind', 'txt', 'xlsx', 'mm', 'emmx', 'mmap'].includes(this.exportType)
    }
  },
  created() {
    this.$bus.$on('showExport', this.handleShowExport)
    // 监听mindMap实例创建事件
    this.$bus.$on('app_inited', (mindMap) => {
      this.mindMapInstance = mindMap
    })
  },
  beforeDestroy() {
    this.$bus.$off('showExport', this.handleShowExport)
    this.$bus.$off('app_inited')
  },
  methods: {
    ...mapMutations(['setExtraTextOnExport']),

    handleShowExport() {
      this.dialogVisible = true
      // 设置默认文件名为根节点内容
      this.setDefaultFileName()
    },

    // 设置默认文件名为根节点内容
    setDefaultFileName() {
      try {
        // 获取根节点内容 - 通过多种方式尝试获取
        let rootNodeText = null

        // 方式1：通过保存的mindMapInstance获取
        if (this.mindMapInstance && this.mindMapInstance.renderer && this.mindMapInstance.renderer.root) {
          rootNodeText = this.mindMapInstance.renderer.root.nodeData?.data?.text
        }

        // 方式2：通过$bus.mindMap获取
        if (!rootNodeText && this.$bus.mindMap && this.$bus.mindMap.renderer && this.$bus.mindMap.renderer.root) {
          rootNodeText = this.$bus.mindMap.renderer.root.nodeData?.data?.text
        }

        // 方式3：通过$parent获取mindMap实例
        if (!rootNodeText && this.$parent && this.$parent.mindMap) {
          const mindMap = this.$parent.mindMap
          if (mindMap.renderer && mindMap.renderer.root) {
            rootNodeText = mindMap.renderer.root.nodeData?.data?.text
          }
        }

        // 方式4：通过getData方法获取
        if (!rootNodeText) {
          const mindMap = this.mindMapInstance || this.$bus.mindMap
          if (mindMap) {
            try {
              const data = mindMap.getData()
              rootNodeText = data?.data?.text
            } catch (e) {
              console.warn('通过getData获取根节点失败:', e)
            }
          }
        }

        if (rootNodeText && rootNodeText.trim()) {
          // 清理文件名中的非法字符和HTML标签
          this.fileName = this.sanitizeFileName(rootNodeText.trim())
        } else {
          this.fileName = this.$t('export.defaultFileName')
        }
      } catch (error) {
        console.warn('获取根节点内容失败:', error)
        this.fileName = this.$t('export.defaultFileName')
      }
    },

    // 清理文件名中的非法字符
    sanitizeFileName(name) {
      // 首先移除HTML标签
      const cleanText = this.stripHtmlTags(name)

      // 移除或替换文件名中的非法字符
      return cleanText
        .replace(/[<>:"/\\|?*]/g, '') // 移除Windows非法字符
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim()
        .substring(0, 100) // 限制长度
    },

    // 移除HTML标签
    stripHtmlTags(html) {
      if (!html) return ''

      // 创建一个临时的div元素来解析HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html

      // 获取纯文本内容
      return tempDiv.textContent || tempDiv.innerText || ''
    },

    onPaddingChange() {
      this.$bus.$emit('paddingChange', {
        exportPaddingX: Number(this.paddingX),
        exportPaddingY: Number(this.paddingY)
      })
    },

    cancel() {
      this.dialogVisible = false
    },

    // 处理批量导出开关
    onBatchExportChange(enabled) {
      if (enabled) {
        this.selectedTypes = []
      } else {
        this.selectedTypes = []
      }
    },

    // 处理类型点击
    handleTypeClick(type) {
      if (this.enableBatchExport) {
        this.handleTypeSelect(type, !this.selectedTypes.includes(type))
      } else {
        this.exportType = type
      }
    },

    // 处理类型选择
    handleTypeSelect(type, selected) {
      if (selected) {
        if (!this.selectedTypes.includes(type)) {
          this.selectedTypes.push(type)
        }
      } else {
        const index = this.selectedTypes.indexOf(type)
        if (index > -1) {
          this.selectedTypes.splice(index, 1)
        }
      }
    },

    confirm() {
      this.setExtraTextOnExport(this.extraText)

      if (this.enableBatchExport) {
        // 批量导出
        if (this.selectedTypes.length === 0) {
          this.$message.warning(this.$t('export.selectAtLeastOne'))
          return
        }
        this.batchExport()
      } else {
        // 单个导出
        this.singleExport()
      }

      this.$notify.info({
        title: this.$t('export.notifyTitle'),
        message: this.$t('export.notifyMessage')
      })
      this.cancel()
    },

    // 单个导出
    singleExport() {
      // 确保文件名包含正确的扩展名
      let fileName = this.fileName
      const extMap = {
        mm: '.mm',
        emmx: '.emmx',
        mmap: '.mmap',
        svg: '.svg',
        smm: '.smm',
        json: '.json',
        png: '.png',
        pdf: '.pdf',
        md: '.md',
        xmind: '.xmind',
        txt: '.txt'
      }
      const ext = extMap[this.exportType] || extMap[this.imageFormat]
      if (ext && !fileName.toLowerCase().endsWith(ext.toLowerCase())) {
        fileName = fileName + ext
      }

      if (this.exportType === 'svg') {
        this.$bus.$emit(
          'export',
          this.exportType,
          true,
          fileName,
          `* {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }`
        )
      } else if (['smm', 'json'].includes(this.exportType)) {
        this.$bus.$emit(
          'export',
          this.exportType,
          true,
          fileName,
          this.widthConfig
        )
      } else if (this.exportType === 'png') {
        this.$bus.$emit(
          'export',
          this.imageFormat,
          true,
          fileName,
          this.isTransparent,
          null,
          this.isFitBg
        )
      } else if (this.exportType === 'pdf') {
        this.$bus.$emit(
          'export',
          this.exportType,
          true,
          fileName,
          this.isTransparent,
          this.isFitBg
        )
      } else if (['mm', 'emmx', 'mmap'].includes(this.exportType)) {
        this.$bus.$emit(
          'export',
          this.exportType,
          true,
          fileName
        )
      } else {
        this.$bus.$emit('export', this.exportType, true, fileName)
      }
    },

    // 批量导出
    async batchExport() {
      this.$bus.$emit('batchExport', this.selectedTypes, this.fileName)
    }
  }
}
</script>

<style lang="less" scoped>
.nodeExportDialog {
  .exportContainer {
    &.isDark {
      .downloadTypeSelectBox {
        .downloadTypeList {
          background-color: #363b3f;

          .downloadTypeItem {
            background-color: #363b3f;

            &.active {
              background-color: #262a2e;
            }

            .name {
              color: hsla(0, 0%, 100%, 0.9);
            }
          }
        }

        .downloadTypeContent {
          .nameInputBox {
            border-bottom: 1px solid hsla(0, 0%, 100%, 0.6);

            .nameInput {
              .name {
                color: hsla(0, 0%, 100%, 0.6);
              }
            }

            .closeBtn {
              color: hsla(0, 0%, 100%, 0.6);
            }
          }

          .contentBox {
            .contentRow {
              .contentName {
                color: hsla(0, 0%, 100%, 0.6);
              }

              .contentValue {
                color: hsla(0, 0%, 100%, 0.6);

                &.info {
                  background-color: transparent;
                }
              }
            }
          }

          .btnList {
            border-top: 1px solid hsla(0, 0%, 100%, 0.6);
          }
        }
      }
    }
  }
}

.nodeExportDialog {
  &.isDark {
    /deep/ .el-dialog__body {
      .el-checkbox {
        .el-checkbox__label {
          color: hsla(0, 0%, 100%, 0.6);
        }
      }
    }
  }

  /deep/ .el-dialog {
    border-radius: 10px;
    overflow: hidden;

    .el-dialog__header {
      display: none;
    }
  }

  /deep/ .el-dialog__body {
    padding: 0;

    .el-checkbox__input.is-checked + .el-checkbox__label {
      color: #409eff !important;
    }

    .el-checkbox {
      .el-checkbox__label {
        color: #1a1a1a;
      }
    }
  }

  &.isMobile {
    .exportContainer {
      .downloadTypeSelectBox {
        flex-direction: column;

        .downloadTypeList {
          width: 100%;
          display: flex;
          align-items: center;
          overflow-x: auto;
          height: 60px;
          overflow-y: hidden;

          .downloadTypeItem {
            width: 100px;
            flex-shrink: 0;
            padding-left: 5px;
            padding-right: 5px;

            .icon {
              margin-right: 5px;

              &.checked {
                display: none !important;
              }
            }
          }
        }

        .downloadTypeContent {
          .nameInputBox {
            height: 70px;

            .nameInput {
              .name {
                margin-bottom: 5px;
              }
            }
          }

          .contentBox {
            .contentRow {
              flex-direction: column;

              .contentName {
                margin-bottom: 10px;
              }

              .contentValue {
                .valueItem {
                  .valueSubItem {
                    display: flex;
                    flex-direction: column;

                    .name {
                      margin-bottom: 5px;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .exportContainer {
    width: 100%;
    height: 552px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .downloadTypeSelectBox {
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;

      .downloadTypeList {
        width: 208px;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: #f2f4f7;
        flex-shrink: 0;
        padding: 16px 0;

        .batchExportHeader {
          padding: 8px 16px;
          border-bottom: 1px solid #e4e7ed;
          margin-bottom: 8px;
        }

        .downloadTypeItem {
          width: 100%;
          height: 52px;
          padding: 0 30px;
          overflow: hidden;
          display: flex;
          align-items: center;
          cursor: pointer;

          &.active {
            background-color: #fff;

            .icon {
              &.checked {
                display: block;
              }
            }
          }

          &.selected {
            background-color: #e6f7ff;
            border-left: 3px solid #409eff;
          }

          .icon {
            font-size: 25px;
            font-weight: 700;

            &.checked {
              color: #409eff;
              font-size: 20px;
              margin-left: auto;
              display: none;
            }
          }

          .typeIcon {
            margin-right: 18px;
            flex-shrink: 0;
            width: 23px;
            height: 26px;
            background-size: cover;

            &.png {
              background-image: url('../../../assets/img/foramt/2.png');
            }

            &.pdf {
              background-image: url('../../../assets/img/foramt/4.png');
            }

            &.md {
              background-image: url('../../../assets/img/foramt/5.png');
            }

            &.json {
              background-image: url('../../../assets/img/foramt/10.png');
            }

            &.svg {
              background-image: url('../../../assets/img/foramt/3.png');
            }

            &.smm {
              background-image: url('../../../assets/img/foramt/1.png');
            }

            &.xmind {
              background-image: url('../../../assets/img/foramt/6.png');
            }

            &.txt {
              background-image: url('../../../assets/img/foramt/7.png');
            }

            &.mm {
              background-image: url('../../../assets/img/foramt/8.png');
            }

            &.xlsx {
              background-image: url('../../../assets/img/foramt/9.png');
            }
          }

          .name {
            color: #333;
            font-size: 15px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: bold;
          }
        }
      }

      .downloadTypeContent {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .nameInputBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 67px;
          flex-shrink: 0;
          border-bottom: 1px solid #f2f4f7;
          padding-left: 40px;
          padding-right: 20px;
          padding-top: 16px;

          .nameInput {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            width: 100%;
            font-weight: bold;

            .name {
              margin-right: 10px;
              font-size: 15px;
              color: #333;
              font-weight: bold;
            }
          }

          .closeBtn {
            font-size: 20px;
            cursor: pointer;
          }
        }

        .contentBox {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 15px 40px;

          .contentRow {
            display: flex;
            font-size: 14px;
            margin-bottom: 20px;

            &:last-of-type {
              margin-bottom: 0;
            }

            .contentName {
              min-width: 40px;
              color: #808080;
              flex-shrink: 0;
              font-size: 13px;
              font-weight: 500;
              line-height: 25px;
              margin-right: 12px;
            }

            .contentValue {
              color: #808080;
              line-height: 23px;
              font-weight: 500;
              border: 1px solid transparent;
              font-size: 14px;

              &.info {
                color: rgb(90, 158, 247);
                background-color: rgb(245, 248, 249);
                border: 1px solid rgb(90, 158, 247);
                border-radius: 5px;
                padding: 0 16px;
              }

              .valueItem {
                .valueSubItem {
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;

                  &:last-of-type {
                    margin-right: 0;
                  }

                  &.alignCenter {
                    align-items: center;
                  }

                  .name {
                    margin-right: 12px;
                    min-width: 85px;
                  }
                }
              }
            }
          }
        }

        .btnList {
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 69px;
          flex-shrink: 0;
          border-top: 1px solid #f2f4f7;

          /deep/ .el-button--small {
            height: 25px;
            padding: 0 30px;
            border-radius: 5px;
          }
        }
      }
    }
  }
}
</style>