import store from '@/store'
import i18n from '@/i18n'

class AiService {
  constructor() {
    this.config = store.state.aiConfig
  }

  /**
   * 发送请求到AI服务
   * @param {string} prompt - 提示文本
   * @returns {Promise<string>} - AI的响应
   */
  async sendRequest(prompt) {
    const aiConfig = store.state.aiConfig
    const currentProvider = aiConfig.currentProvider
    const providerConfig = aiConfig.providers[currentProvider]

    // 检查基本配置
    if (!currentProvider || !providerConfig || !providerConfig.api) {
      throw new Error('AI配置不完整，请先配置AI')
    }

    const { api, model = 'local-model' } = providerConfig

    // 检查云端模型是否有API Key
    const needsApiKey = !['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(currentProvider)
    if (needsApiKey) {
      const hasKey = providerConfig.key || providerConfig.secretId || providerConfig.apiKey
      if (!hasKey) {
        throw new Error(i18n.t('ai.noApiKey'))
      }
    }

    try {
      console.log('使用真实AI服务...')
      console.log('发送提示:', prompt)

      // 构建专门的解释提示
      const explanationPrompt = `请详细解释"${prompt}"这个概念。请从以下几个方面进行说明：
1. 基本概念和定义
2. 核心特点和要素
3. 实际应用场景
4. 相关联系和扩展

请用结构化的方式回答，内容要准确、易懂、实用。`

      // 发送请求到真实的AI服务
      const response = await fetch(`http://localhost:3456/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: currentProvider,
          api: api,
          method: 'POST',
          headers: this.buildRequestHeaders(currentProvider, providerConfig),
          model: model,
          messages: [
            {
              role: 'user',
              content: explanationPrompt
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('AI服务响应错误:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 处理流式响应
      const reader = response.body.getReader()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        console.log('收到数据块:', chunk)

        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]' || data === '') continue

            try {
              const parsed = JSON.parse(data)
              console.log('解析的数据:', parsed)

              // 处理不同的响应格式
              if (parsed.choices && parsed.choices[0]) {
                const choice = parsed.choices[0]
                // 流式响应格式
                if (choice.delta && choice.delta.content) {
                  result += choice.delta.content
                }
                // 非流式响应格式
                else if (choice.message && choice.message.content) {
                  result += choice.message.content
                }
              }
              // 处理错误响应
              else if (parsed.error) {
                throw new Error(parsed.error.message || '服务器返回错误')
              }
            } catch (e) {
              console.warn('解析JSON失败:', e.message, '原始数据:', data)
              // 如果不是JSON格式，可能是纯文本响应
              if (data && !data.startsWith('{')) {
                result += data
              }
            }
          }
        }
      }

      console.log('最终AI结果:', result)

      if (!result) {
        throw new Error('AI服务返回的数据格式不正确')
      }

      return result.trim()

    } catch (error) {
      console.error('AI请求失败:', error)
      // 转换错误消息为用户友好的提示
      const errorMessage = error.message || i18n.t('ai.unknownError')
      throw new Error(errorMessage)
    }
  }

  // 构建请求头
  buildRequestHeaders(provider, config) {
    switch (provider) {
      case 'openai':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`
        }

      case 'claude':
        return {
          'Content-Type': 'application/json',
          'x-api-key': config.key,
          'anthropic-version': '2023-06-01'
        }

      case 'volcengine':
      case 'huoshan':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`
        }

      case 'lmstudio':
      case 'localai':
      case 'ollama':
      case 'textgen':
      case 'vllm':
      case 'llamacpp':
      case 'fastchat':
        // 本地模型不需要API Key
        return {
          'Content-Type': 'application/json'
        }

      default:
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key || ''}`
        }
    }
  }

  /**
   * 已删除模拟AI方法 - 只使用真实AI
   * @param {string} prompt - 用户输入
   * @returns {string} - 智能回复
   */
  generateSmartResponse_REMOVED(prompt) {
    const text = prompt.toLowerCase()

    // 学习相关解释
    if (text.includes('学习') || text.includes('教育') || text.includes('知识')) {
      const topic = prompt.replace(/.*解释|.*说明|.*是什么|节点内容：/g, '').trim()
      return `关于"${topic}"的学习解释：

**基本概念**：
${topic}是一个重要的学习主题，涉及知识的获取、理解和应用过程。

**核心要素**：
• 理论基础：掌握相关的基本概念和原理
• 实践应用：通过实际操作加深理解
• 反思总结：定期回顾和总结学习成果

**学习方法**：
• 主动学习：积极参与，主动思考和提问
• 系统学习：建立完整的知识体系
• 持续学习：保持学习的连续性和深度

**应用价值**：
掌握${topic}可以帮助提升学习效率，建立更好的知识结构，为进一步的学习和工作打下坚实基础。`
    }

    // 工作相关解释
    else if (text.includes('工作') || text.includes('项目') || text.includes('管理') || text.includes('团队')) {
      const topic = prompt.replace(/.*解释|.*说明|.*是什么|节点内容：/g, '').trim()
      return `关于"${topic}"的工作解释：

**定义说明**：
${topic}是工作中的重要概念，涉及组织、协调和执行等多个方面。

**关键特征**：
• 目标导向：明确的目标和预期结果
• 协作性：需要团队成员的配合和协作
• 系统性：涉及多个环节和流程的整合

**实施要点**：
• 规划阶段：制定详细的计划和时间表
• 执行阶段：按计划推进，及时调整策略
• 评估阶段：总结经验，持续改进

**成功因素**：
有效的${topic}需要清晰的沟通、合理的资源配置、灵活的应变能力和持续的学习改进。`
    }

    // 技术相关解释
    else if (text.includes('技术') || text.includes('开发') || text.includes('编程') || text.includes('系统')) {
      const topic = prompt.replace(/.*解释|.*说明|.*是什么|节点内容：/g, '').trim()
      return `关于"${topic}"的技术解释：

**技术概述**：
${topic}是现代技术体系中的重要组成部分，具有特定的功能和应用场景。

**核心原理**：
• 基础架构：底层的技术架构和设计模式
• 实现机制：具体的实现方法和技术手段
• 性能特点：在效率、稳定性等方面的表现

**应用场景**：
• 开发环境：在软件开发中的具体应用
• 生产环境：在实际业务中的部署和使用
• 扩展应用：在相关领域的拓展应用

**技术价值**：
掌握${topic}可以提升开发效率，改善系统性能，为技术创新和业务发展提供有力支撑。`
    }

    // 健康相关解释
    else if (text.includes('健康') || text.includes('运动') || text.includes('锻炼') || text.includes('饮食')) {
      const topic = prompt.replace(/.*解释|.*说明|.*是什么|节点内容：/g, '').trim()
      return `关于"${topic}"的健康解释：

**健康意义**：
${topic}对身心健康具有重要意义，是维护和促进健康的重要因素。

**科学原理**：
• 生理机制：对身体各系统的积极影响
• 心理效应：对心理健康和情绪的正面作用
• 预防作用：在疾病预防方面的重要价值

**实践指导**：
• 基本原则：遵循科学、适度、持续的原则
• 具体方法：采用合适的方式和强度
• 注意事项：避免过度或不当的做法

**长期效益**：
坚持${topic}可以提升生活质量，增强身体素质，促进身心健康的全面发展。`
    }

    // 通用解释
    else {
      const topic = prompt.replace(/.*解释|.*说明|.*是什么|节点内容：/g, '').trim()
      return `关于"${topic}"的详细解释：

**基本定义**：
${topic}是一个重要的概念，在相关领域中具有特定的含义和作用。

**主要特点**：
• 核心属性：具有明确的定义和特征
• 功能作用：在特定情境中发挥重要作用
• 应用范围：适用于多种相关场景

**深入分析**：
• 历史背景：概念的发展历程和演变
• 现状分析：当前的发展水平和应用情况
• 发展趋势：未来的发展方向和潜力

**实际意义**：
理解${topic}有助于更好地把握相关知识，提升认知水平，为实际应用和进一步学习奠定基础。

**相关联系**：
${topic}与其他相关概念存在密切联系，形成完整的知识体系和应用框架。`
    }
  }

  /**
   * 解释节点内容
   * @param {Object} nodeData - 节点数据
   * @returns {Promise<string>} - AI的解释
   */
  async explainNode(nodeData) {
    if (!nodeData) {
      throw new Error(i18n.t('ai.emptyNode'))
    }
    
    // 获取节点文本，支持两种方式：直接的text属性或getData方法
    const nodeText = nodeData.getData ? nodeData.getData('text') : nodeData.text
    
    if (!nodeText) {
      throw new Error(i18n.t('ai.emptyNode'))
    }

    // 构建提示文本
    const prompt = `节点内容：${nodeText}\n\n请提供以下内容：\n1. 概念解释\n2. 重要特点\n3. 相关联系\n4. 应用场景`

    return this.sendRequest(prompt)
  }

  /**
   * 根据不同提供商构建请求数据
   * @param {string} provider - 提供商类型
   * @param {string} key - API密钥
   * @param {string} model - 模型名称
   * @param {string} prompt - 提示文本
   * @returns {Object} - 请求数据
   */
  buildRequestData(provider, config, prompt) {
    const { key, model, secretId, secretKey, apiKey, groupId } = config
    const baseMessages = [
      {
        role: 'system',
        content: '你是一个专业的思维导图助手，擅长解释和扩展思维导图中的概念。请用简洁清晰的语言解释用户提供的内容，并给出相关的扩展思路。'
      },
      {
        role: 'user',
        content: `请解释以下概念，并提供相关的扩展思路：${prompt}`
      }
    ]

    switch (provider) {
      case 'openai':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'claude':
        return {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          data: {
            model: model,
            messages: baseMessages.filter(msg => msg.role !== 'system'), // Claude不支持system消息
            system: baseMessages.find(msg => msg.role === 'system')?.content,
            max_tokens: 1000,
            temperature: 0.7,
            stream: true
          }
        }

      case 'volcengine':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'qianwen':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'X-DashScope-SSE': 'enable'
          },
          data: {
            model: model,
            input: {
              messages: baseMessages
            },
            parameters: {
              temperature: 0.7,
              max_tokens: 1000,
              incremental_output: true
            }
          }
        }

      case 'wenxin':
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            messages: baseMessages,
            temperature: 0.7,
            max_output_tokens: 1000,
            stream: true
          },
          // 百度需要特殊的认证处理
          auth: {
            apiKey: apiKey,
            secretKey: secretKey
          }
        }

      case 'kimi':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'deepseek':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'zhipu':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'yi':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'hunyuan':
        const { secretKey: hunyuanSecretKey, region = 'ap-beijing' } = store.state.aiConfig
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          },
          // 腾讯云需要特殊的认证处理
          auth: {
            secretId: key,
            secretKey: hunyuanSecretKey,
            region: region
          }
        }

      case 'doubao':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'minimax':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true,
            // MiniMax特有参数
            group_id: groupId
          }
        }

      case 'stepfun':
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'ollama':
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model: model,
            messages: baseMessages,
            stream: true,
            options: {
              temperature: 0.7,
              num_predict: 1000
            }
          }
        }

      case 'lmstudio':
      case 'localai':
      case 'vllm':
      case 'fastchat':
        // 这些服务兼容OpenAI格式
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }

      case 'textgen':
        const { max_new_tokens = 512, temperature: textgenTemp = 0.7 } = store.state.aiConfig
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model: model,
            messages: baseMessages,
            max_new_tokens: parseInt(max_new_tokens),
            temperature: parseFloat(textgenTemp),
            stream: true
          }
        }

      case 'llamacpp':
        const { n_predict = 512, temperature: llamacppTemp = 0.8 } = store.state.aiConfig
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model: model,
            messages: baseMessages,
            n_predict: parseInt(n_predict),
            temperature: parseFloat(llamacppTemp),
            stream: true
          }
        }

      case 'custom':
      default:
        // 默认使用OpenAI格式
        return {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': key ? `Bearer ${key}` : undefined
          },
          data: {
            model: model,
            messages: baseMessages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }
        }
    }
  }
}

export default new AiService()