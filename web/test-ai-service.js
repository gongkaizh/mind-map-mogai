const fetch = require('node-fetch');

async function testAiService() {
  try {
    console.log('测试AI服务...');
    
    const response = await fetch('http://localhost:3456/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'lmstudio',
        api: 'http://192.168.8.242:1234/v1/chat/completions',
        method: 'POST',
        model: 'local-model',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond briefly.'
          }
        ]
      })
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', response.headers.raw());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('错误响应:', errorText);
      return;
    }

    // 读取流式响应
    const reader = response.body.getReader();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      console.log('收到数据块:', chunk);
      fullResponse += chunk;
    }

    console.log('完整响应:', fullResponse);

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAiService();
