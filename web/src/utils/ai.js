class Ai {
  constructor(options = {}) {
    this.options = options

    this.baseData = {}
    this.controller = null
    this.currentChunk = ''
    this.content = ''
  }

  init(type = 'huoshan', options = {}) {
    const provider = options.provider || type

    // 构建基础数据
    this.baseData = {
      provider: provider,
      api: options.api,
      method: options.method || 'POST',
      headers: this.buildHeaders(provider, options),
      data: this.buildBaseData(provider, options)
    }
  }

  // 构建请求头
  buildHeaders(provider, options) {
    switch (provider) {
      case 'openai':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.key}`
        }

      case 'claude':
        return {
          'Content-Type': 'application/json',
          'x-api-key': options.key,
          'anthropic-version': '2023-06-01'
        }

      case 'volcengine':
      case 'huoshan':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.key}`
        }

      case 'qianwen':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.key}`,
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
          'Authorization': `Bearer ${options.key}`
        }

      case 'hunyuan':
        return {
          'Content-Type': 'application/json'
        }

      case 'minimax':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.key}`
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
          'Authorization': options.key ? `Bearer ${options.key}` : undefined
        }
    }
  }

  // 构建基础数据
  buildBaseData(provider, options) {
    switch (provider) {
      case 'openai':
        return {
          model: options.model,
          stream: true
        }

      case 'claude':
        return {
          model: options.model,
          max_tokens: 4000,
          stream: true
        }

      case 'volcengine':
      case 'huoshan':
        return {
          model: options.model,
          stream: true
        }

      case 'qianwen':
        return {
          model: options.model,
          parameters: {
            incremental_output: true
          }
        }

      case 'baidu':
        return {
          stream: true
        }

      case 'kimi':
      case 'deepseek':
      case 'zhipu':
      case 'yi':
      case 'doubao':
      case 'stepfun':
        return {
          model: options.model,
          stream: true
        }

      case 'hunyuan':
        return {
          model: options.model,
          stream: true
        }

      case 'minimax':
        return {
          model: options.model,
          stream: true,
          group_id: options.groupId
        }

      case 'ollama':
        return {
          model: options.model,
          stream: options.stream !== false,
          options: {
            temperature: 0.7,
            num_predict: 1000
          }
        }

      case 'lmstudio':
      case 'localai':
      case 'vllm':
      case 'fastchat':
        return {
          model: options.model,
          stream: true
        }

      case 'textgen':
        return {
          model: options.model,
          stream: true,
          max_new_tokens: parseInt(options.max_new_tokens || 512),
          temperature: parseFloat(options.temperature || 0.7)
        }

      case 'llamacpp':
        return {
          model: options.model,
          stream: true,
          n_predict: parseInt(options.n_predict || 512),
          temperature: parseFloat(options.temperature || 0.8)
        }

      case 'custom':
      default:
        return {
          model: options.model,
          stream: true
        }
    }
  }

  async request(data, progress = () => {}, end = () => {}, err = () => {}) {
    try {
      console.log('使用真实AI续写服务...')
      console.log('请求数据:', data)

      // 重置内容
      this.content = ''

      // 获取用户消息
      const userMessage = data.messages && data.messages[0] ? data.messages[0].content : '无消息'
      console.log('用户消息:', userMessage)

      // 尝试连接真实AI服务
      try {
        const res = await this.postMsg(data)
        const decoder = new TextDecoder()
        let buffer = ''  // 缓冲区，累积内容
        let lastUpdateTime = Date.now()
        const UPDATE_INTERVAL = 200  // 200ms更新一次，减少频繁更新

        while (true) {
          const { done, value } = await res.read()
          if (done) {
            console.log('AI续写完成')
            // 处理剩余缓冲区内容
            if (buffer) {
              this.content += buffer
              progress(this.content)
            }
            end(this.content)
            return
          }

          // 拿到当前切片的数据
          const text = decoder.decode(value)

          // 处理切片数据
          let chunk = this.handleChunkData(text)

          // 判断是否有不完整切片，如果有，合并下一次处理，没有则获取数据
          if (this.currentChunk) continue

          let isEnd = false
          const list = chunk
            .split('\n')
            .filter(item => {
              isEnd = item.includes('[DONE]')
              return !!item && !isEnd
            })
            .map(item => {
              try {
                return JSON.parse(item.replace(/^data:/, ''))
              } catch (e) {
                return null
              }
            })
            .filter(item => item !== null)

          // 累积内容到缓冲区
          list.forEach(item => {
            const content = this.extractContent(item)
            if (content) {
              buffer += content
            }
          })

          // 定时更新或内容足够多时更新
          const now = Date.now()
          if (buffer && (now - lastUpdateTime > UPDATE_INTERVAL || buffer.length > 50)) {
            this.content += buffer
            progress(this.content)
            buffer = ''
            lastUpdateTime = now
          }

          if (isEnd) {
            console.log('AI续写结束')
            // 处理剩余缓冲区内容
            if (buffer) {
              this.content += buffer
              progress(this.content)
            }
            end(this.content)
            return
          }
        }
      } catch (realAiError) {
        console.error('AI续写失败:', realAiError)
        err(realAiError)
      }

    } catch (error) {
      console.error('AI续写失败:', error)
      // 手动停止请求不需要触发错误回调
      if (!(error && error.name === 'AbortError')) {
        err(error)
      }
    }
  }

  // 已删除模拟AI方法 - 只使用真实AI
  generateSmartExpansion_REMOVED(userMessage) {
    const text = userMessage.toLowerCase()

    // 学习相关扩展
    if (text.includes('学习') || text.includes('教育') || text.includes('知识')) {
      const topic = userMessage.replace(/.*续写|.*扩展|.*思维导图/g, '').trim()
      return `# ${topic}学习体系

## 基础知识
- 核心概念理解
  - 基本定义和内涵
  - 关键特征识别
  - 理论框架构建
- 知识体系梳理
  - 知识点分类整理
  - 逻辑关系建立
  - 重难点标识

## 学习方法
- 高效学习策略
  - 主动学习技巧
  - 记忆方法运用
  - 思维导图制作
- 实践应用方法
  - 案例分析练习
  - 实际操作训练
  - 问题解决实践

## 进阶提升
- 深度学习路径
  - 专业书籍研读
  - 专家讲座学习
  - 学术论文研究
- 能力拓展方向
  - 跨领域知识整合
  - 创新思维培养
  - 批判性思考训练

## 评估反馈
- 学习效果检验
  - 阶段性测试评估
  - 实际应用验证
  - 同伴互评交流
- 持续改进机制
  - 学习方法调整
  - 目标重新设定
  - 计划优化完善`
    }

    // 工作相关扩展
    else if (text.includes('工作') || text.includes('项目') || text.includes('管理') || text.includes('团队')) {
      const topic = userMessage.replace(/.*续写|.*扩展|.*思维导图/g, '').trim()
      return `# ${topic}管理体系

## 规划阶段
- 目标设定
  - 明确具体目标
  - 制定时间计划
  - 确定成功标准
- 资源配置
  - 人员分工安排
  - 预算资源分配
  - 工具设备准备

## 执行阶段
- 过程管控
  - 进度跟踪监控
  - 质量标准把控
  - 风险识别应对
- 团队协作
  - 沟通机制建立
  - 协作流程优化
  - 冲突解决处理

## 监控评估
- 绩效评估
  - 关键指标监测
  - 阶段性成果评估
  - 问题识别分析
- 持续改进
  - 经验总结提炼
  - 流程优化改进
  - 最佳实践推广

## 成果交付
- 质量保障
  - 成果验收标准
  - 质量检查流程
  - 客户满意度评估
- 知识沉淀
  - 项目文档整理
  - 经验教训总结
  - 知识库建设完善`
    }

    // 技术相关扩展
    else if (text.includes('技术') || text.includes('开发') || text.includes('编程') || text.includes('系统')) {
      const topic = userMessage.replace(/.*续写|.*扩展|.*思维导图/g, '').trim()
      return `# ${topic}技术架构

## 技术基础
- 核心技术栈
  - 主要技术框架
  - 开发语言选择
  - 数据库设计
- 架构设计
  - 系统架构规划
  - 模块化设计
  - 接口规范定义

## 开发实践
- 编码规范
  - 代码风格统一
  - 命名规范制定
  - 注释文档要求
- 质量保障
  - 单元测试编写
  - 代码审查流程
  - 持续集成部署

## 性能优化
- 系统性能
  - 响应速度优化
  - 并发处理能力
  - 资源使用效率
- 扩展性设计
  - 水平扩展方案
  - 垂直扩展策略
  - 负载均衡配置

## 运维保障
- 监控告警
  - 系统监控指标
  - 异常告警机制
  - 日志分析处理
- 安全防护
  - 数据安全保护
  - 访问权限控制
  - 安全漏洞防范`
    }

    // 健康相关扩展
    else if (text.includes('健康') || text.includes('运动') || text.includes('锻炼') || text.includes('饮食')) {
      const topic = userMessage.replace(/.*续写|.*扩展|.*思维导图/g, '').trim()
      return `# ${topic}健康管理

## 基础认知
- 健康理念
  - 全面健康概念
  - 预防为主思想
  - 生活方式重要性
- 科学原理
  - 生理机制理解
  - 营养代谢知识
  - 运动生理基础

## 实践方案
- 日常习惯
  - 作息时间规律
  - 饮食搭配均衡
  - 运动锻炼适量
- 专项训练
  - 有氧运动计划
  - 力量训练方案
  - 柔韧性练习

## 监测评估
- 健康指标
  - 体重体脂监测
  - 心率血压检查
  - 体能测试评估
- 效果跟踪
  - 进步记录分析
  - 问题识别调整
  - 目标重新设定

## 持续改善
- 方案优化
  - 个性化调整
  - 阶段性升级
  - 专业指导获取
- 习惯养成
  - 行为模式固化
  - 动机维持强化
  - 社会支持获得`
    }

    // 通用扩展
    else {
      const topic = userMessage.replace(/.*续写|.*扩展|.*思维导图/g, '').trim()
      return `# ${topic}全面分析

## 基础认知
- 概念理解
  - 基本定义阐述
  - 核心要素分析
  - 特征属性识别
- 理论基础
  - 相关理论梳理
  - 发展历程回顾
  - 学术观点对比

## 深度分析
- 内在机制
  - 运作原理解析
  - 影响因素识别
  - 关联关系分析
- 外在表现
  - 具体表现形式
  - 应用场景描述
  - 效果评估标准

## 实践应用
- 应用方法
  - 基本操作步骤
  - 技巧要点掌握
  - 注意事项提醒
- 案例分析
  - 成功案例研究
  - 失败教训总结
  - 经验启示提炼

## 发展前景
- 现状评估
  - 当前发展水平
  - 存在问题分析
  - 改进空间识别
- 未来趋势
  - 发展方向预测
  - 机遇挑战并存
  - 应对策略建议`
    }
  }

  // 从不同提供商的响应中提取内容
  extractContent(parsed) {
    const provider = this.baseData.provider

    switch (provider) {
      case 'openai':
      case 'volcengine':
      case 'huoshan':
      case 'custom':
        // OpenAI格式
        return parsed.choices?.[0]?.delta?.content || ''

      case 'claude':
        // Claude格式
        return parsed.delta?.text || ''

      case 'qianwen':
        // 通义千问格式
        return parsed.output?.text || ''

      case 'baidu':
        // 百度文心一言格式
        return parsed.result || ''

      case 'kimi':
      case 'deepseek':
      case 'zhipu':
      case 'yi':
      case 'doubao':
      case 'stepfun':
        // 这些提供商大多兼容OpenAI格式
        return parsed.choices?.[0]?.delta?.content || ''

      case 'hunyuan':
        // 腾讯混元格式
        return parsed.choices?.[0]?.delta?.content || parsed.delta?.content || ''

      case 'minimax':
        // MiniMax格式
        return parsed.choices?.[0]?.delta?.content || parsed.reply || ''

      case 'ollama':
        // Ollama格式
        return parsed.message?.content || ''

      case 'lmstudio':
      case 'localai':
      case 'vllm':
      case 'fastchat':
        // 这些服务兼容OpenAI格式
        return parsed.choices?.[0]?.delta?.content || ''

      case 'textgen':
        // Text Generation WebUI格式
        return parsed.choices?.[0]?.delta?.content || parsed.content || ''

      case 'llamacpp':
        // llama.cpp格式
        return parsed.content || parsed.choices?.[0]?.delta?.content || ''

      default:
        // 默认尝试OpenAI格式
        return parsed.choices?.[0]?.delta?.content || parsed.delta?.text || parsed.result || parsed.message?.content || parsed.content || ''
    }
  }

  async postMsg(data) {
    this.controller = new AbortController()

    // 在所有消息的最后一条内容末尾加上 /no_think 来禁用深度思考
    const modifiedData = { ...data }
    if (modifiedData.messages && modifiedData.messages.length > 0) {
      const lastMessage = modifiedData.messages[modifiedData.messages.length - 1]
      if (lastMessage.content && typeof lastMessage.content === 'string') {
        // 如果内容末尾还没有 /no_think，则添加
        if (!lastMessage.content.trim().endsWith('/no_think')) {
          lastMessage.content = lastMessage.content.trim() + ' /no_think'
        }
      }
    }
    console.log('AI续写请求（已添加/no_think）:', modifiedData)

    const res = await fetch(`http://localhost:${this.options.port}/api/ai/chat`, {
      signal: this.controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...this.baseData,
        data: {
          ...this.baseData.data,
          ...modifiedData
        }
      })
    })
    if (res.status && res.status !== 200) {
      throw new Error('请求失败')
    }
    return res.body.getReader()
  }

  handleChunkData(chunk) {
    chunk = chunk.trim()
    // 如果存在上一个切片
    if (this.currentChunk) {
      chunk = this.currentChunk + chunk
      this.currentChunk = ''
    }
    // 如果存在done,认为是完整切片且是最后一个切片
    if (chunk.includes('[DONE]')) {
      return chunk
    }
    // 最后一个字符串不为}，则默认切片不完整，保存与下次拼接使用（这种方法不严谨，但已经能解决大部分场景的问题）
    if (chunk[chunk.length - 1] !== '}') {
      this.currentChunk = chunk
    }
    return chunk
  }

  stop() {
    this.controller.abort()
    this.controller = new AbortController()
  }

  // 从用户消息中提取纯净的主题内容
  extractTopicFromMessage(userMessage) {
    // 查找"积极"、"项目管理"等实际主题
    const patterns = [
      /主题"([^"]+)"/,
      /节点"([^"]+)"/,
      /内容"([^"]+)"/,
      /展开主题"([^"]+)"/,
      /续写"([^"]+)"/,
      /分支"([^"]+)"/
    ]

    for (const pattern of patterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // 如果没有找到引号中的内容，尝试提取关键词
    const lines = userMessage.split('\n')
    for (const line of lines) {
      if (line.includes('主题') || line.includes('节点') || line.includes('内容')) {
        // 提取冒号后的内容
        const colonIndex = line.indexOf('：') || line.indexOf(':')
        if (colonIndex > -1) {
          const content = line.substring(colonIndex + 1).trim()
          if (content && content.length < 20) {
            return content
          }
        }
      }
    }

    // 默认返回一个通用主题
    return '主题分析'
  }
}

export default Ai
