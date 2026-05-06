const express = require('express')
const axios = require('axios')

const port = 3456
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})

// 测试接口
app.get('/api/ai/test', (req, res) => {
  res.json({
    code: 0,
    data: null,
    msg: '连接成功'
  })
})

// AI聊天接口
app.post('/api/ai/chat', async (req, res) => {
  console.log('收到AI请求:', req.body)
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const { provider, api, method = 'POST', headers = {}, data } = req.body

  try {
    console.log('发送请求到:', api)
    console.log('请求数据:', data)
    
    const response = await axios({
      method: method,
      url: api,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      data: data,
      responseType: 'stream'
    })

    response.data.pipe(res)
  } catch (error) {
    console.error('AI请求失败:', error.message)
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
})

app.listen(port, () => {
  console.log(`AI服务启动成功，端口: ${port}`)
})
