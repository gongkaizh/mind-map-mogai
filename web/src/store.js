import Vue from 'vue'
import Vuex from 'vuex'
import { storeLocalConfig } from '@/api'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    isHandleLocalFile: false, // 是否操作的是本地文件
    localConfig: {
      // 本地配置
      isZenMode: false, // 是否是禅模式
      // 是否开启节点富文本
      openNodeRichText: true,
      // 鼠标行为
      useLeftKeySelectionRightKeyDrag: false,
      // 是否显示滚动条
      isShowScrollbar: false,
      // 是否是暗黑模式
      isDark: false,
      // 是否开启AI功能
      enableAi: true
    },
    activeSidebar: '', // 当前显示的侧边栏
    isOutlineEdit: false, // 是否是大纲编辑模式
    isReadonly: false, // 是否只读
    isSourceCodeEdit: false, // 是否是源码编辑模式
    extraTextOnExport: '', // 导出时底部添加的文字
    isDragOutlineTreeNode: false, // 当前是否正在拖拽大纲树的节点
    aiConfig: {
      currentProvider: 'lmstudio', // 当前选择的提供商

      providers: {
        // 云端模型提供商
        volcengine: {
          api: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          key: '',
          model: 'ep-20241229144621-8xvkz'
        },
        openai: {
          api: 'https://api.openai.com/v1/chat/completions',
          key: '',
          model: 'gpt-3.5-turbo'
        },
        claude: {
          api: 'https://api.anthropic.com/v1/messages',
          key: '',
          model: 'claude-3-haiku-20240307'
        },
        kimi: {
          api: 'https://api.moonshot.cn/v1/chat/completions',
          key: '',
          model: 'moonshot-v1-8k'
        },
        deepseek: {
          api: 'https://api.deepseek.com/v1/chat/completions',
          key: '',
          model: 'deepseek-chat'
        },
        zhipu: {
          api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          key: '',
          model: 'glm-4'
        },
        lingyiwanwu: {
          api: 'https://api.lingyiwanwu.com/v1/chat/completions',
          key: '',
          model: 'yi-34b-chat'
        },
        hunyuan: {
          api: 'https://hunyuan.tencentcloudapi.com',
          secretId: '',
          secretKey: '',
          model: 'hunyuan-lite',
          region: 'ap-beijing'
        },
        doubao: {
          api: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          key: '',
          model: 'doubao-lite-4k'
        },
        minimax: {
          api: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
          key: '',
          groupId: '',
          model: 'abab6.5s-chat'
        },
        stepfun: {
          api: 'https://api.stepfun.com/v1/chat/completions',
          key: '',
          model: 'step-1v-8k'
        },
        qwen: {
          api: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          key: '',
          model: 'qwen-turbo'
        },
        wenxin: {
          api: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
          apiKey: '',
          secretKey: '',
          model: 'ernie-bot-turbo'
        },
        // 本地模型提供商（无需API Key）
        ollama: {
          api: 'http://localhost:11434/api/chat',
          model: 'llama2',
          stream: true
        },
        lmstudio: {
          api: 'http://192.168.8.242:1234/v1/chat/completions',
          model: 'local-model'
        },
        localai: {
          api: 'http://localhost:8080/v1/chat/completions',
          model: 'gpt-3.5-turbo'
        },
        textgen: {
          api: 'http://localhost:5000/v1/chat/completions',
          model: 'local-model',
          max_new_tokens: 512,
          temperature: 0.7
        },
        vllm: {
          api: 'http://localhost:8000/v1/chat/completions',
          model: 'meta-llama/Llama-2-7b-chat-hf'
        },
        llamacpp: {
          api: 'http://localhost:8080/v1/chat/completions',
          model: 'llama-2-7b-chat.q4_0.gguf',
          n_predict: 512,
          temperature: 0.8
        },
        fastchat: {
          api: 'http://localhost:8000/v1/chat/completions',
          model: 'vicuna-7b-v1.5'
        },
        custom: {
          api: '',
          key: '',
          model: 'custom-model'
        }
      },
      port: 3456,
      method: 'POST'
    },
    // 扩展主题列表
    extendThemeGroupList: [],
    // 内置背景图片
    bgList: []
  },
  mutations: {
    // 设置操作本地文件标志位
    setIsHandleLocalFile(state, data) {
      state.isHandleLocalFile = data
    },

    // 设置本地配置
    setLocalConfig(state, data) {
      Object.keys(data).forEach(key => {
        if (key === 'aiConfig') {
          // 处理AI配置
          if (data.aiConfig.currentProvider) {
            state.aiConfig.currentProvider = data.aiConfig.currentProvider
          }

          if (data.aiConfig.providers) {
            Object.keys(data.aiConfig.providers).forEach(provider => {
              if (state.aiConfig.providers[provider]) {
                state.aiConfig.providers[provider] = {
                  ...state.aiConfig.providers[provider],
                  ...data.aiConfig.providers[provider]
                }
              }
            })
          }
        } else if (key.startsWith('ai_')) {
          // 兼容旧版本的AI配置格式
          const provider = key.replace('ai_', '')
          if (state.aiConfig.providers[provider]) {
            state.aiConfig.providers[provider] = {
              ...state.aiConfig.providers[provider],
              ...data[key]
            }
          }
        } else {
          state.localConfig[key] = data[key]
        }
      })
      storeLocalConfig({
        ...state.localConfig,
        aiConfig: state.aiConfig
      })
    },

    // 设置AI配置
    setAiConfig(state, { provider, config }) {
      if (provider) {
        state.aiConfig.currentProvider = provider
      }
      if (config && state.aiConfig.providers[provider || state.aiConfig.currentProvider]) {
        state.aiConfig.providers[provider || state.aiConfig.currentProvider] = {
          ...state.aiConfig.providers[provider || state.aiConfig.currentProvider],
          ...config
        }
      }
      storeLocalConfig({
        ...state.localConfig,
        aiConfig: state.aiConfig
      })
    },

    // 设置当前显示的侧边栏
    setActiveSidebar(state, data) {
      state.activeSidebar = data
    },

    // 设置大纲编辑模式
    setIsOutlineEdit(state, data) {
      state.isOutlineEdit = data
    },

    // 设置是否只读
    setIsReadonly(state, data) {
      state.isReadonly = data
    },

    // 设置源码编辑模式
    setIsSourceCodeEdit(state, data) {
      state.isSourceCodeEdit = data
    },

    // 设置导出时底部添加的文字
    setExtraTextOnExport(state, data) {
      state.extraTextOnExport = data
    },

    // 设置树节点拖拽
    setIsDragOutlineTreeNode(state, data) {
      state.isDragOutlineTreeNode = data
    },

    // 扩展主题列表
    setExtendThemeGroupList(state, data) {
      state.extendThemeGroupList = data
    },

    // 设置背景图片列表
    setBgList(state, data) {
      state.bgList = data
    }
  },
  actions: {}
})

export default store
