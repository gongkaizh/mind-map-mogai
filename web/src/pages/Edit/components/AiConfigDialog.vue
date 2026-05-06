<template>
  <el-dialog
    class="aiConfigDialog"
    :title="$t('ai.AIConfiguration')"
    :visible.sync="aiConfigDialogVisible"
    width="650px"
    append-to-body
  >
    <div class="aiConfigBox">
      <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleFormRef"
        label-width="120px"
      >
        <!-- 模型提供商选择 -->
        <el-form-item :label="$t('ai.modelProvider')" prop="provider">
          <el-select v-model="ruleForm.provider" @change="onProviderChange" style="width: 100%">
            <el-option
              v-for="provider in modelProviders"
              :key="provider.value"
              :label="provider.label"
              :value="provider.value"
            >
              <span style="float: left">{{ provider.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ provider.desc }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 动态配置区域 -->
        <div v-if="currentProvider">
          <p class="title">{{ currentProvider.label }} {{ $t('ai.configuration') }}</p>
          <p class="desc" v-if="currentProvider.configTip">
            {{ currentProvider.configTip }}
            <a v-if="currentProvider.docUrl" :href="currentProvider.docUrl" target="_blank">{{ $t('ai.viewDocs') }}</a>
          </p>

          <!-- API Key (云端模型需要) -->
          <el-form-item
            v-if="!['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(ruleForm.provider)"
            label="API Key"
            prop="key"
          >
            <el-input
              v-model="ruleForm.key"
              :placeholder="currentProvider.keyPlaceholder"
              show-password
            ></el-input>
          </el-form-item>

          <!-- 腾讯混元特殊配置 -->
          <template v-if="ruleForm.provider === 'hunyuan'">
            <el-form-item label="Secret ID" prop="secretId">
              <el-input
                v-model="ruleForm.secretId"
                placeholder="请输入腾讯云Secret ID"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="Secret Key" prop="secretKey">
              <el-input
                v-model="ruleForm.secretKey"
                placeholder="请输入腾讯云Secret Key"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="地域" prop="region">
              <el-select v-model="ruleForm.region" style="width: 100%">
                <el-option label="北京" value="ap-beijing"></el-option>
                <el-option label="上海" value="ap-shanghai"></el-option>
                <el-option label="广州" value="ap-guangzhou"></el-option>
              </el-select>
            </el-form-item>
          </template>

          <!-- 百度文心特殊配置 -->
          <template v-if="ruleForm.provider === 'wenxin'">
            <el-form-item label="API Key" prop="apiKey">
              <el-input
                v-model="ruleForm.apiKey"
                placeholder="请输入百度API Key"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="Secret Key" prop="secretKey">
              <el-input
                v-model="ruleForm.secretKey"
                placeholder="请输入百度Secret Key"
                show-password
              ></el-input>
            </el-form-item>
          </template>

          <!-- MiniMax特殊配置 -->
          <template v-if="ruleForm.provider === 'minimax'">
            <el-form-item label="Group ID" prop="groupId">
              <el-input
                v-model="ruleForm.groupId"
                placeholder="请输入MiniMax Group ID"
              ></el-input>
            </el-form-item>
          </template>

          <!-- Ollama特殊配置 -->
          <template v-if="ruleForm.provider === 'ollama'">
            <el-form-item label="流式输出" prop="stream">
              <el-select v-model="ruleForm.stream" style="width: 100%">
                <el-option label="启用" :value="true"></el-option>
                <el-option label="禁用" :value="false"></el-option>
              </el-select>
            </el-form-item>
          </template>

          <!-- Text Generation WebUI特殊配置 -->
          <template v-if="ruleForm.provider === 'textgen'">
            <el-form-item label="最大新token数" prop="max_new_tokens">
              <el-input
                v-model.number="ruleForm.max_new_tokens"
                placeholder="512"
                type="number"
              ></el-input>
            </el-form-item>
            <el-form-item label="温度" prop="temperature">
              <el-input
                v-model.number="ruleForm.temperature"
                placeholder="0.7"
                type="number"
                step="0.1"
              ></el-input>
            </el-form-item>
          </template>

          <!-- llama.cpp特殊配置 -->
          <template v-if="ruleForm.provider === 'llamacpp'">
            <el-form-item label="预测token数" prop="n_predict">
              <el-input
                v-model.number="ruleForm.n_predict"
                placeholder="512"
                type="number"
              ></el-input>
            </el-form-item>
            <el-form-item label="温度" prop="temperature">
              <el-input
                v-model.number="ruleForm.temperature"
                placeholder="0.8"
                type="number"
                step="0.1"
              ></el-input>
            </el-form-item>
          </template>

          <!-- 模型名称 -->
          <el-form-item :label="$t('ai.modelName')" prop="model">
            <el-select v-model="ruleForm.model" @change="onModelChange" filterable allow-create style="width: 100%">
              <el-option
                v-for="model in currentProvider.models"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              >
                <span style="float: left">{{ model.label }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ model.desc }}</span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 自定义API地址 (某些提供商支持) -->
          <el-form-item
            v-if="currentProvider.allowCustomApi"
            :label="$t('ai.apiEndpoint')"
            prop="api"
          >
            <el-input
              v-model="ruleForm.api"
              :placeholder="currentProvider.defaultApi"
            ></el-input>
          </el-form-item>



          <!-- 其他配置项 -->
          <template v-if="currentProvider.extraConfig">
            <el-form-item
              v-for="config in currentProvider.extraConfig"
              :key="config.key"
              :label="config.label"
              :prop="config.key"
            >
              <el-input
                v-if="config.type === 'input'"
                v-model="ruleForm[config.key]"
                :placeholder="config.placeholder"
              ></el-input>
              <el-select
                v-else-if="config.type === 'select'"
                v-model="ruleForm[config.key]"
                style="width: 100%"
              >
                <el-option
                  v-for="option in config.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </template>
        </div>
      </el-form>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="cancel">{{ $t('ai.cancel') }}</el-button>
      <el-button @click="testConnection" :loading="testing">
        {{ testing ? $t('ai.testing') : $t('ai.testConnection') }}
      </el-button>
      <el-button type="primary" @click="confirm">{{
        $t('ai.confirm')
      }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  model: {
    prop: 'visible',
    event: 'change'
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      aiConfigDialogVisible: false,
      testing: false,
      ruleForm: {
        provider: 'volcengine',
        api: '',
        key: '',
        model: '',

        // 特殊字段
        secretId: '', // 腾讯云
        secretKey: '', // 腾讯云、百度
        apiKey: '', // 百度
        groupId: '', // MiniMax
        region: 'ap-beijing', // 腾讯云
        // 本地模型参数
        stream: true, // Ollama
        max_new_tokens: 512, // Text Generation WebUI
        temperature: 0.7, // Text Generation WebUI, llama.cpp
        n_predict: 512 // llama.cpp
      },
      rules: {
        provider: [
          {
            required: true,
            message: this.$t('ai.providerValidateTip'),
            trigger: 'change'
          }
        ],
        key: [
          {
            required: false, // 改为非必需，在validator中动态检查
            validator: (rule, value, callback) => {
              // 本地模型不需要API Key
              const isLocalProvider = ['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(this.ruleForm.provider)
              if (!isLocalProvider && (!value || value === 'your-api-key-here')) {
                callback(new Error(this.$t('ai.keyValidateTip')))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        model: [
          {
            required: true,
            message: this.$t('ai.modelValidateTip'),
            trigger: 'blur'
          }
        ]
      },
      modelProviders: [
        {
          value: 'openai',
          label: 'OpenAI',
          desc: 'GPT-4, GPT-3.5',
          defaultApi: 'https://api.openai.com/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的OpenAI API Key，支持GPT-4和GPT-3.5模型。',
          docUrl: 'https://platform.openai.com/docs/api-reference',
          models: [
            { value: 'gpt-4', label: 'GPT-4', desc: '最强大的模型' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: '更快的GPT-4' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: '快速且经济' },
            { value: 'o1-preview', label: 'o1-preview', desc: '深度思考推理模型', isDeepThinking: true },
            { value: 'o1-mini', label: 'o1-mini', desc: '轻量级推理模型', isDeepThinking: true }
          ]
        },
        {
          value: 'claude',
          label: 'Anthropic Claude',
          desc: 'Claude-3, Claude-2',
          defaultApi: 'https://api.anthropic.com/v1/messages',
          allowCustomApi: true,
          keyPlaceholder: 'sk-ant-...',
          configTip: '请输入您的Anthropic API Key，支持Claude-3和Claude-2模型。',
          docUrl: 'https://docs.anthropic.com/claude/reference',
          models: [
            { value: 'claude-3-opus-20240229', label: 'Claude-3 Opus', desc: '最强大的Claude模型' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude-3 Sonnet', desc: '平衡性能和速度' },
            { value: 'claude-3-haiku-20240307', label: 'Claude-3 Haiku', desc: '快速响应' }
          ]
        },
        {
          value: 'volcengine',
          label: '火山引擎',
          desc: '豆包大模型',
          defaultApi: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: '请输入API Key',
          configTip: '请配置火山引擎豆包大模型的API Key和推理接入点。',
          docUrl: 'https://mp.weixin.qq.com/s/JNb7PH4sCjWzIZ9G8wStGQ',
          models: [
            { value: 'ep-20241229144621-8xvkz', label: '豆包-lite-4k', desc: '轻量级模型' },
            { value: 'ep-20241229144621-8xvkz', label: '豆包-pro-4k', desc: '专业版模型' }
          ]
        },
        {
          value: 'qianwen',
          label: '通义千问',
          desc: '阿里云大模型',
          defaultApi: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          allowCustomApi: false,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的阿里云DashScope API Key。',
          docUrl: 'https://help.aliyun.com/zh/dashscope/',
          models: [
            { value: 'qwen-turbo', label: 'Qwen-Turbo', desc: '快速响应' },
            { value: 'qwen-plus', label: 'Qwen-Plus', desc: '平衡性能' },
            { value: 'qwen-max', label: 'Qwen-Max', desc: '最强性能' },
            { value: 'qwen3-7b-instruct', label: 'Qwen3-7B-Instruct', desc: '通义千问3代7B指令模型', isDeepThinking: true },
            { value: 'qwen3-14b-instruct', label: 'Qwen3-14B-Instruct', desc: '通义千问3代14B指令模型', isDeepThinking: true }
          ]
        },
        {
          value: 'baidu',
          label: '文心一言',
          desc: '百度大模型',
          defaultApi: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: '请输入API Key',
          configTip: '请输入您的百度文心一言API Key和Secret Key。',
          docUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html',
          models: [
            { value: 'ernie-bot', label: 'ERNIE-Bot', desc: '文心一言' },
            { value: 'ernie-bot-turbo', label: 'ERNIE-Bot-turbo', desc: '文心一言turbo' },
            { value: 'ernie-bot-4', label: 'ERNIE-Bot-4', desc: '文心一言4.0' }
          ],
          extraConfig: [
            {
              key: 'secretKey',
              label: 'Secret Key',
              type: 'input',
              placeholder: '请输入Secret Key'
            }
          ]
        },
        {
          value: 'kimi',
          label: 'Kimi',
          desc: '月之暗面大模型',
          defaultApi: 'https://api.moonshot.cn/v1/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的Kimi API Key，支持长文本处理。',
          docUrl: 'https://platform.moonshot.cn/docs',
          models: [
            { value: 'moonshot-v1-8k', label: 'Moonshot-v1-8k', desc: '8K上下文' },
            { value: 'moonshot-v1-32k', label: 'Moonshot-v1-32k', desc: '32K上下文' },
            { value: 'moonshot-v1-128k', label: 'Moonshot-v1-128k', desc: '128K上下文' }
          ]
        },
        {
          value: 'deepseek',
          label: 'DeepSeek',
          desc: '深度求索大模型',
          defaultApi: 'https://api.deepseek.com/v1/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的DeepSeek API Key，高性价比的代码和推理模型。',
          docUrl: 'https://platform.deepseek.com/api-docs',
          models: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat', desc: '通用对话模型' },
            { value: 'deepseek-coder', label: 'DeepSeek Coder', desc: '代码专用模型' },
            { value: 'deepseek-reasoner', label: 'DeepSeek R1', desc: '深度思考推理模型', isDeepThinking: true }
          ]
        },
        {
          value: 'zhipu',
          label: '智谱GLM',
          desc: '智谱AI大模型',
          defaultApi: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: '请输入API Key',
          configTip: '请输入您的智谱AI API Key。',
          docUrl: 'https://open.bigmodel.cn/dev/api',
          models: [
            { value: 'glm-4', label: 'GLM-4', desc: '最新一代模型' },
            { value: 'glm-4-air', label: 'GLM-4-Air', desc: '轻量版模型' },
            { value: 'glm-4-airx', label: 'GLM-4-AirX', desc: '增强版模型' },
            { value: 'glm-4-flash', label: 'GLM-4-Flash', desc: '快速响应模型' }
          ]
        },
        {
          value: 'yi',
          label: '零一万物',
          desc: '01.AI大模型',
          defaultApi: 'https://api.lingyiwanwu.com/v1/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的零一万物API Key。',
          docUrl: 'https://platform.lingyiwanwu.com/docs',
          models: [
            { value: 'yi-34b-chat-0205', label: 'Yi-34B-Chat', desc: '340亿参数模型' },
            { value: 'yi-34b-chat-200k', label: 'Yi-34B-Chat-200K', desc: '200K上下文' },
            { value: 'yi-vl-plus', label: 'Yi-VL-Plus', desc: '视觉语言模型' }
          ]
        },
        {
          value: 'hunyuan',
          label: '腾讯混元',
          desc: '腾讯云混元大模型',
          defaultApi: 'https://hunyuan.tencentcloudapi.com',
          allowCustomApi: false,
          keyPlaceholder: '请输入SecretId',
          configTip: '请输入您的腾讯云SecretId和SecretKey。',
          docUrl: 'https://cloud.tencent.com/document/product/1729',
          models: [
            { value: 'hunyuan-lite', label: '混元-Lite', desc: '轻量版模型' },
            { value: 'hunyuan-standard', label: '混元-Standard', desc: '标准版模型' },
            { value: 'hunyuan-pro', label: '混元-Pro', desc: '专业版模型' }
          ],
          extraConfig: [
            {
              key: 'secretKey',
              label: 'SecretKey',
              type: 'input',
              placeholder: '请输入SecretKey'
            },
            {
              key: 'region',
              label: '地域',
              type: 'select',
              options: [
                { value: 'ap-beijing', label: '北京' },
                { value: 'ap-shanghai', label: '上海' },
                { value: 'ap-guangzhou', label: '广州' }
              ]
            }
          ]
        },
        {
          value: 'doubao',
          label: '豆包',
          desc: '字节跳动豆包大模型',
          defaultApi: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: '请输入API Key',
          configTip: '请输入您的豆包API Key和推理接入点。',
          docUrl: 'https://www.volcengine.com/docs/82379',
          models: [
            { value: 'doubao-lite-4k', label: '豆包-lite-4k', desc: '轻量级模型' },
            { value: 'doubao-lite-32k', label: '豆包-lite-32k', desc: '32K上下文' },
            { value: 'doubao-pro-4k', label: '豆包-pro-4k', desc: '专业版模型' },
            { value: 'doubao-pro-32k', label: '豆包-pro-32k', desc: '专业版32K' },
            { value: 'doubao-pro-128k', label: '豆包-pro-128k', desc: '专业版128K' }
          ]
        },
        {
          value: 'minimax',
          label: 'MiniMax',
          desc: 'MiniMax大模型',
          defaultApi: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
          allowCustomApi: false,
          keyPlaceholder: '请输入API Key',
          configTip: '请输入您的MiniMax API Key。',
          docUrl: 'https://api.minimax.chat/document',
          models: [
            { value: 'abab6.5s-chat', label: 'abab6.5s-chat', desc: '高性能对话模型' },
            { value: 'abab6.5g-chat', label: 'abab6.5g-chat', desc: '通用对话模型' },
            { value: 'abab6.5t-chat', label: 'abab6.5t-chat', desc: '文本生成模型' }
          ],
          extraConfig: [
            {
              key: 'groupId',
              label: 'Group ID',
              type: 'input',
              placeholder: '请输入Group ID'
            }
          ]
        },
        {
          value: 'stepfun',
          label: '阶跃星辰',
          desc: 'Step-1系列模型',
          defaultApi: 'https://api.stepfun.com/v1/chat/completions',
          allowCustomApi: false,
          keyPlaceholder: 'sk-...',
          configTip: '请输入您的阶跃星辰API Key。',
          docUrl: 'https://platform.stepfun.com/docs',
          models: [
            { value: 'step-1v-8k', label: 'Step-1V-8K', desc: '多模态模型8K' },
            { value: 'step-1v-32k', label: 'Step-1V-32K', desc: '多模态模型32K' },
            { value: 'step-1-8k', label: 'Step-1-8K', desc: '文本模型8K' },
            { value: 'step-1-32k', label: 'Step-1-32K', desc: '文本模型32K' },
            { value: 'step-1-128k', label: 'Step-1-128K', desc: '文本模型128K' }
          ]
        },
        {
          value: 'ollama',
          label: 'Ollama',
          desc: '本地大模型运行平台',
          defaultApi: 'http://localhost:11434/api/chat',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key（可选）',
          configTip: '本地运行的Ollama服务，支持Llama、Mistral、CodeLlama等开源模型。',
          docUrl: 'https://ollama.ai/docs',
          models: [
            { value: 'llama2', label: 'Llama 2', desc: 'Meta开源模型' },
            { value: 'llama2:13b', label: 'Llama 2 13B', desc: '13B参数版本' },
            { value: 'llama2:70b', label: 'Llama 2 70B', desc: '70B参数版本' },
            { value: 'mistral', label: 'Mistral', desc: 'Mistral AI模型' },
            { value: 'codellama', label: 'Code Llama', desc: '代码专用模型' },
            { value: 'vicuna', label: 'Vicuna', desc: '基于Llama的对话模型' },
            { value: 'orca-mini', label: 'Orca Mini', desc: '轻量级模型' },
            { value: 'qwen:7b', label: 'Qwen 7B', desc: '通义千问7B' },
            { value: 'qwen:14b', label: 'Qwen 14B', desc: '通义千问14B' },
            { value: 'chatglm3', label: 'ChatGLM3', desc: '智谱GLM3' }
          ],
          extraConfig: [
            {
              key: 'stream',
              label: '流式输出',
              type: 'select',
              options: [
                { value: true, label: '启用' },
                { value: false, label: '禁用' }
              ]
            }
          ]
        },
        {
          value: 'lmstudio',
          label: 'LM Studio',
          desc: '本地模型管理工具',
          defaultApi: 'http://localhost:1234/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'LM Studio本地服务，兼容OpenAI API格式。',
          docUrl: 'https://lmstudio.ai/docs',
          models: [
            { value: 'local-model', label: '本地模型', desc: '请选择LM Studio中加载的模型' },
            { value: 'qwen3-7b-instruct', label: 'Qwen3 7B Instruct', desc: '通义千问3代7B指令模型', isDeepThinking: true },
            { value: 'qwen3-14b-instruct', label: 'Qwen3 14B Instruct', desc: '通义千问3代14B指令模型', isDeepThinking: true },
            { value: 'llama-2-7b-chat', label: 'Llama 2 7B Chat', desc: '7B对话模型' },
            { value: 'llama-2-13b-chat', label: 'Llama 2 13B Chat', desc: '13B对话模型' },
            { value: 'mistral-7b-instruct', label: 'Mistral 7B Instruct', desc: 'Mistral指令模型' },
            { value: 'code-llama-7b-instruct', label: 'Code Llama 7B', desc: '代码生成模型' },
            { value: 'vicuna-7b-v1.5', label: 'Vicuna 7B v1.5', desc: 'Vicuna对话模型' }
          ]
        },
        {
          value: 'localai',
          label: 'LocalAI',
          desc: '开源本地AI服务',
          defaultApi: 'http://localhost:8080/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'LocalAI是OpenAI的开源替代方案，支持多种模型格式。',
          docUrl: 'https://localai.io/docs',
          models: [
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5-turbo (兼容)', desc: '兼容模式' },
            { value: 'gpt-4', label: 'GPT-4 (兼容)', desc: '兼容模式' },
            { value: 'llama2-chat', label: 'Llama2 Chat', desc: 'Llama2对话模型' },
            { value: 'mistral-instruct', label: 'Mistral Instruct', desc: 'Mistral指令模型' },
            { value: 'codellama', label: 'CodeLlama', desc: '代码生成模型' }
          ]
        },
        {
          value: 'textgen',
          label: 'Text Generation WebUI',
          desc: 'oobabooga文本生成界面',
          defaultApi: 'http://localhost:5000/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'Text Generation WebUI (oobabooga)，支持多种开源模型。',
          docUrl: 'https://github.com/oobabooga/text-generation-webui',
          models: [
            { value: 'local-model', label: '当前加载的模型', desc: '使用WebUI中加载的模型' },
            { value: 'llama-2-7b-chat-hf', label: 'Llama 2 7B Chat', desc: 'HuggingFace格式' },
            { value: 'llama-2-13b-chat-hf', label: 'Llama 2 13B Chat', desc: 'HuggingFace格式' },
            { value: 'mistral-7b-instruct-v0.1', label: 'Mistral 7B Instruct', desc: 'Mistral指令模型' },
            { value: 'vicuna-7b-v1.5', label: 'Vicuna 7B v1.5', desc: 'Vicuna对话模型' },
            { value: 'wizardcoder-15b', label: 'WizardCoder 15B', desc: '代码生成专用' }
          ],
          extraConfig: [
            {
              key: 'max_new_tokens',
              label: '最大新token数',
              type: 'input',
              placeholder: '512'
            },
            {
              key: 'temperature',
              label: '温度',
              type: 'input',
              placeholder: '0.7'
            }
          ]
        },
        {
          value: 'vllm',
          label: 'vLLM',
          desc: '高性能推理引擎',
          defaultApi: 'http://localhost:8000/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'vLLM是高性能的大模型推理引擎，兼容OpenAI API。',
          docUrl: 'https://docs.vllm.ai',
          models: [
            { value: 'meta-llama/Llama-2-7b-chat-hf', label: 'Llama 2 7B Chat', desc: 'Meta官方模型' },
            { value: 'meta-llama/Llama-2-13b-chat-hf', label: 'Llama 2 13B Chat', desc: 'Meta官方模型' },
            { value: 'mistralai/Mistral-7B-Instruct-v0.1', label: 'Mistral 7B Instruct', desc: 'Mistral官方模型' },
            { value: 'codellama/CodeLlama-7b-Instruct-hf', label: 'CodeLlama 7B', desc: '代码生成模型' },
            { value: 'lmsys/vicuna-7b-v1.5', label: 'Vicuna 7B v1.5', desc: 'LMSYS对话模型' },
            { value: 'WizardLM/WizardCoder-15B-V1.0', label: 'WizardCoder 15B', desc: '代码专用模型' }
          ]
        },
        {
          value: 'llamacpp',
          label: 'llama.cpp',
          desc: 'C++推理引擎',
          defaultApi: 'http://localhost:8080/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'llama.cpp服务器模式，轻量级本地推理。',
          docUrl: 'https://github.com/ggerganov/llama.cpp',
          models: [
            { value: 'llama-2-7b-chat.q4_0.gguf', label: 'Llama 2 7B Q4_0', desc: '4位量化版本' },
            { value: 'llama-2-13b-chat.q4_0.gguf', label: 'Llama 2 13B Q4_0', desc: '4位量化版本' },
            { value: 'mistral-7b-instruct-v0.1.q4_0.gguf', label: 'Mistral 7B Q4_0', desc: '4位量化版本' },
            { value: 'codellama-7b-instruct.q4_0.gguf', label: 'CodeLlama 7B Q4_0', desc: '代码模型量化版' },
            { value: 'vicuna-7b-v1.5.q4_0.gguf', label: 'Vicuna 7B Q4_0', desc: '对话模型量化版' }
          ],
          extraConfig: [
            {
              key: 'n_predict',
              label: '预测token数',
              type: 'input',
              placeholder: '512'
            },
            {
              key: 'temperature',
              label: '温度',
              type: 'input',
              placeholder: '0.8'
            }
          ]
        },
        {
          value: 'fastchat',
          label: 'FastChat',
          desc: 'LMSYS对话服务',
          defaultApi: 'http://localhost:8000/v1/chat/completions',
          allowCustomApi: true,
          keyPlaceholder: '无需API Key',
          configTip: 'FastChat是LMSYS开发的对话模型服务框架。',
          docUrl: 'https://github.com/lm-sys/FastChat',
          models: [
            { value: 'vicuna-7b-v1.5', label: 'Vicuna 7B v1.5', desc: 'LMSYS对话模型' },
            { value: 'vicuna-13b-v1.5', label: 'Vicuna 13B v1.5', desc: 'LMSYS对话模型' },
            { value: 'fastchat-t5-3b-v1.0', label: 'FastChat T5 3B', desc: 'T5架构模型' },
            { value: 'alpaca-7b', label: 'Alpaca 7B', desc: 'Stanford指令模型' },
            { value: 'koala-7b', label: 'Koala 7B', desc: 'UC Berkeley模型' }
          ]
        },
        {
          value: 'custom',
          label: '自定义',
          desc: '兼容OpenAI格式',
          defaultApi: '',
          allowCustomApi: true,
          keyPlaceholder: '请输入API Key（可选）',
          configTip: '配置兼容OpenAI格式的自定义API接口。',
          models: [
            { value: 'custom-model', label: '自定义模型', desc: '请手动输入模型名称' }
          ]
        }
      ]
    }
  },
  computed: {
    ...mapState(['aiConfig']),

    // 获取当前提供商的配置
    currentProviderConfig() {
      const provider = this.ruleForm.provider || this.aiConfig.currentProvider
      return this.aiConfig.providers[provider] || {}
    },
    currentProvider() {
      return this.modelProviders.find(p => p.value === this.ruleForm.provider)
    }
  },
  watch: {
    visible(val) {
      this.aiConfigDialogVisible = val
    },
    aiConfigDialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.close()
      }
    }
  },
  created() {
    this.initFormData()
  },
  methods: {
    ...mapMutations(['setLocalConfig']),

    close() {
      this.$emit('change', false)
    },

    initFormData() {
      // 设置当前提供商
      this.ruleForm.provider = this.aiConfig.currentProvider || 'volcengine'



      // 加载当前提供商的配置
      const providerConfig = this.aiConfig.providers[this.ruleForm.provider] || {}
      Object.keys(providerConfig).forEach(key => {
        if (this.ruleForm.hasOwnProperty(key)) {
          this.ruleForm[key] = providerConfig[key]
        }
      })

      // 触发提供商变更处理（但不覆盖已有配置）
      this.onProviderChange(this.ruleForm.provider, true)
    },

    // 模型变更时的处理
    onModelChange(modelValue) {
      // 检查是否是深度思考模型
      if (this.currentProvider && this.currentProvider.models) {

      }
    },

    // 提供商变更时的处理
    onProviderChange(provider, isInitializing = false) {
      const providerConfig = this.modelProviders.find(p => p.value === provider)
      if (providerConfig) {
        // 只在非初始化时或者没有现有配置时设置默认值
        if (!isInitializing || !this.ruleForm.api) {
          this.ruleForm.api = providerConfig.defaultApi
        }

        // 只在非初始化时或者没有现有模型时设置默认模型
        if (!isInitializing || !this.ruleForm.model) {
          if (providerConfig.models && providerConfig.models.length > 0) {
            this.ruleForm.model = providerConfig.models[0].value
          }
        }

        // 清空API Key（让用户重新输入）- 只在真正切换提供商时
        if (this.ruleForm.provider !== provider && !isInitializing) {
          this.ruleForm.key = ''
        }

        // 清空额外配置 - 只在真正切换提供商时
        if (!isInitializing && providerConfig.extraConfig) {
          providerConfig.extraConfig.forEach(config => {
            this.ruleForm[config.key] = ''
          })
        }
      }
    },

    cancel() {
      this.close()
      this.initFormData()
    },

    async testConnection() {
      // 验证必填字段
      if (!this.ruleForm.provider) {
        this.$message.error(this.$t('ai.selectProvider'))
        return
      }

      if (!this.ruleForm.model) {
        this.$message.error(this.$t('ai.selectModel'))
        return
      }

      // 检查是否需要API Key
      const provider = this.currentProvider
      const needsApiKey = !['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(this.ruleForm.provider)

      if (needsApiKey && !this.ruleForm.key) {
        this.$message.error(this.$t('ai.inputApiKey'))
        return
      }

      if (!this.ruleForm.api) {
        this.$message.error(this.$t('ai.inputApiUrl'))
        return
      }

      this.testing = true

      try {
        // 对于本地模型，直接测试连接
        const isLocalProvider = ['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(this.ruleForm.provider)

        if (isLocalProvider) {
          // 直接测试本地模型API
          const testData = {
            model: this.ruleForm.model || 'local-model',
            messages: [
              {
                role: 'user',
                content: 'Hello, this is a connection test.'
              }
            ],
            max_tokens: 10,
            temperature: 0.7
          }

          const response = await fetch(this.ruleForm.api, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.ruleForm.key ? { 'Authorization': `Bearer ${this.ruleForm.key}` } : {})
            },
            body: JSON.stringify(testData)
          })

          if (response.ok) {
            this.$message.success(this.$t('ai.testConnectionSuccess'))
          } else {
            const errorText = await response.text()
            this.$message.error(`${this.$t('ai.testConnectionFailed')}: ${errorText}`)
          }
        } else {
          // 云端模型通过AI服务测试
          const testConfig = {
            provider: this.ruleForm.provider,
            api: this.ruleForm.api,
            key: this.ruleForm.key,
            model: this.ruleForm.model,
            method: 'POST'
          }

          const testMessage = [
            {
              role: 'user',
              content: 'Hello, this is a connection test.'
            }
          ]

          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...testConfig,
              messages: testMessage
            })
          })

          if (response.ok) {
            this.$message.success(this.$t('ai.testConnectionSuccess'))
          } else {
            const errorText = await response.text()
            this.$message.error(`${this.$t('ai.testConnectionFailed')}: ${errorText}`)
          }
        }
      } catch (error) {
        console.error('Connection test failed:', error)
        this.$message.error(`${this.$t('ai.testConnectionFailed')}: ${error.message}`)
      } finally {
        this.testing = false
      }
    },

    confirm() {
      this.$refs.ruleFormRef.validate(valid => {
        if (valid) {
          // 构建当前提供商的配置对象
          const providerConfig = {}
          const provider = this.ruleForm.provider

          // 基础字段
          providerConfig.api = this.ruleForm.api
          providerConfig.model = this.ruleForm.model

          // 根据提供商添加特定字段
          if (provider === 'hunyuan') {
            // 腾讯混元
            providerConfig.secretId = this.ruleForm.secretId
            providerConfig.secretKey = this.ruleForm.secretKey
            providerConfig.region = this.ruleForm.region
          } else if (provider === 'wenxin') {
            // 百度文心
            providerConfig.apiKey = this.ruleForm.apiKey
            providerConfig.secretKey = this.ruleForm.secretKey
          } else if (provider === 'minimax') {
            // MiniMax
            providerConfig.key = this.ruleForm.key
            providerConfig.groupId = this.ruleForm.groupId
          } else if (['ollama', 'lmstudio', 'localai', 'textgen', 'vllm', 'llamacpp', 'fastchat'].includes(provider)) {
            // 本地模型，不需要key
            if (provider === 'ollama') {
              providerConfig.stream = this.ruleForm.stream
            } else if (provider === 'textgen') {
              providerConfig.max_new_tokens = this.ruleForm.max_new_tokens
              providerConfig.temperature = this.ruleForm.temperature
            } else if (provider === 'llamacpp') {
              providerConfig.n_predict = this.ruleForm.n_predict
              providerConfig.temperature = this.ruleForm.temperature
            }
          } else {
            // 其他云端模型，需要key
            providerConfig.key = this.ruleForm.key
          }

          // 保存AI配置
          this.$store.commit('setAiConfig', {
            provider: provider,
            config: providerConfig
          })

          this.$message.success(this.$t('ai.configSaveSuccessTip'))
          this.close()
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.aiConfigDialog {
  /deep/ .el-dialog__body {
    padding: 12px 20px;
  }

  .aiConfigBox {
    a {
      color: #409eff;
    }

    .title {
      margin-bottom: 12px;
      font-weight: bold;
    }

    .desc {
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 5px solid #ccc;
    }

    .form-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
      line-height: 1.4;

      p {
        margin: 4px 0;
      }
    }
  }
}
</style>
