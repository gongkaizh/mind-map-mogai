import Vue from 'vue'
import aiService from './aiService'

/**
 * AI服务处理器
 * 监听事件总线上的AI相关事件，并调用AI服务
 */
class AiHandler {
  constructor() {
    this.bus = new Vue()
    this.isGenerating = false
    this.shouldStop = false
    this.init()
  }

  /**
   * 初始化事件监听
   */
  init() {
    // 监听AI解释事件
    this.bus.$on('ai_explain', this.handleAiExplain.bind(this))
    
    // 监听停止生成事件
    this.bus.$on('ai_generate_stop', this.handleStop.bind(this))
  }

  /**
   * 处理AI解释事件
   * @param {string} prompt - 提示文本
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onProgress - 进度回调
   * @param {Function} onError - 错误回调
   */
  async handleAiExplain(prompt, onSuccess, onProgress, onError) {
    if (this.isGenerating) {
      onError && onError(new Error('已有AI生成任务正在进行中'))
      return
    }

    this.isGenerating = true
    this.shouldStop = false

    try {
      // 调用进度回调
      onProgress && onProgress()

      // 调用AI服务
      const result = await aiService.sendRequest(prompt)
      
      // 如果在生成过程中被停止，不调用成功回调
      if (this.shouldStop) {
        return
      }

      // 调用成功回调
      onSuccess && onSuccess(result)
    } catch (error) {
      console.error('AI解释失败:', error)
      // 调用错误回调
      onError && onError(error)
    } finally {
      this.isGenerating = false
      this.shouldStop = false
    }
  }

  /**
   * 处理停止生成事件
   */
  handleStop() {
    this.shouldStop = true
    this.isGenerating = false
  }
}

// 创建单例
const aiHandler = new AiHandler()

// 导出实例
export default aiHandler