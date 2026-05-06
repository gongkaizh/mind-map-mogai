const http = require('http')
const url = require('url')

const port = 3456

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const parsedUrl = url.parse(req.url, true)
  
  console.log(`收到请求: ${req.method} ${req.url}`)

  if (req.method === 'GET' && parsedUrl.pathname === '/api/ai/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 0, data: null, msg: '连接成功' }))
    console.log('✅ 测试请求成功')
    return
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/ai/chat') {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        console.log('📝 收到AI请求:', requestData)
        
        // 设置SSE响应头
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        })

        const userMessage = requestData.messages && requestData.messages[0] ? requestData.messages[0].content : '无消息'
        console.log('用户消息:', userMessage)

        // 生成AI回复
        let aiResponse = ''
        
        if (userMessage.includes('建议') || userMessage.includes('suggest')) {
          aiResponse = `针对您的问题，我建议：
1. 仔细分析当前情况
2. 制定详细的行动计划
3. 考虑可能的风险和机会
4. 寻求专业意见和建议
5. 定期评估和调整策略`
        } else if (userMessage.includes('解释') || userMessage.includes('explain')) {
          aiResponse = `关于您提到的内容，让我来解释一下：

这个概念包含了多个重要方面。首先，我们需要理解其基本定义和核心原理。其次，要考虑它在实际应用中的意义和价值。最后，还要了解相关的最佳实践和注意事项。

希望这个解释对您有帮助！`
        } else if (userMessage.includes('续写') || userMessage.includes('扩展')) {
          aiResponse = `基于您的内容，我来为您扩展：

• 主要观点1
  - 支持论据A
  - 支持论据B
  
• 主要观点2
  - 实际应用案例
  - 相关研究发现
  
• 主要观点3
  - 未来发展趋势
  - 潜在影响分析`
        } else {
          aiResponse = `感谢您的提问！

针对"${userMessage}"，我认为这是一个很有价值的话题。

让我从几个角度来分析：
1. 核心概念和定义
2. 实际应用和案例
3. 相关的最佳实践
4. 需要注意的要点

希望这些信息对您有所帮助！如果您需要更详细的解释，请随时告诉我。`
        }

        console.log('🤖 AI回复:', aiResponse)

        // 模拟流式响应
        const chars = aiResponse.split('')
        
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i]
          const responseData = {
            choices: [{
              delta: {
                content: char
              }
            }]
          }
          
          res.write(`data: ${JSON.stringify(responseData)}\n\n`)
          
          // 添加延迟模拟真实的打字效果
          await new Promise(resolve => setTimeout(resolve, 30))
        }
        
        // 发送结束标记
        res.write(`data: [DONE]\n\n`)
        res.end()
        
        console.log('✅ AI响应发送完成')

      } catch (error) {
        console.error('❌ 处理请求失败:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message }))
      }
    })
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 快速AI服务启动成功！`)
  console.log(`📡 监听地址: http://localhost:${port}`)
  console.log(`🔗 测试地址: http://localhost:${port}/api/ai/test`)
  console.log(`💬 聊天接口: http://localhost:${port}/api/ai/chat`)
  console.log('-----------------------------------')
})

server.on('error', (error) => {
  console.error('❌ 服务器错误:', error)
})

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
})
