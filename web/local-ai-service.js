const express = require('express')
const app = express()
const port = 3457

// 中间件
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// 测试接口
app.get('/api/ai/test', (req, res) => {
  console.log('✅ 收到测试请求')
  res.json({
    code: 0,
    data: null,
    msg: '连接成功'
  })
})

// AI聊天接口 - 完全本地模拟
app.post('/api/ai/chat', async (req, res) => {
  console.log('🤖 收到AI聊天请求')
  console.log('请求体:', JSON.stringify(req.body, null, 2))
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { messages } = req.body
  const userMessage = messages && messages[0] ? messages[0].content : '无消息'

  try {
    console.log('📝 用户消息:', userMessage)

    // 生成智能回复
    let aiResponse = ''
    
    if (userMessage.includes('建议') || userMessage.includes('suggest')) {
      aiResponse = `针对"${userMessage}"，我建议：
1. 深入分析当前情况和背景
2. 考虑多种可能的解决方案
3. 评估每种方案的优缺点
4. 选择最适合的方案并制定实施计划
5. 定期回顾和调整策略`
    } else if (userMessage.includes('解释') || userMessage.includes('explain')) {
      aiResponse = `关于"${userMessage}"的解释：
这是一个重要的概念，需要从多个角度来理解。首先，我们需要明确其基本定义和核心要素。然后，分析其在实际应用中的意义和价值。最后，探讨相关的最佳实践和注意事项。`
    } else if (userMessage.includes('续写') || userMessage.includes('扩展')) {
      aiResponse = `基于"${userMessage}"的续写：
- 子主题1：相关的重要概念
  - 详细说明1
  - 详细说明2
- 子主题2：实际应用场景
  - 应用案例1
  - 应用案例2
- 子主题3：未来发展趋势
  - 趋势分析1
  - 趋势分析2`
    } else {
      aiResponse = `感谢您的提问："${userMessage}"。

这是一个很有意思的话题。让我为您提供一些思考角度：

1. **核心要点**：首先需要理解问题的本质
2. **分析方法**：采用系统性的思维方式
3. **实践建议**：结合实际情况制定方案
4. **注意事项**：避免常见的误区和陷阱

希望这些信息对您有帮助！`
    }
    
    console.log('🎯 AI响应:', aiResponse)

    // 模拟流式响应
    const words = aiResponse.split('')
    
    for (let i = 0; i < words.length; i++) {
      const char = words[i]
      const responseData = {
        choices: [{
          delta: {
            content: char
          }
        }]
      }
      
      res.write(`data: ${JSON.stringify(responseData)}\n\n`)
      
      // 添加延迟模拟真实的打字效果
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    
    // 发送结束标记
    res.write(`data: [DONE]\n\n`)
    res.end()
    
    console.log('✅ AI响应发送完成')

  } catch (error) {
    console.error('❌ AI请求失败:', error.message)
    
    const errorMessage = error.message || '请求失败'
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
    res.end()
  }
})

// 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 本地AI服务启动成功！`)
  console.log(`📡 监听地址: http://localhost:${port}`)
  console.log(`🔗 测试地址: http://localhost:${port}/api/ai/test`)
  console.log(`💬 聊天接口: http://localhost:${port}/api/ai/chat`)
  console.log('-----------------------------------')
  console.log('🎯 这是一个完全本地的AI模拟服务')
  console.log('📝 会根据用户输入生成智能回复')
  console.log('-----------------------------------')
})

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
})
