const express = require('express')
const axios = require('axios')

const port = 3456
const app = express()

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

  const { provider, api, method = 'POST', headers = {}, data, messages } = req.body

  try {
    // 构建请求配置
    const requestConfig = {
      method: method,
      url: api,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    }

    // 构建请求数据
    let requestData = data
    if (messages && !requestData) {
      requestData = {
        model: req.body.model || 'default',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      }
    }

    requestConfig.data = requestData

    console.log('发送请求到:', api)
    console.log('请求配置:', JSON.stringify(requestConfig, null, 2))
    
    // 发送请求
    const response = await axios({
      ...requestConfig,
      responseType: 'stream'
    })

    console.log('收到响应，状态码:', response.status)

    // 处理流式响应
    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString()
      console.log('收到数据块:', chunkStr)
      res.write(chunkStr)
    })

    response.data.on('end', () => {
      console.log('响应结束')
      res.end()
    })

    response.data.on('error', (error) => {
      console.error('流式响应错误:', error)
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    })

  } catch (error) {
    console.error('AI请求失败:', error.message)
    console.error('错误详情:', error.response?.data || error)
    
    const errorMessage = error.response?.data?.error?.message || error.message || '请求失败'
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
    res.end()
  }
})

// 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 AI服务启动成功！`)
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
