const express = require('express')
const axios = require('axios')
const net = require('net')

const port = 3456

const isPortUsed = port => {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') {
        resolve(true) // 端口被占用
      } else {
        resolve(false) // 其他错误
      }
    })
    server.once('listening', () => {
      server.close(() => resolve(false)) // 端口可用
    })
    server.listen(port) // 尝试监听端口
  })
}

const createServe = () => {
  // 起个服务
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // 允许跨域
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*') // 允许所有来源的跨域请求，或者指定一个域名
    res.header('Access-Control-Allow-Methods', '*') // 允许的方法
    res.header('Access-Control-Allow-Headers', '*') // 允许的头部信息
    next()
  })

  // 监听对话请求
  app.get('/api/ai/test', (req, res) => {
    res
      .json({
        code: 0,
        data: null,
        msg: '连接成功'
      })
      .end()
  })

  // 通用AI聊天接口，支持多种模型提供商
  app.post('/api/ai/chat', async (req, res, next) => {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const { provider, api, method = 'POST', headers = {}, data } = req.body

    try {
      // 根据不同的提供商处理请求
      const requestConfig = buildRequestConfig(provider, api, method, headers, data)

      // 特殊处理Ollama的流式响应
      if (provider === 'ollama') {
        await handleOllamaRequest(requestConfig, res)
      } else {
        const response = await axios({
          ...requestConfig,
          responseType: 'stream'
        })
        response.data.pipe(res)
      }
    } catch (error) {
      console.error('AI请求失败:', error.message)
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    }
  })

  // 构建不同提供商的请求配置
  function buildRequestConfig(provider, api, method, headers, data) {
    const config = {
      url: api,
      method,
      headers: { ...headers },
      data
    }

    switch (provider) {
      case 'openai':
        // OpenAI格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'claude':
        // Anthropic Claude格式
        config.headers['Content-Type'] = 'application/json'
        config.headers['anthropic-version'] = '2023-06-01'
        break

      case 'volcengine':
        // 火山引擎格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'qianwen':
        // 通义千问格式
        config.headers['Content-Type'] = 'application/json'
        config.headers['X-DashScope-SSE'] = 'enable'
        break

      case 'baidu':
        // 百度文心一言格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'kimi':
      case 'deepseek':
      case 'zhipu':
      case 'yi':
      case 'doubao':
      case 'stepfun':
        // 这些提供商大多兼容OpenAI格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'hunyuan':
        // 腾讯混元格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'minimax':
        // MiniMax格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'ollama':
        // Ollama格式
        config.headers['Content-Type'] = 'application/json'
        // Ollama使用不同的API端点
        if (config.url.includes('/api/chat/completions')) {
          config.url = config.url.replace('/api/chat/completions', '/api/chat')
        }
        break

      case 'lmstudio':
      case 'localai':
      case 'textgen':
      case 'vllm':
      case 'llamacpp':
      case 'fastchat':
        // 这些服务兼容OpenAI格式
        config.headers['Content-Type'] = 'application/json'
        break

      case 'custom':
      default:
        // 自定义或默认格式（兼容OpenAI）
        config.headers['Content-Type'] = 'application/json'
        break
    }

    return config
  }

  // 处理Ollama的特殊请求格式
  async function handleOllamaRequest(config, res) {
    const response = await axios({
      ...config,
      responseType: 'stream'
    })

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)

          // 转换Ollama格式到OpenAI格式
          if (parsed.message && parsed.message.content) {
            const openaiFormat = {
              choices: [{
                delta: {
                  content: parsed.message.content
                }
              }]
            }
            res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`)
          }

          // 检查是否完成
          if (parsed.done) {
            res.write(`data: [DONE]\n\n`)
            res.end()
            return
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    })

    response.data.on('end', () => {
      res.write(`data: [DONE]\n\n`)
      res.end()
    })

    response.data.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    })
  }

  app.listen(port, () => {
    console.log(`app listening on port ${port}`)
  })
}

isPortUsed(port).then(isUsed => {
  if (isUsed) {
    console.error('端口被占用')
  } else {
    createServe()
  }
})
