<template>
  <div class="ai-explain">
    <el-dialog
      :title="$t('ai.explain')"
      :visible.sync="visible"
      :append-to-body="true"
      :close-on-click-modal="false"
      custom-class="ai-explain-dialog"
      width="500px"
    >
      <div class="content">
        <div v-if="loading" class="loading">
          <i class="el-icon-loading"></i>
          <span>{{ $t('ai.generating') }}</span>
        </div>
        <div v-else-if="error" class="error">
          <i class="el-icon-warning"></i>
          <span>{{ error }}</span>
        </div>
        <div v-else-if="explanation" class="explanation">
          <div class="explanation-content">{{ explanation }}</div>
        </div>
        <div v-else class="empty">
          <i class="el-icon-info"></i>
          <span>{{ $t('ai.noExplanation') }}</span>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="visible = false">{{ $t('button.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="handleApply"
          :disabled="!explanation || loading"
        >{{ $t('ai.apply') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import aiService from '@/service/aiService'

export default {
  name: 'AiExplain',
  
  props: {
    mindMap: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      visible: false,
      loading: false,
      error: '',
      explanation: '',
      currentNode: null
    }
  },
  
  mounted() {
    this.$bus.$on('ai_explain', this.handleAiExplain)
  },
  
  beforeDestroy() {
    this.$bus.$off('ai_explain', this.handleAiExplain)
  },
  
  methods: {
    // 处理AI解释
    async handleAiExplain(nodeData) {
      if (!nodeData) {
        this.$message.error(this.$t('ai.emptyNode'))
        return
      }
      
      const nodeText = nodeData.getData('text')
      if (!nodeText) {
        this.$message.error(this.$t('ai.emptyNode'))
        return
      }
      
      this.currentNode = nodeData
      this.visible = true
      this.loading = true
      this.error = ''
      this.explanation = ''
      
      try {
        // 检查AI配置
        const aiConfig = this.$store.state.aiConfig
        const currentProvider = aiConfig.currentProvider
        const providerConfig = aiConfig.providers[currentProvider]

        if (!currentProvider || !providerConfig || !providerConfig.api) {
          throw new Error(this.$t('ai.configurationMissing'))
        }

        // 对于非本地模型，检查API Key
        const isLocalProvider = ['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(currentProvider)
        if (!isLocalProvider) {
          const hasKey = providerConfig.key || providerConfig.secretId || providerConfig.apiKey
          if (!hasKey) {
            throw new Error(this.$t('ai.noApiKey'))
          }
        }

        // 调用AI服务获取解释
        this.explanation = await aiService.explainNode(nodeData)
      } catch (error) {
        console.error('AI解释失败:', error)
        this.error = error.message || this.$t('ai.requestFailed')
        // 显示更详细的错误信息
        if (error.response) {
          this.error = `${this.$t('ai.requestFailed')}: ${error.response.status} - ${error.response.data?.message || ''}`
        }
      } finally {
        this.loading = false
      }
    },
    
    // 应用解释
    handleApply() {
      if (!this.explanation || !this.currentNode) return
      
      this.$bus.$emit('apply_ai_explanation', this.currentNode, this.explanation)
      this.visible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.ai-explain {
  .content {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
    
    .loading, .error, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      
      i {
        font-size: 32px;
        margin-bottom: 10px;
      }
    }
    
    .error {
      color: #f56c6c;
    }
    
    .explanation {
      padding: 10px;
      
      &-content {
        white-space: pre-wrap;
        line-height: 1.5;
      }
    }
  }
}
</style>