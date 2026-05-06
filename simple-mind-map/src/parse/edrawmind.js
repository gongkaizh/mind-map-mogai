import JSZip from 'jszip'
import { getNodeDataWithoutSelf } from '../utils'

/**
 * 将思维导图数据转换为EdrawMind格式
 */
const transformToEdrawMind = async (data, name = '思维导图') => {
  // 创建一个新的JSZip实例
  const zip = new JSZip()
  
  // 生成EdrawMind内容
  const content = generateEdrawMindContent(data, name)
  
  // 创建必要的文件结构
  zip.file('content.json', content)
  
  // 添加必要的元数据文件
  zip.file('meta.json', JSON.stringify({
    "application": "EdrawMind",
    "version": "1.0",
    "created": new Date().toISOString(),
    "title": name
  }))
  
  // 生成zip文件
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  })
  
  return blob
}

/**
 * 生成EdrawMind格式的内容
 */
const generateEdrawMindContent = (data, name) => {
  // 创建EdrawMind格式的数据结构
  const edrawMindData = {
    "meta": {
      "name": name,
      "author": "",
      "version": "1.0"
    },
    "format": "edrawmind",
    "rootTopic": processNodeForEdrawMind(data),
    "theme": {
      "name": "default",
      "backgroundColor": "#FFFFFF",
      "lineColor": "#CCCCCC",
      "lineWidth": 1
    }
  }
  
  return JSON.stringify(edrawMindData, null, 2)
}

/**
 * 处理节点数据，转换为EdrawMind格式
 */
const processNodeForEdrawMind = (node) => {
  const nodeData = node.data
  const children = node.children || []
  
  // 创建EdrawMind节点结构
  const edrawNode = {
    "id": nodeData.uid || generateUUID(),
    "title": nodeData.text || "",
    "style": {
      "backgroundColor": nodeData.backgroundColor || "#FFFFFF",
      "borderColor": nodeData.borderColor || "#CCCCCC",
      "borderWidth": 1,
      "fontSize": 12,
      "fontColor": nodeData.color || "#333333",
      "fontStyle": []
    },
    "expanded": nodeData.expand !== false,
    "children": []
  }
  
  // 添加备注
  if (nodeData.note) {
    edrawNode.note = nodeData.note
  }
  
  // 处理子节点
  if (children && children.length > 0) {
    children.forEach(child => {
      edrawNode.children.push(processNodeForEdrawMind(child))
    })
  }
  
  return edrawNode
}

/**
 * 生成UUID
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default {
  transformToEdrawMind
}