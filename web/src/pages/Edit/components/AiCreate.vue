<template>
  <div>
    <!-- 客户端连接失败提示弹窗 -->
    <el-dialog
      class="clientTipDialog"
      :title="$t('ai.connectFailedTitle')"
      :visible.sync="clientTipDialogVisible"
      width="400px"
      append-to-body
    >
      <div class="tipBox">
        <p>{{ $t('ai.connectFailedTip') }}</p>
        <p>
          {{ $t('ai.connectFailedCheckTip1')
          }}<a
            href="https://pan.baidu.com/s/1huasEbKsGNH2Af68dvWiOg?pwd=3bp3"
            >{{ $t('ai.baiduNetdisk') }}</a
          >、<a href="https://github.com/wanglin2/mind-map/releases">Github</a>
        </p>
        <p>{{ $t('ai.connectFailedCheckTip2') }}</p>
        <P>{{ $t('ai.connectFailedCheckTip3') }}</P>
        <p>
          {{ $t('ai.connectFailedCheckTip4')
          }}<el-button size="small" @click="testConnect">{{
            $t('ai.connectionDetection')
          }}</el-button>
        </p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="clientTipDialogVisible = false">{{
          $t('ai.close')
        }}</el-button>
      </div>
    </el-dialog>
    <!-- ai内容输入弹窗 -->
    <el-dialog
      class="createDialog"
      :title="$t('ai.createMindMapTitle')"
      :visible.sync="createDialogVisible"
      width="450px"
      append-to-body
    >
      <div class="inputBox">
        <el-input
          type="textarea"
          :rows="5"
          :placeholder="$t('ai.createTip')"
          v-model="aiInput"
        >
        </el-input>
        <div class="tip warning">
          {{ $t('ai.importantTip') }}
        </div>
        <div class="tip">
          {{ $t('ai.wantModifyAiConfigTip')
          }}<el-button size="small" @click="showAiConfigDialog">{{
            $t('ai.modifyAIConfiguration')
          }}</el-button>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeAiCreateDialog">{{
          $t('ai.cancel')
        }}</el-button>
        <el-button type="primary" @click="doAiCreate">{{
          $t('ai.confirm')
        }}</el-button>
      </div>
    </el-dialog>
    <!-- ai生成中添加一个透明层，防止期间用户进行操作 -->
    <div
      class="aiCreatingMask"
      ref="aiCreatingMaskRef"
      v-show="aiCreatingMaskVisible"
    >
      <el-button type="warning" class="btn" @click="stopCreate">{{
        $t('ai.stopGenerating')
      }}</el-button>
    </div>
    <AiConfigDialog v-model="aiConfigDialogVisible"></AiConfigDialog>
    <!-- AI续写 -->
    <el-dialog
      class="createDialog"
      :title="$t('ai.aiCreatePart')"
      :visible.sync="createPartDialogVisible"
      width="500px"
      append-to-body
    >
      <div class="inputBox">
        <div class="prompt-section">
          <h4>{{ $t('ai.systemPrompt') }}</h4>
          <el-input
            type="textarea"
            :rows="3"
            v-model="systemPrompt"
            :readonly="true"
          ></el-input>
        </div>
        <div class="prompt-section">
          <h4>{{ $t('ai.userPrompt') }}</h4>
          <el-input
            type="textarea"
            :rows="3"
            v-model="userPrompt"
            :placeholder="$t('ai.userPromptPlaceholder')"
          ></el-input>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeAiCreatePartDialog">{{
          $t('ai.cancel')
        }}</el-button>
        <el-button type="primary" @click="confirmAiCreatePart">{{
          $t('ai.confirm')
        }}</el-button>
      </div>
    </el-dialog>

    <!-- 思维导图体系化检查 -->
    <el-dialog
      class="systemCheckDialog"
      :title="$t('ai.systemCheckTitle')"
      :visible.sync="systemCheckDialogVisible"
      width="700px"
      append-to-body
    >
      <div class="systemCheckContent">
        <div v-if="systemCheckLoading" class="loading-section">
          <el-icon class="is-loading"><i class="el-icon-loading"></i></el-icon>
          <span>{{ $t('ai.analyzingSystem') }}</span>
        </div>

        <div v-else-if="systemCheckResult" class="result-section">
          <!-- 总体评分 -->
          <div class="score-section">
            <div class="score-circle">
              <div class="score-number">{{ systemCheckResult.totalScore }}%</div>
              <div class="score-label">{{ $t('ai.systemScore') }}</div>
            </div>
            <div class="score-level">
              <span :class="getScoreLevelClass(systemCheckResult.totalScore)">
                {{ getScoreLevel(systemCheckResult.totalScore) }}
              </span>
            </div>
          </div>

          <!-- 详细评分 -->
          <div class="detail-scores">
            <h4>{{ $t('ai.detailScores') }}</h4>
            <div class="score-item" v-for="item in systemCheckResult.detailScores" :key="item.name">
              <div class="score-item-header">
                <span class="score-name">{{ item.name }}</span>
                <span class="score-value">{{ item.score }}%</span>
              </div>
              <el-progress :percentage="item.score" :color="getProgressColor(item.score)"></el-progress>
            </div>
          </div>

          <!-- 问题列表 -->
          <div class="issues-section" v-if="systemCheckResult.issues.length > 0">
            <h4>{{ $t('ai.foundIssues') }}</h4>
            <div class="issue-item" v-for="(issue, index) in systemCheckResult.issues" :key="index">
              <div class="issue-header">
                <el-tag :type="getIssueTagType(issue.level)">{{ getIssueLevel(issue.level) }}</el-tag>
                <span class="issue-title">{{ issue.title }}</span>
              </div>
              <div class="issue-description">{{ issue.description }}</div>
              <div class="issue-path" v-if="issue.path">
                <span class="path-label">{{ $t('ai.issuePath') }}:</span>
                <span class="path-value">{{ issue.path }}</span>
              </div>
              <div class="issue-actions" v-if="issue.canNavigate || issue.canApply">
                <el-button
                  v-if="issue.canNavigate"
                  size="mini"
                  type="text"
                  @click="goToNode(issue.nodeUid)"
                  class="action-btn navigate-btn"
                >
                  <i class="el-icon-location"></i>
                  {{ $t('ai.goToNode') }}
                </el-button>
                <el-button
                  v-if="issue.canApply"
                  size="mini"
                  type="text"
                  @click="applySuggestion({
                    type: issue.suggestionType,
                    nodeUid: issue.nodeUid,
                    suggestedText: issue.suggestedText,
                    childTexts: issue.childTexts
                  })"
                  class="action-btn apply-btn"
                >
                  <i class="el-icon-check"></i>
                  {{ $t('ai.applySuggestion') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 改进建议 -->
          <div class="suggestions-section" v-if="systemCheckResult.suggestions.length > 0">
            <h4>{{ $t('ai.improvementSuggestions') }}</h4>
            <ul class="suggestions-list">
              <li v-for="(suggestion, index) in systemCheckResult.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <div class="footer-left">
          <el-checkbox v-model="keepDialogOpen" size="small">
            {{ $t('ai.keepDialogOpen') }}
          </el-checkbox>
        </div>
        <div class="footer-right">
          <el-button @click="closeSystemCheckDialog">{{ $t('ai.close') }}</el-button>
          <el-button type="primary" @click="startSystemCheck" :loading="systemCheckLoading">
            {{ systemCheckLoading ? $t('ai.analyzing') : $t('ai.recheck') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Ai from '@/utils/ai'
import { transformMarkdownTo } from 'simple-mind-map/src/parse/markdownTo'
import {
  createUid,
  isUndef,
  checkNodeOuter,
  getStrWithBrFromHtml
} from 'simple-mind-map/src/utils'
import { mapState } from 'vuex'
import AiConfigDialog from './AiConfigDialog.vue'

export default {
  components: {
    AiConfigDialog
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      aiInstance: null,
      isAiCreating: false,
      aiCreatingContent: '',

      isLoopRendering: false,
      uidMap: {},
      latestUid: '',

      clientTipDialogVisible: false,
      createDialogVisible: false,
      aiInput: '',
      aiCreatingMaskVisible: false,
      aiConfigDialogVisible: false,

      mindMapDataCache: '',
      beingAiCreateNodeUid: '',

      createPartDialogVisible: false,
      aiPartInput: '',
      beingCreatePartNode: null,
      systemPrompt: '',
      userPrompt: '用费曼式的语言来表述',

      // 体系化检查相关
      systemCheckDialogVisible: false,
      systemCheckLoading: false,
      systemCheckResult: null,
      keepDialogOpen: false // 跳转时是否保持对话框打开
    }
  },
  computed: {
    ...mapState(['aiConfig'])
  },
  created() {
    this.$bus.$on('ai_create_all', this.aiCrateAll)
    this.$bus.$on('ai_create_part', this.showAiCreatePartDialog)
    this.$bus.$on('ai_chat', this.aiChat)
    this.$bus.$on('ai_chat_stop', this.aiChatStop)
    this.$bus.$on('showAiConfigDialog', this.showAiConfigDialog)
    this.$bus.$on('system_check', this.showSystemCheckDialog)
  },
  mounted() {
    document.body.appendChild(this.$refs.aiCreatingMaskRef)
  },
  beforeDestroy() {
    this.$bus.$off('ai_create_all', this.aiCrateAll)
    this.$bus.$off('ai_create_part', this.showAiCreatePartDialog)
    this.$bus.$off('ai_chat', this.aiChat)
    this.$bus.$off('ai_chat_stop', this.aiChatStop)
    this.$bus.$off('showAiConfigDialog', this.showAiConfigDialog)
    this.$bus.$off('system_check', this.showSystemCheckDialog)
  },
  methods: {
    // 显示AI配置修改弹窗
    showAiConfigDialog() {
      this.aiConfigDialogVisible = true
    },

    // 客户端连接检测
    async testConnect() {
      try {
        await fetch(`http://localhost:3456/api/ai/test`, {
          method: 'GET'
        })
        this.$message.success(this.$t('ai.connectSuccessful'))
        this.clientTipDialogVisible = false
        this.createDialogVisible = true
      } catch (error) {
        console.log(error)
        this.$message.error(this.$t('ai.connectFailed'))
      }
    },

    // 检测ai是否可用
    async aiTest() {
      const currentProvider = this.aiConfig.currentProvider
      const providerConfig = this.aiConfig.providers[currentProvider]

      // 检查基本配置
      if (!currentProvider || !providerConfig || !providerConfig.api) {
        this.showAiConfigDialog()
        throw new Error(this.$t('ai.configurationMissing'))
      }

      // 对于非本地模型，检查API Key
      const isLocalProvider = ['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(currentProvider)
      if (!isLocalProvider) {
        const hasKey = providerConfig.key || providerConfig.secretId || providerConfig.apiKey
        if (!hasKey) {
          this.showAiConfigDialog()
          throw new Error(this.$t('ai.noApiKey'))
        }
      }
      // 检查连接
      let isConnect = false
      try {
        await fetch(`http://localhost:3456/api/ai/test`, {
          method: 'GET'
        })
        isConnect = true
      } catch (error) {
        console.log(error)
        this.clientTipDialogVisible = true
      }
      if (!isConnect) {
        throw new Error(this.$t('ai.connectFailed'))
      }
    },

    // AI生成整体
    async aiCrateAll() {
      try {
        await this.aiTest()
        this.createDialogVisible = true
      } catch (error) {
        console.log(error)
      }
    },

    // 关闭ai内容输入弹窗
    closeAiCreateDialog() {
      this.createDialogVisible = false
      this.aiInput = ''
    },

    // 确认生成
    doAiCreate() {
      const aiInputText = this.aiInput.trim()
      if (!aiInputText) {
        this.$message.warning(this.$t('ai.noInputTip'))
        return
      }
      this.closeAiCreateDialog()
      this.aiCreatingMaskVisible = true
      // 发起请求
      this.isAiCreating = true
      this.aiInstance = new Ai({
        port: 3456
      })
      const currentProvider = this.aiConfig.currentProvider || 'volcengine'
      const providerConfig = this.aiConfig.providers[currentProvider] || {}
      this.aiInstance.init(currentProvider, providerConfig)
      this.mindMap.renderer.setRootNodeCenter()
      this.mindMap.setData(null)
      this.aiInstance.request(
        {
          messages: [
            {
              role: 'user',
              content: `${this.$t(
                'ai.aiCreateMsgPrefix'
              )}${aiInputText}${this.$t('ai.aiCreateMsgPostfix')}`
            }
          ]
        },
        content => {
          if (content) {
            const arr = content.split(/\n+/)
            this.aiCreatingContent = arr.splice(0, arr.length - 1).join('\n')
          }
          this.loopRenderOnAiCreating()
        },
        content => {
          this.aiCreatingContent = content
          this.resetOnAiCreatingStop()
        },
        () => {
          this.resetOnAiCreatingStop()
          this.resetOnRenderEnd()
          this.$message.error(this.$t('ai.generationFailed'))
        }
      )
    },

    // AI请求完成或出错后需要复位的数据
    resetOnAiCreatingStop() {
      this.aiCreatingMaskVisible = false
      this.isAiCreating = false
      this.aiInstance = null
    },

    // 渲染结束后需要复位的数据
    resetOnRenderEnd() {
      this.isLoopRendering = false
      this.uidMap = {}
      this.aiCreatingContent = ''
      this.mindMapDataCache = ''
      this.beingAiCreateNodeUid = ''
    },

    // 停止生成
    stopCreate() {
      this.aiInstance.stop()
      this.isAiCreating = false
      this.aiCreatingMaskVisible = false
      this.$message.success(this.$t('ai.stoppedGenerating'))
    },

    // 轮询进行渲染
    loopRenderOnAiCreating() {
      if (!this.aiCreatingContent.trim() || this.isLoopRendering) return
      this.isLoopRendering = true
      const treeData = transformMarkdownTo(this.aiCreatingContent)
      this.addUid(treeData)
      let lastTreeData = JSON.stringify(treeData)

      // 在当前渲染完成时再进行下一次渲染
      const onRenderEnd = () => {
        // 处理超出画布的节点
        this.checkNodeOuter()

        // 如果生成结束数据渲染完毕，那么解绑事件
        if (!this.isAiCreating && !this.aiCreatingContent) {
          this.mindMap.off('node_tree_render_end', onRenderEnd)
          this.latestUid = ''
          return
        }

        const treeData = transformMarkdownTo(this.aiCreatingContent)
        this.addUid(treeData)
        // 正在生成中
        if (this.isAiCreating) {
          // 如果和上次数据一样则不触发重新渲染
          const curTreeData = JSON.stringify(treeData)
          if (curTreeData === lastTreeData) {
            setTimeout(() => {
              onRenderEnd()
            }, 500)
            return
          }
          lastTreeData = curTreeData
          this.mindMap.updateData(treeData)
        } else {
          // 已经生成结束
          // 还要触发一遍渲染，否则会丢失数据
          this.mindMap.updateData(treeData)
          this.resetOnRenderEnd()
          this.$message.success(this.$t('ai.aiGenerationSuccess'))
        }
      }
      this.mindMap.on('node_tree_render_end', onRenderEnd)

      this.mindMap.setData(treeData)
    },

    // 处理超出画布的节点
    checkNodeOuter() {
      if (this.latestUid) {
        const latestNode = this.mindMap.renderer.findNodeByUid(this.latestUid)
        if (latestNode) {
          const { isOuter, offsetLeft, offsetTop } = checkNodeOuter(
            this.mindMap,
            latestNode,
            100,
            100
          )
          if (isOuter) {
            this.mindMap.view.translateXY(offsetLeft, offsetTop)
          }
        }
      }
    },

    // 给AI生成的数据添加uid
    addUid(data) {
      const checkRepeatUidMap = {}
      const walk = (node, pUid = '') => {
        // 确保节点存在且有效
        if (!node || typeof node !== 'object') {
          console.warn('无效的节点数据:', node)
          return
        }

        // 初始化data对象
        if (!node.data) {
          node.data = {}
        }

        // 确保有文本内容
        if (!node.data.text && !node.text) {
          console.warn('节点缺少文本内容:', node)
          return
        }

        // 统一文本字段
        if (node.text && !node.data.text) {
          node.data.text = node.text
        }

        if (isUndef(node.data.uid)) {
          // 根据pUid+文本内容来复用上一次生成数据的uid
          const key = pUid + '-' + (node.data.text || '')
          node.data.uid = this.uidMap[key] || createUid()
          // 当前uid和之前的重复，那么重新生成一个。这种情况很少，但是以防万一
          if (checkRepeatUidMap[node.data.uid]) {
            node.data.uid = createUid()
          }
          this.latestUid = this.uidMap[key] = node.data.uid
          checkRepeatUidMap[node.data.uid] = true
        }
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            walk(child, node.data.uid)
          })
        }
      }
      walk(data)
    },

    // 获取节点的完整路径
    getNodePath(node) {
      const path = []
      let current = node
      while (current) {
        path.unshift(getStrWithBrFromHtml(current.getData('text')))
        current = current.parent
      }
      return path
    },

    // 获取同级节点内容
    getSiblingNodes(node) {
      if (!node.parent) return []
      return node.parent.children
        .filter(child => child !== node)
        .map(child => getStrWithBrFromHtml(child.getData('text')))
    },

    // 构建智能提示词
    buildSmartPrompt(node) {
      const nodePath = this.getNodePath(node)
      const siblings = this.getSiblingNodes(node)
      const currentLevel = nodePath.length

      let prompt = `我正在创建一个思维导图，需要你帮我扩展其中的一个分支。请仔细分析整体结构和上下文关系：\n\n`

      // 添加完整路径信息和层级分析
      prompt += `【思维导图结构分析】\n`
      prompt += `1. 完整路径：${nodePath.join(' → ')}\n`
      prompt += `2. 当前层级：第${currentLevel}层\n`

      // 添加同级节点信息（如果有）
      if (siblings.length > 0) {
        prompt += `3. 同级主题：${siblings.join('、')}\n`
      }

      // 强化路径连贯性要求
      prompt += `\n【核心要求】\n`
      prompt += `1. 路径连贯性：\n`
      prompt += `   - 必须与所属的整体路径保持连贯性及逐层细化深入\n`
      prompt += `   - 每一层的展开都要承接上一层的逻辑，形成清晰的递进关系\n`
      prompt += `   - 从根节点"${nodePath[0]}"到当前节点"${nodePath[nodePath.length - 1]}"的逻辑链条要完整\n\n`

      prompt += `2. 父子关联性：\n`
      prompt += `   - 生成的子节点必须与直接父主题"${nodePath[nodePath.length - 1]}"保持密切关联\n`
      prompt += `   - 不能偏离父主题的核心含义和范围\n`
      prompt += `   - 要体现对父主题的具体化、细分化或深入化\n\n`

      prompt += `3. 同级协调性：\n`
      if (siblings.length > 0) {
        prompt += `   - 考虑与同级主题"${siblings.join('、')}"的关联性和互补性\n`
        prompt += `   - 避免与同级主题重复或冲突\n`
        prompt += `   - 保持同级主题间的逻辑平衡\n\n`
      } else {
        prompt += `   - 生成的同级主题要保持逻辑平衡和相互补充\n\n`
      }

      prompt += `4. 内容规范：\n`
      prompt += `   - 每个节点描述简洁明确，通常不超过8个字\n`
      prompt += `   - 展开层级控制在1-2层，避免过度展开\n`
      prompt += `   - 内容要准确、专业、有实用价值\n`
      prompt += `   - 结构要清晰，便于理解和记忆\n\n`

      prompt += `请基于以上要求，为主题"${nodePath[nodePath.length - 1]}"生成合适的下级内容，确保与整个思维导图的逻辑体系高度一致。`

      return prompt
    },

    // 显示AI续写弹窗
    showAiCreatePartDialog(node) {
      this.beingCreatePartNode = node
      // 设置系统提示词
      this.systemPrompt = this.buildSmartPrompt(node)
      this.userPrompt = ''
      this.createPartDialogVisible = true
    },

    // 关闭AI续写弹窗
    closeAiCreatePartDialog() {
      this.createPartDialogVisible = false
    },

    // 复位AI续写弹窗数据
    resetAiCreatePartDialog() {
      this.beingCreatePartNode = null
      this.aiPartInput = ''
    },

    // 确认AI续写
    confirmAiCreatePart() {
      // 如果用户没有修改默认值，则使用默认值
      const userPrompt = this.userPrompt.trim() || '用费曼式的语言来表述'
      // 合并系统提示词和用户提示词
      this.aiPartInput = `${this.systemPrompt}\n用户补充要求: ${userPrompt}`
      this.closeAiCreatePartDialog()
      this.aiCreatePart()
    },

    // AI生成部分
    async aiCreatePart() {
      try {
        if (!this.beingCreatePartNode) {
          return
        }
        await this.aiTest()
        this.beingAiCreateNodeUid = this.beingCreatePartNode.getData('uid')
        const currentMindMapData = this.mindMap.getData()
        this.mindMapDataCache = JSON.stringify(currentMindMapData)
        this.aiCreatingMaskVisible = true
        // 发起请求
        this.isAiCreating = true
        this.aiInstance = new Ai({
          port: 3456
        })
        const currentProvider = this.aiConfig.currentProvider || 'volcengine'
        const providerConfig = this.aiConfig.providers[currentProvider] || {}
        this.aiInstance.init(currentProvider, providerConfig)
        this.aiInstance.request(
          {
            messages: [
              {
                role: 'user',
                content:
                  this.aiPartInput.trim() + this.$t('ai.aiCreatePartMsgHelp')
              }
            ]
          },
          content => {
            // 实时更新内容并尝试渲染
            if (content) {
              const arr = content.split(/\n+/)
              this.aiCreatingContent = arr.splice(0, arr.length - 1).join('\n')
            }

            // 实时渲染，像mindmap015那样
            this.loopRenderOnAiCreatingPart()
          },
          content => {
            // AI完成后，进行最终处理
            this.aiCreatingContent = content
            console.log('AI完成，最终内容:', content)
            this.resetOnAiCreatingStop()
            this.resetAiCreatePartDialog()
          },
          () => {
            this.resetOnAiCreatingStop()
            this.resetAiCreatePartDialog()
            this.resetOnRenderEnd()
            this.$message.error(this.$t('ai.generationFailed'))
          }
        )
      } catch (error) {
        console.log(error)
      }
    },

    // 将生成的数据添加到指定节点上
    addToTargetNode(newChildren = []) {
      const initData = JSON.parse(this.mindMapDataCache)
      const walk = node => {
        if (node.data.uid === this.beingAiCreateNodeUid) {
          if (!node.children) {
            node.children = []
          }
          node.children.push(...newChildren)
          return
        }
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            walk(child)
          })
        }
      }
      walk(initData)
      return initData
    },

    // 轮询进行部分渲染
    loopRenderOnAiCreatingPart() {
      if (!this.aiCreatingContent.trim() || this.isLoopRendering) return
      this.isLoopRendering = true

      let partData, treeData, lastPartData, cleanContent

      try {
        // 清理AI内容，移除思考标签和其他无用内容
        cleanContent = this.aiCreatingContent
          .replace(/<think>[\s\S]*?<\/think>/g, '')  // 移除思考标签
          .replace(/^[\s\S]*?(?=#{1,6}\s|\*\s|-\s)/m, '')  // 移除开头的非Markdown内容
          .trim()

        console.log('原始内容长度:', this.aiCreatingContent.length)
        console.log('清理后的内容:', cleanContent)

        // 如果只有思考内容，跳过渲染但不报错
        if (this.aiCreatingContent.includes('<think>') && !cleanContent) {
          this.isLoopRendering = false
          return
        }

        // 如果清理后内容为空或太短，跳过渲染
        if (!cleanContent || cleanContent.length < 5) {
          this.isLoopRendering = false
          return
        }

        // 检查是否包含有效的Markdown结构，如果没有就跳过
        if (!cleanContent.match(/#{1,6}\s|^\s*[-*]\s/m)) {
          this.isLoopRendering = false
          return
        }

        partData = transformMarkdownTo(cleanContent)
        console.log('解析后的数据:', partData)

        if (!partData || typeof partData !== 'object') {
          console.warn('解析后的数据无效，原始内容:', this.aiCreatingContent)
          return
        }

        // 确保有children数组
        if (!partData.children || !Array.isArray(partData.children)) {
          console.warn('解析后的数据没有children数组')
          this.isLoopRendering = false
          return
        }

        this.addUid(partData)
        lastPartData = JSON.stringify(partData)
        treeData = this.addToTargetNode(partData.children || [])
      } catch (error) {
        console.error('渲染AI内容失败:', error)
        console.log('原始内容:', this.aiCreatingContent)
        console.log('清理后内容:', cleanContent)
        this.isLoopRendering = false
        return
      }

      // 在当前渲染完成时再进行下一次渲染
      const onRenderEnd = () => {
        // 处理超出画布的节点
        this.checkNodeOuter()

        // 如果生成结束数据渲染完毕，那么解绑事件
        if (!this.isAiCreating && !this.aiCreatingContent) {
          this.mindMap.off('node_tree_render_end', onRenderEnd)
          this.latestUid = ''
          return
        }

        // 重新解析当前内容
        try {
          const currentCleanContent = this.aiCreatingContent
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/^[\s\S]*?(?=#{1,6}\s|\*\s|-\s)/m, '')
            .trim()

          if (!currentCleanContent) return

          const currentPartData = transformMarkdownTo(currentCleanContent)
          if (!currentPartData || !currentPartData.children) return

          this.addUid(currentPartData)
          const currentTreeData = this.addToTargetNode(currentPartData.children || [])

          if (this.isAiCreating) {
            // 如果和上次数据一样则不触发重新渲染
            const curPartData = JSON.stringify(currentPartData)
            if (curPartData === lastPartData) {
              setTimeout(() => {
                onRenderEnd()
              }, 500)
              return
            }
            lastPartData = curPartData
            this.mindMap.updateData(currentTreeData)
          } else {
            this.mindMap.updateData(currentTreeData)
            this.resetOnRenderEnd()
            this.$message.success(this.$t('ai.aiGenerationSuccess'))
          }
        } catch (error) {
          console.error('onRenderEnd处理失败:', error)
        }
      }
      this.mindMap.on('node_tree_render_end', onRenderEnd)
      // 因为是续写，所以首次也直接使用updateData方法渲染
      this.mindMap.updateData(treeData)
    },

    // AI对话
    async aiChat(
      messageList = [],
      progress = () => {},
      end = () => {},
      err = () => {}
    ) {
      try {
        await this.aiTest()
        // 发起请求
        this.isAiCreating = true
        this.aiInstance = new Ai({
          port: 3456
        })
        const currentProvider = this.aiConfig.currentProvider || 'volcengine'
        const providerConfig = this.aiConfig.providers[currentProvider] || {}
        this.aiInstance.init(currentProvider, providerConfig)
        this.aiInstance.request(
          {
            messages: messageList.map(msg => {
              return {
                role: 'user',
                content: msg
              }
            })
          },
          content => {
            progress(content)
          },
          content => {
            end(content)
          },
          error => {
            err(error)
          }
        )
      } catch (error) {
        console.log(error)
      }
    },

    // AI对话停止
    aiChatStop() {
      if (this.aiInstance) {
        this.aiInstance.stop()
        this.isAiCreating = false
        this.aiInstance = null
      }
    },

    // 显示体系化检查对话框
    showSystemCheckDialog() {
      this.systemCheckDialogVisible = true
      this.startSystemCheck()
    },

    // 关闭体系化检查对话框
    closeSystemCheckDialog() {
      this.systemCheckDialogVisible = false
      this.systemCheckResult = null
    },

    // 获取思维导图实例
    getMindMapInstance() {
      // 直接返回props中的mindMap实例
      return Promise.resolve(this.mindMap)
    },

    // 跳转到指定节点
    async goToNode(nodeUid) {
      try {
        const mindMap = await this.getMindMapInstance()
        if (!mindMap) {
          this.$message.error('无法获取思维导图实例')
          return
        }

        // 根据用户选择决定是否隐藏对话框
        const originalVisible = this.systemCheckDialogVisible
        if (!this.keepDialogOpen) {
          this.systemCheckDialogVisible = false
        }

        // 使用SimpleMindMap的goTargetNode方法跳转到指定节点
        mindMap.renderer.goTargetNode(nodeUid, (targetNode) => {
          if (targetNode) {
            // 给节点添加临时高亮效果
            this.highlightNode(targetNode)
            this.$message.success('已跳转到问题节点')

            // 如果隐藏了对话框，3秒后重新显示
            if (!this.keepDialogOpen) {
              setTimeout(() => {
                this.systemCheckDialogVisible = originalVisible
              }, 3000)
            }
          } else {
            this.$message.error('未找到指定节点')
            // 如果跳转失败，立即恢复对话框
            if (!this.keepDialogOpen) {
              this.systemCheckDialogVisible = originalVisible
            }
          }
        })
      } catch (error) {
        console.error('跳转节点失败:', error)
        this.$message.error('跳转节点失败: ' + error.message)
        // 发生错误时恢复对话框
        this.systemCheckDialogVisible = true
      }
    },

    // 高亮显示节点
    highlightNode(node) {
      if (!node || !node.group) return

      try {
        // 保存原始样式
        const originalFill = node.group.findOne('.smm-node-shape').attr('fill')
        const originalStroke = node.group.findOne('.smm-node-shape').attr('stroke')
        const originalStrokeWidth = node.group.findOne('.smm-node-shape').attr('stroke-width')

        // 应用高亮样式
        const shape = node.group.findOne('.smm-node-shape')
        if (shape) {
          shape.attr({
            'fill': '#fff2cc',
            'stroke': '#ff6b6b',
            'stroke-width': 3
          })

          // 添加闪烁动画
          let blinkCount = 0
          const blinkInterval = setInterval(() => {
            if (blinkCount >= 6) {
              // 恢复原始样式
              shape.attr({
                'fill': originalFill,
                'stroke': originalStroke,
                'stroke-width': originalStrokeWidth
              })
              clearInterval(blinkInterval)
              return
            }

            // 切换高亮状态
            if (blinkCount % 2 === 0) {
              shape.attr({
                'fill': '#ffeb3b',
                'stroke': '#ff5722',
                'stroke-width': 4
              })
            } else {
              shape.attr({
                'fill': '#fff2cc',
                'stroke': '#ff6b6b',
                'stroke-width': 3
              })
            }
            blinkCount++
          }, 300)
        }
      } catch (error) {
        console.warn('高亮节点失败:', error)
      }
    },

    // 应用建议到思维导图
    async applySuggestion(suggestion) {
      try {
        const mindMap = await this.getMindMapInstance()
        if (!mindMap) {
          this.$message.error('无法获取思维导图实例')
          return
        }

        // 根据建议类型执行不同的操作
        switch (suggestion.type) {
          case 'fillEmptyNode':
            await this.fillEmptyNode(mindMap, suggestion)
            break
          case 'addChildNode':
            await this.addChildNode(mindMap, suggestion)
            break
          case 'deleteEmptyNode':
            await this.deleteEmptyNode(mindMap, suggestion)
            break
          case 'mergeNodes':
            await this.mergeNodes(mindMap, suggestion)
            break
          case 'restructureHierarchy':
            await this.restructureHierarchy(mindMap, suggestion)
            break
          case 'enrichContent':
            await this.enrichContent(mindMap, suggestion)
            break
          default:
            this.$message.warning('暂不支持此类型的建议应用')
            return
        }

        this.$message.success('建议已成功应用到思维导图')
        // 重新分析以更新结果
        this.startSystemCheck()
      } catch (error) {
        console.error('应用建议失败:', error)
        this.$message.error('应用建议失败: ' + error.message)
      }
    },

    // 填充空节点
    async fillEmptyNode(mindMap, suggestion) {
      const node = mindMap.renderer.findNodeByUid(suggestion.nodeUid)
      if (node) {
        const suggestedText = suggestion.suggestedText || '新内容'
        mindMap.execCommand('SET_NODE_TEXT', node, suggestedText)
      }
    },

    // 添加子节点
    async addChildNode(mindMap, suggestion) {
      const node = mindMap.renderer.findNodeByUid(suggestion.nodeUid)
      if (node) {
        const childTexts = suggestion.childTexts || ['子节点1', '子节点2']
        childTexts.forEach(text => {
          mindMap.execCommand('INSERT_CHILD_NODE', false, [node], text)
        })
        mindMap.execCommand('SET_NODE_EXPAND', node, true)
      }
    },

    // 删除空节点
    async deleteEmptyNode(mindMap, suggestion) {
      const node = mindMap.renderer.findNodeByUid(suggestion.nodeUid)
      if (node && !node.isRoot) {
        mindMap.execCommand('REMOVE_NODE', [node])
      }
    },

    // 合并节点
    async mergeNodes(mindMap, suggestion) {
      // 这里可以实现节点合并逻辑
      this.$message.info('节点合并功能正在开发中')
    },

    // 重构层级
    async restructureHierarchy(mindMap, suggestion) {
      // 这里可以实现层级重构逻辑
      this.$message.info('层级重构功能正在开发中')
    },

    // 丰富内容
    async enrichContent(mindMap, suggestion) {
      const node = mindMap.renderer.findNodeByUid(suggestion.nodeUid)
      if (node) {
        const currentText = node.getData('text') || ''
        const enrichedText = suggestion.enrichedText || currentText + ' (已丰富)'
        mindMap.execCommand('SET_NODE_TEXT', node, enrichedText)
      }
    },

    // 开始体系化检查
    async startSystemCheck() {
      this.systemCheckLoading = true
      this.systemCheckResult = null

      try {
        // 获取思维导图数据
        const mindMapData = this.mindMap.getData(true)

        // 执行检查分析
        const result = await this.analyzeMindMapSystem(mindMapData)
        this.systemCheckResult = result
      } catch (error) {
        console.error('体系化检查失败:', error)
        this.$message.error(this.$t('ai.systemCheckFailed'))
      } finally {
        this.systemCheckLoading = false
      }
    },

    // 分析思维导图体系化程度
    async analyzeMindMapSystem(data) {
      const analysis = {
        totalScore: 0,
        detailScores: [],
        issues: [],
        suggestions: []
      }

      // 1. 结构完整性检查
      const structureScore = this.checkStructureIntegrity(data.root)
      analysis.detailScores.push({
        name: this.$t('ai.structureIntegrity'),
        score: structureScore.score
      })
      analysis.issues.push(...structureScore.issues)

      // 2. 逻辑连贯性检查
      const logicScore = this.checkLogicCoherence(data.root)
      analysis.detailScores.push({
        name: this.$t('ai.logicCoherence'),
        score: logicScore.score
      })
      analysis.issues.push(...logicScore.issues)

      // 3. 层级合理性检查
      const hierarchyScore = this.checkHierarchyRationality(data.root)
      analysis.detailScores.push({
        name: this.$t('ai.hierarchyRationality'),
        score: hierarchyScore.score
      })
      analysis.issues.push(...hierarchyScore.issues)

      // 4. 内容丰富度检查
      const contentScore = this.checkContentRichness(data.root)
      analysis.detailScores.push({
        name: this.$t('ai.contentRichness'),
        score: contentScore.score
      })
      analysis.issues.push(...contentScore.issues)

      // 5. 平衡性检查
      const balanceScore = this.checkBalance(data.root)
      analysis.detailScores.push({
        name: this.$t('ai.structureBalance'),
        score: balanceScore.score
      })
      analysis.issues.push(...balanceScore.issues)

      // 计算总分
      analysis.totalScore = Math.round(
        analysis.detailScores.reduce((sum, item) => sum + item.score, 0) / analysis.detailScores.length
      )

      // 生成改进建议
      analysis.suggestions = this.generateSuggestions(analysis)

      return analysis
    },

    // 检查结构完整性
    checkStructureIntegrity(root) {
      const result = { score: 100, issues: [] }

      // 检查是否有空节点
      const emptyNodes = this.findEmptyNodes(root, [])
      if (emptyNodes.length > 0) {
        result.score -= Math.min(emptyNodes.length * 10, 30)
        emptyNodes.forEach(nodeInfo => {
          result.issues.push({
            level: 'warning',
            title: this.$t('ai.emptyNodeFound'),
            description: this.$t('ai.emptyNodeDesc'),
            path: nodeInfo.path,
            nodeUid: nodeInfo.nodeUid,
            canNavigate: true,
            canApply: true,
            suggestionType: 'fillEmptyNode',
            suggestedText: '新内容'
          })
        })
      }

      // 检查单子节点情况
      const singleChildNodes = this.findSingleChildNodes(root, [])
      if (singleChildNodes.length > 0) {
        result.score -= Math.min(singleChildNodes.length * 5, 20)
        singleChildNodes.forEach(nodeInfo => {
          result.issues.push({
            level: 'info',
            title: this.$t('ai.singleChildNode'),
            description: this.$t('ai.singleChildNodeDesc'),
            path: nodeInfo.path,
            nodeUid: nodeInfo.nodeUid,
            canNavigate: true,
            canApply: true,
            suggestionType: 'addChildNode',
            childTexts: ['子节点1', '子节点2']
          })
        })
      }

      return result
    },

    // 检查逻辑连贯性
    checkLogicCoherence(root) {
      const result = { score: 100, issues: [] }

      // 检查同级节点的相关性
      const incoherentSiblings = this.findIncoherentSiblings(root, [])
      if (incoherentSiblings.length > 0) {
        result.score -= Math.min(incoherentSiblings.length * 15, 40)
        incoherentSiblings.forEach(item => {
          result.issues.push({
            level: 'warning',
            title: this.$t('ai.incoherentSiblings'),
            description: this.$t('ai.incoherentSiblingsDesc'),
            path: item.path
          })
        })
      }

      return result
    },

    // 检查层级合理性
    checkHierarchyRationality(root) {
      const result = { score: 100, issues: [] }

      // 检查层级深度
      const maxDepth = this.getMaxDepth(root)
      if (maxDepth > 6) {
        result.score -= (maxDepth - 6) * 10
        result.issues.push({
          level: 'warning',
          title: this.$t('ai.tooDeepHierarchy'),
          description: this.$t('ai.tooDeepHierarchyDesc', { depth: maxDepth }),
          path: ''
        })
      }

      // 检查层级跨度过大的情况
      const depthVariance = this.getDepthVariance(root)
      if (depthVariance > 3) {
        result.score -= (depthVariance - 3) * 5
        result.issues.push({
          level: 'info',
          title: this.$t('ai.unevenDepth'),
          description: this.$t('ai.unevenDepthDesc'),
          path: ''
        })
      }

      return result
    },

    // 检查内容丰富度
    checkContentRichness(root) {
      const result = { score: 100, issues: [] }

      const totalNodes = this.countNodes(root)
      const nodesWithShortText = this.findShortTextNodes(root, [])

      if (nodesWithShortText.length / totalNodes > 0.7) {
        result.score -= 20
        result.issues.push({
          level: 'info',
          title: this.$t('ai.tooManyShortNodes'),
          description: this.$t('ai.tooManyShortNodesDesc'),
          path: ''
        })
      }

      return result
    },

    // 检查结构平衡性
    checkBalance(root) {
      const result = { score: 100, issues: [] }

      if (root.children && root.children.length > 0) {
        const childrenCounts = root.children.map(child => this.countNodes(child))
        const maxCount = Math.max(...childrenCounts)
        const minCount = Math.min(...childrenCounts)

        if (maxCount / minCount > 3 && maxCount > 5) {
          result.score -= 15
          result.issues.push({
            level: 'info',
            title: this.$t('ai.unbalancedStructure'),
            description: this.$t('ai.unbalancedStructureDesc'),
            path: ''
          })
        }
      }

      return result
    },

    // 辅助方法：查找空节点
    findEmptyNodes(node, currentPath) {
      const emptyNodes = []
      const nodePath = [...currentPath, this.getNodeText(node)]

      if (!this.getNodeText(node).trim()) {
        emptyNodes.push({
          path: nodePath.join(' → '),
          nodeUid: node.data.uid,
          nodeText: this.getNodeText(node)
        })
      }

      if (node.children) {
        node.children.forEach(child => {
          emptyNodes.push(...this.findEmptyNodes(child, nodePath))
        })
      }

      return emptyNodes
    },

    // 辅助方法：查找单子节点
    findSingleChildNodes(node, currentPath) {
      const singleChildNodes = []
      const nodePath = [...currentPath, this.getNodeText(node)]

      if (node.children && node.children.length === 1) {
        singleChildNodes.push({
          path: nodePath.join(' → '),
          nodeUid: node.data.uid,
          nodeText: this.getNodeText(node)
        })
      }

      if (node.children) {
        node.children.forEach(child => {
          singleChildNodes.push(...this.findSingleChildNodes(child, nodePath))
        })
      }

      return singleChildNodes
    },

    // 辅助方法：查找不连贯的同级节点
    findIncoherentSiblings(node, currentPath) {
      const incoherentSiblings = []
      const nodePath = [...currentPath, this.getNodeText(node)]

      // 这里可以添加更复杂的语义分析逻辑
      // 目前简化为检查同级节点文本长度差异过大的情况
      if (node.children && node.children.length > 1) {
        const textLengths = node.children.map(child => this.getNodeText(child).length)
        const maxLength = Math.max(...textLengths)
        const minLength = Math.min(...textLengths)

        if (maxLength > 0 && maxLength / minLength > 5) {
          incoherentSiblings.push({
            path: nodePath.join(' → ')
          })
        }
      }

      if (node.children) {
        node.children.forEach(child => {
          incoherentSiblings.push(...this.findIncoherentSiblings(child, nodePath))
        })
      }

      return incoherentSiblings
    },

    // 辅助方法：获取最大深度
    getMaxDepth(node, currentDepth = 0) {
      if (!node.children || node.children.length === 0) {
        return currentDepth
      }

      return Math.max(...node.children.map(child => this.getMaxDepth(child, currentDepth + 1)))
    },

    // 辅助方法：获取深度方差
    getDepthVariance(node) {
      const depths = this.getAllDepths(node, 0, [])
      if (depths.length <= 1) return 0

      const maxDepth = Math.max(...depths)
      const minDepth = Math.min(...depths)
      return maxDepth - minDepth
    },

    // 辅助方法：获取所有叶子节点深度
    getAllDepths(node, currentDepth, depths) {
      if (!node.children || node.children.length === 0) {
        depths.push(currentDepth)
      } else {
        node.children.forEach(child => {
          this.getAllDepths(child, currentDepth + 1, depths)
        })
      }
      return depths
    },

    // 辅助方法：统计节点数量
    countNodes(node) {
      let count = 1
      if (node.children) {
        node.children.forEach(child => {
          count += this.countNodes(child)
        })
      }
      return count
    },

    // 辅助方法：查找文本过短的节点
    findShortTextNodes(node, currentPath) {
      const shortNodes = []
      const nodePath = [...currentPath, this.getNodeText(node)]
      const text = this.getNodeText(node)

      if (text.trim().length > 0 && text.trim().length < 3) {
        shortNodes.push(nodePath.join(' → '))
      }

      if (node.children) {
        node.children.forEach(child => {
          shortNodes.push(...this.findShortTextNodes(child, nodePath))
        })
      }

      return shortNodes
    },

    // 辅助方法：获取节点文本
    getNodeText(node) {
      return node.data?.text || ''
    },

    // 生成改进建议
    generateSuggestions(analysis) {
      const suggestions = []

      if (analysis.totalScore < 60) {
        suggestions.push(this.$t('ai.suggestion.overallImprovement'))
      }

      const structureScore = analysis.detailScores.find(item => item.name === this.$t('ai.structureIntegrity'))?.score || 100
      if (structureScore < 80) {
        suggestions.push(this.$t('ai.suggestion.improveStructure'))
      }

      const logicScore = analysis.detailScores.find(item => item.name === this.$t('ai.logicCoherence'))?.score || 100
      if (logicScore < 80) {
        suggestions.push(this.$t('ai.suggestion.improveLogic'))
      }

      const hierarchyScore = analysis.detailScores.find(item => item.name === this.$t('ai.hierarchyRationality'))?.score || 100
      if (hierarchyScore < 80) {
        suggestions.push(this.$t('ai.suggestion.improveHierarchy'))
      }

      return suggestions
    },

    // 获取评分等级
    getScoreLevel(score) {
      if (score >= 90) return this.$t('ai.scoreLevel.excellent')
      if (score >= 80) return this.$t('ai.scoreLevel.good')
      if (score >= 70) return this.$t('ai.scoreLevel.fair')
      if (score >= 60) return this.$t('ai.scoreLevel.poor')
      return this.$t('ai.scoreLevel.veryPoor')
    },

    // 获取评分等级样式类
    getScoreLevelClass(score) {
      if (score >= 90) return 'score-excellent'
      if (score >= 80) return 'score-good'
      if (score >= 70) return 'score-fair'
      if (score >= 60) return 'score-poor'
      return 'score-very-poor'
    },

    // 获取进度条颜色
    getProgressColor(score) {
      if (score >= 90) return '#67c23a'
      if (score >= 80) return '#409eff'
      if (score >= 70) return '#e6a23c'
      if (score >= 60) return '#f56c6c'
      return '#f56c6c'
    },

    // 获取问题等级
    getIssueLevel(level) {
      const levels = {
        'error': this.$t('ai.issueLevel.error'),
        'warning': this.$t('ai.issueLevel.warning'),
        'info': this.$t('ai.issueLevel.info')
      }
      return levels[level] || level
    },

    // 获取问题标签类型
    getIssueTagType(level) {
      const types = {
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
      }
      return types[level] || 'info'
    }
  }
}
</script>

<style lang="less" scoped>
.clientTipDialog,
.createDialog,
.systemCheckDialog {
  /deep/ .el-dialog__body {
    padding: 12px 20px;
  }
}

.tipBox {
  p {
    margin-bottom: 12px;

    a {
      color: #409eff;
    }
  }
}

.inputBox {
  .tip {
    margin-top: 12px;

    &.warning {
      color: #f56c6c;
    }
  }
}

.aiCreatingMask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  background-color: transparent;

  .btn {
    position: absolute;
    left: 50%;
    top: 100px;
    transform: translateX(-50%);
  }
}

// 体系化检查样式
.systemCheckContent {
  .loading-section {
    text-align: center;
    padding: 40px 0;

    .el-icon {
      font-size: 24px;
      margin-right: 8px;
      color: #409eff;
    }

    span {
      font-size: 16px;
      color: #666;
    }
  }

  .result-section {
    .score-section {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;

      .score-circle {
        text-align: center;
        margin-right: 30px;

        .score-number {
          font-size: 48px;
          font-weight: bold;
          color: #2c3e50;
          line-height: 1;
        }

        .score-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
      }

      .score-level {
        .score-excellent { color: #67c23a; font-weight: bold; }
        .score-good { color: #409eff; font-weight: bold; }
        .score-fair { color: #e6a23c; font-weight: bold; }
        .score-poor { color: #f56c6c; font-weight: bold; }
        .score-very-poor { color: #f56c6c; font-weight: bold; }
      }
    }

    .detail-scores {
      margin-bottom: 25px;

      h4 {
        margin-bottom: 15px;
        color: #2c3e50;
        border-bottom: 2px solid #e1e8ed;
        padding-bottom: 8px;
      }

      .score-item {
        margin-bottom: 15px;

        .score-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .score-name {
            font-weight: 500;
            color: #2c3e50;
          }

          .score-value {
            font-weight: bold;
            color: #409eff;
          }
        }
      }
    }

    .issues-section {
      margin-bottom: 25px;

      h4 {
        margin-bottom: 15px;
        color: #2c3e50;
        border-bottom: 2px solid #e1e8ed;
        padding-bottom: 8px;
      }

      .issue-item {
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid #e1e8ed;
        border-radius: 6px;
        background: #fafbfc;

        .issue-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;

          .el-tag {
            margin-right: 10px;
          }

          .issue-title {
            font-weight: 500;
            color: #2c3e50;
          }
        }

        .issue-description {
          color: #666;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .issue-path {
          .path-label {
            font-weight: 500;
            color: #666;
          }

          .path-value {
            color: #409eff;
            font-family: 'Consolas', monospace;
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            margin-left: 5px;
          }
        }

        .issue-actions {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #e1e8ed;
          display: flex;
          gap: 8px;

          .action-btn {
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            transition: all 0.2s;

            &.navigate-btn {
              color: #409eff;

              &:hover {
                background-color: #ecf5ff;
                color: #337ecc;
              }

              i {
                margin-right: 4px;
              }
            }

            &.apply-btn {
              color: #67c23a;

              &:hover {
                background-color: #f0f9ff;
                color: #529b2e;
              }

              i {
                margin-right: 4px;
              }
            }
          }
        }
      }
    }

    .suggestions-section {
      h4 {
        margin-bottom: 15px;
        color: #2c3e50;
        border-bottom: 2px solid #e1e8ed;
        padding-bottom: 8px;
      }

      .suggestions-list {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: #666;
          line-height: 1.5;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      flex: 1;

      .el-checkbox {
        color: #666;
        font-size: 12px;
      }
    }

    .footer-right {
      display: flex;
      gap: 10px;
    }
  }
}
</style>