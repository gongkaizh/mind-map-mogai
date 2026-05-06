<template>
  <Sidebar ref="sidebar" :title="$t('ai.suggest')">
    <div class="aiSuggestBox" :class="{ isDark: isDark }">
      <div class="suggestHeader">
        <el-button size="mini" @click="modifyAiConfig">
          <span class="el-icon-edit"></span>
          {{ $t('ai.modifyAIConfiguration') }}
        </el-button>
      </div>
      <div class="suggestContent customScrollbar">
        <div v-if="isAnalyzing" class="analyzing">
          <i class="el-icon-loading"></i>
          <div class="status-message">{{ statusMessage }}</div>
        </div>
        <div v-else-if="suggestion" class="suggestion">
          <div class="suggestionText" v-html="formattedSuggestion"></div>
          <div class="actions">
            <el-button size="mini" type="primary" @click="applySuggestion">
              {{ $t('ai.appliedSuggestion') }}
            </el-button>
            <el-button size="mini" @click="regenerate">
              <i class="el-icon-refresh"></i>
              {{ $t('ai.regenerate') }}
            </el-button>
          </div>
        </div>
        <div v-else class="noSuggestion">
          <p>{{ $t('ai.noSuggestionYet') }}</p>
        </div>
      </div>
      <div class="suggestFooter">
        <el-button
          class="stop"
          size="mini"
          type="warning"
          @click="stop"
          v-show="isAnalyzing"
        >
          {{ $t('ai.stopGenerating') }}
        </el-button>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'vuex'
import MarkdownIt from 'markdown-it'

let md = null

export default {
  name: 'AiSuggest',
  components: {
    Sidebar
  },
  data() {
    return {
      isAnalyzing: false,
      suggestion: '',
      currentNodeData: null,
      statusMessage: ''
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      activeSidebar: state => state.activeSidebar
    }),
    formattedSuggestion() {
      if (!this.suggestion) return ''
      if (!md) {
        md = new MarkdownIt()
      }
      return md.render(this.suggestion)
    }
  },
  watch: {
    activeSidebar(val) {
      if (val === 'aiSuggest') {
        this.$refs.sidebar.show = true
      } else {
        this.$refs.sidebar.show = false
      }
    }
  },
  mounted() {
    this.$bus.$on('ai_suggest', this.handleAiSuggest)
  },
  beforeDestroy() {
    this.$bus.$off('ai_suggest', this.handleAiSuggest)
  },
  methods: {
    handleAiSuggest(nodeData) {
      if (this.isAnalyzing) return
      
      this.currentNodeData = nodeData
      this.isAnalyzing = true
      this.suggestion = ''
      this.statusMessage = this.$t('ai.suggestStarting')
      
      // 打开侧边栏
      this.$store.commit('setActiveSidebar', 'aiSuggest')
      
      // 构建提示词
      const prompt = `请基于以下思维导图节点内容，提供扩展建议，包括可能的子节点、相关概念或深入思考方向：\n\n${nodeData.text}`
      
      // 直接调用AI服务
      this.callAiService(prompt)
    },
    
    applySuggestion() {
      if (!this.suggestion || !this.currentNodeData) return
      
      // 将建议应用到当前节点，创建子节点
      this.$bus.$emit('apply_ai_suggestion', this.currentNodeData, this.suggestion)
      this.$message.success(this.$t('ai.appliedSuggestion'))
    },
    
    regenerate() {
      if (!this.currentNodeData) return
      this.handleAiSuggest(this.currentNodeData)
    },
    
    stop() {
      this.$bus.$emit('ai_generate_stop')
      this.isAnalyzing = false
    },
    
    modifyAiConfig() {
      this.$bus.$emit('showAiConfigDialog')
    },

    // 构建请求头
    buildHeaders(aiConfig) {
      const provider = aiConfig.provider || 'volcengine'

      switch (provider) {
        case 'openai':
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.key}`
          }

        case 'claude':
          return {
            'Content-Type': 'application/json',
            'x-api-key': aiConfig.key,
            'anthropic-version': '2023-06-01'
          }

        case 'volcengine':
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.key}`
          }

        case 'qianwen':
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.key}`,
            'X-DashScope-SSE': 'enable'
          }

        case 'baidu':
          return {
            'Content-Type': 'application/json'
          }

        case 'kimi':
        case 'deepseek':
        case 'zhipu':
        case 'yi':
        case 'doubao':
        case 'stepfun':
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.key}`
          }

        case 'hunyuan':
          return {
            'Content-Type': 'application/json'
          }

        case 'minimax':
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.key}`
          }

        case 'ollama':
        case 'lmstudio':
        case 'localai':
        case 'textgen':
        case 'vllm':
        case 'llamacpp':
        case 'fastchat':
          // 本地模型通常不需要认证
          return {
            'Content-Type': 'application/json'
          }

        case 'custom':
        default:
          return {
            'Content-Type': 'application/json',
            'Authorization': aiConfig.key ? `Bearer ${aiConfig.key}` : undefined
          }
      }
    },

    // 构建请求数据
    buildRequestData(aiConfig, prompt) {
      const provider = aiConfig.provider || 'volcengine'
      const baseMessages = [
        {
          role: 'system',
          content: '你是一个专业的思维导图助手，擅长为思维导图节点提供扩展建议。请提供简洁、实用的建议。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      switch (provider) {
        case 'openai':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }

        case 'claude':
          return {
            model: aiConfig.model,
            messages: baseMessages.filter(msg => msg.role !== 'system'),
            system: baseMessages.find(msg => msg.role === 'system')?.content,
            max_tokens: 500,
            temperature: 0.7
          }

        case 'volcengine':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }

        case 'qianwen':
          return {
            model: aiConfig.model,
            input: {
              messages: baseMessages
            },
            parameters: {
              temperature: 0.7,
              max_tokens: 500
            }
          }

        case 'baidu':
          return {
            messages: baseMessages,
            temperature: 0.7,
            max_output_tokens: 500
          }

        case 'kimi':
        case 'deepseek':
        case 'zhipu':
        case 'yi':
        case 'doubao':
        case 'stepfun':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }

        case 'hunyuan':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }

        case 'minimax':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500,
            group_id: aiConfig.groupId
          }

        case 'ollama':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            stream: false,
            options: {
              temperature: 0.7,
              num_predict: 500
            }
          }

        case 'lmstudio':
        case 'localai':
        case 'vllm':
        case 'fastchat':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }

        case 'textgen':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            max_new_tokens: parseInt(aiConfig.max_new_tokens || 500),
            temperature: parseFloat(aiConfig.temperature || 0.7)
          }

        case 'llamacpp':
          return {
            model: aiConfig.model,
            messages: baseMessages,
            n_predict: parseInt(aiConfig.n_predict || 500),
            temperature: parseFloat(aiConfig.temperature || 0.8)
          }

        case 'custom':
        default:
          return {
            model: aiConfig.model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 500
          }
      }
    },

    // 调用AI服务
    async callAiService(prompt) {
      try {
        console.log('使用真实AI建议服务...')
        console.log('提示内容:', prompt)

        this.statusMessage = this.$t('ai.suggestProcessing')

        // 获取AI配置
        const aiConfig = this.$store.state.aiConfig
        const currentProvider = aiConfig.currentProvider
        const providerConfig = aiConfig.providers[currentProvider]

        if (!providerConfig || !providerConfig.api) {
          throw new Error('AI配置不完整，请先配置AI')
        }

        // 构建专门的建议提示
        const suggestionPrompt = `请为"${prompt}"提供改进建议和扩展思路。请从以下几个方面给出具体建议：
1. 内容优化建议
2. 结构改进方向
3. 相关扩展主题
4. 实践应用建议

请用简洁的要点形式回答，每个建议不超过20字。`

        // 发送请求到AI服务
        const response = await fetch(`http://localhost:3456/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: currentProvider,
            api: providerConfig.api,
            method: 'POST',
            headers: this.buildHeaders(providerConfig),
            model: providerConfig.model || 'local-model',
            messages: [
              {
                role: 'user',
                content: suggestionPrompt
              }
            ]
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // 处理流式响应
        const reader = response.body.getReader()
        this.suggestion = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          console.log('AI建议收到数据块:', chunk)

          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]' || data === '') continue

              try {
                const parsed = JSON.parse(data)
                console.log('AI建议解析的数据:', parsed)

                if (parsed.choices && parsed.choices[0]) {
                  const choice = parsed.choices[0]
                  if (choice.delta && choice.delta.content) {
                    this.suggestion += choice.delta.content
                  }
                  else if (choice.message && choice.message.content) {
                    this.suggestion += choice.message.content
                  }
                }
                else if (parsed.error) {
                  throw new Error(parsed.error.message || '服务器返回错误')
                }
              } catch (e) {
                console.warn('AI建议解析JSON失败:', e.message, '原始数据:', data)
                if (data && !data.startsWith('{')) {
                  this.suggestion += data
                }
              }
            }
          }
        }

        this.statusMessage = this.$t('ai.suggestSuccess')
        this.isAnalyzing = false

      } catch (error) {
        console.error('AI建议失败:', error)
        this.statusMessage = `${this.$t('ai.suggestError')}: ${error.message || error}`
        this.isAnalyzing = false
        this.$message.error(error.message || this.$t('ai.suggestError'))
      }
    },

    // 已删除模拟AI方法 - 只使用真实AI
    generateSmartSuggestion_REMOVED(nodeText) {
      const text = nodeText.toLowerCase()

      // 学习相关
      if (text.includes('学习') || text.includes('教育') || text.includes('知识')) {
        return `针对"${nodeText}"的学习建议：

**学习方法优化：**
• 制定明确的学习目标和计划
• 采用主动学习策略，如费曼技巧
• 建立知识体系和思维导图

**实践应用建议：**
• 理论与实践相结合
• 寻找真实案例进行分析
• 定期复习和总结

**资源拓展：**
• 查找权威教材和资料
• 参与相关社区和讨论
• 寻求专家指导和反馈

**效果评估：**
• 设置阶段性检验点
• 记录学习进度和心得
• 调整学习策略和方法`
      }

      // 工作相关
      else if (text.includes('工作') || text.includes('项目') || text.includes('管理') || text.includes('团队')) {
        return `针对"${nodeText}"的工作建议：

**效率提升：**
• 明确优先级，聚焦重要任务
• 使用时间管理工具和方法
• 建立标准化工作流程

**团队协作：**
• 加强沟通和信息共享
• 明确角色分工和责任
• 建立有效的反馈机制

**质量保障：**
• 制定详细的质量标准
• 建立检查和审核流程
• 持续改进和优化

**风险管控：**
• 识别潜在风险点
• 制定应急预案
• 定期评估和调整策略`
      }

      // 技术相关
      else if (text.includes('技术') || text.includes('开发') || text.includes('编程') || text.includes('系统')) {
        return `针对"${nodeText}"的技术建议：

**技术选型：**
• 评估技术成熟度和稳定性
• 考虑团队技术栈匹配度
• 分析性能和扩展性需求

**开发实践：**
• 遵循编码规范和最佳实践
• 实施代码审查和测试
• 建立持续集成和部署

**架构设计：**
• 采用模块化和解耦设计
• 考虑可维护性和可扩展性
• 注重安全性和性能优化

**学习成长：**
• 跟进技术发展趋势
• 参与开源项目和社区
• 不断实践和总结经验`
      }

      // 健康相关
      else if (text.includes('健康') || text.includes('运动') || text.includes('锻炼') || text.includes('饮食')) {
        return `针对"${nodeText}"的健康建议：

**生活习惯：**
• 保持规律的作息时间
• 均衡营养的饮食搭配
• 适量的运动和锻炼

**心理健康：**
• 学会压力管理和情绪调节
• 培养积极的心态和思维
• 建立良好的社交关系

**预防保健：**
• 定期体检和健康监测
• 了解家族病史和风险因素
• 及时就医和专业咨询

**持续改善：**
• 设定可实现的健康目标
• 记录和跟踪健康指标
• 根据情况调整健康计划`
      }

      // 通用建议
      else {
        return `针对"${nodeText}"的改进建议：

**内容完善：**
• 补充更多具体细节和实例
• 增加相关背景信息和context
• 考虑不同角度和维度的分析

**结构优化：**
• 采用清晰的逻辑结构
• 使用恰当的分类和层次
• 突出重点和关键信息

**表达改进：**
• 使用简洁明了的语言
• 采用视觉化的表达方式
• 增强可读性和理解性

**深度拓展：**
• 探索相关联的概念和主题
• 分析原因、过程和结果
• 考虑实际应用和意义

**质量提升：**
• 验证信息的准确性和可靠性
• 寻求多方面的观点和意见
• 持续更新和完善内容`
      }
    }
  }
}
</script>

<style lang="less" scoped>
.aiSuggestBox {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.isDark {
    // 暗色主题样式
    .suggestContent {
      .suggestion {
        .suggestionText {
          border-color: #409eff;
          background-color: rgba(64, 158, 255, 0.1);
          color: #CFD3DC;
        }
      }
    }
  }

  .suggestHeader {
    height: 50px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    padding: 0 12px;
  }

  .suggestContent {
    width: 100%;
    height: 100%;
    padding: 12px;
    overflow-y: auto;
    overflow-x: hidden;
    
    .analyzing {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100px;
      
      i {
        font-size: 24px;
        margin-bottom: 10px;
        color: #409eff;
      }
    }
    
    .suggestion {
      .suggestionText {
        margin-bottom: 20px;
        padding: 12px;
        border: 1px solid #409eff;
        border-radius: 8px;
        background-color: rgba(64, 158, 255, 0.1);
      }
      
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
    }
    
    .noSuggestion {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      color: #909399;
    }
  }

  .suggestFooter {
    flex-shrink: 0;
    width: 100%;
    height: 50px;
    border-top: 1px solid #e8e8e8;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /deep/ .suggestionText {
    width: 100%;
    overflow: hidden;
    color: #3f4a54;
    font-size: 14px;
    line-height: 1.5;

    p {
      margin-bottom: 12px;

      &:last-of-type {
        margin-bottom: 0;
      }
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
    }

    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      white-space: break-spaces;
      background-color: rgba(175, 184, 193, 0.2);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
        Liberation Mono, monospace;
    }

    pre {
      padding: 12px;
      background-color: rgba(175, 184, 193, 0.2);

      code {
        background-color: transparent;
        padding: 0;
        overflow: hidden;
      }
    }
  }
}
</style>