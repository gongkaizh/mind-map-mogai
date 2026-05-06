const express = require('express')
const app = express()
const port = 3456

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
  console.log('收到测试请求')
  res.json({
    code: 0,
    data: null,
    msg: '连接成功'
  })
})

// AI聊天接口
app.post('/api/ai/chat', async (req, res) => {
  console.log('收到AI聊天请求:', JSON.stringify(req.body, null, 2))
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  let { provider, api, messages } = req.body

  console.log('收到请求参数:')
  console.log('- 提供商:', provider)
  console.log('- 模型名称:', req.body.model)
  console.log('- 用户消息:', messages[messages.length - 1]?.content)

  // 修复API地址问题 - 如果是localhost，改为正确的IP
  if (api && api.includes('localhost:1234')) {
    api = api.replace('localhost:1234', '192.168.8.242:1234')
    console.log('修复API地址:', api)
  }

  try {
    console.log('处理AI请求，提供商:', provider)
    console.log('API地址:', api)
    console.log('消息:', messages)

    // 如果是LM Studio，直接转发请求
    if (provider === 'lmstudio') {
      console.log('转发请求到LM Studio:', api)

      const axios = require('axios')
      const requestData = {
        model: req.body.model || 'local-model',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      }

      console.log('📝 发送给AI的消息:', requestData.messages[requestData.messages.length - 1]?.content)

      try {
        const response = await axios({
          method: 'POST',
          url: api,
          headers: {
            'Content-Type': 'application/json'
          },
          data: requestData,
          responseType: 'stream'
        })

        console.log('LM Studio响应状态:', response.status)
        response.data.pipe(res)

      } catch (error) {
        console.error('LM Studio请求失败:', error.message)
        if (error.response) {
          console.error('LM Studio错误状态:', error.response.status)
          console.error('LM Studio错误数据:', error.response.data)
        }
        throw error
      }

    } else {
      // 其他提供商使用模拟响应
      const mockResponse = `这是一个测试响应。您的消息是：${messages[0]?.content || '无消息'}`

      // 发送模拟的流式响应
      const chunks = mockResponse.split(' ')

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '')
        const responseData = {
          choices: [{
            delta: {
              content: chunk
            }
          }]
        }

        res.write(`data: ${JSON.stringify(responseData)}\n\n`)

        // 添加延迟模拟真实的流式响应
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 发送结束标记
      res.write(`data: [DONE]\n\n`)
      res.end()

      console.log('模拟AI响应发送完成')
    }

  } catch (error) {
    console.error('AI请求失败:', error.message)
    console.error('错误详情:', error)
    
    const errorMessage = error.message || '请求失败'
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
    res.end()
  }
})

// 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 简化AI服务启动成功！`)
  console.log(`📡 监听地址: http://localhost:${port}`)
  console.log(`🔗 测试地址: http://localhost:${port}/api/ai/test`)
  console.log(`💬 聊天接口: http://localhost:${port}/api/ai/chat`)
  console.log('-----------------------------------')
})

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
})
