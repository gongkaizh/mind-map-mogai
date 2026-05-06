export default {
  aiCreatePart: 'AI 續寫',
  systemPrompt: '系統提示詞',
  userPrompt: '用戶提示詞', 
  userPromptPlaceholder: '使用費曼式語言表述(預設)',
  userPromptRequired: '請填寫用戶提示詞',
  systemPromptContent: '請根據以下內容繼續撰寫: {text}',
  contextmenu: {
    aiExplain: 'AI 解釋'
  },
  ai: {
    explain: 'AI 解釋',
    explainStarting: 'AI 解釋生成中...',
    explainProcessing: 'AI 正在處理您的請求，請耐心等待...',
    explainSuccess: 'AI 解釋生成完成',
    explainError: '獲取解釋失敗',
    appliedExplanation: '已應用解釋',
    explainCancel: '取消',
    emptyNode: '節點內容不能為空',
    requestFailed: 'AI 請求失敗：{{error}}',
    unknownError: '未知錯誤'
  },
  export: {
    batchExport: '批量導出',
    batchExportDesc: '同時導出多種格式的檔案，打包為ZIP檔案',
    selectAtLeastOne: '請至少選擇一種導出格式',
    batchExportSuccess: '批量導出成功，共導出 {count} 個檔案',
    batchExportPartial: '批量導出部分成功，成功 {success} 個，失敗 {fail} 個',
    batchExportFailed: '批量導出失敗'
  }
}