import JSZip from 'jszip'
import { getNodeDataWithoutSelf } from '../utils'

/**
 * 将思维导图数据转换为FreeMind格式
 */
const transformToFreeMind = async (data, name = '思维导图') => {
  // 创建一个新的JSZip实例
  const zip = new JSZip()
  
  // 生成FreeMind XML内容
  const xmlContent = generateFreeMindXML(data, name)
  
  // 将XML内容添加到zip中
  zip.file(`${name}.mm`, xmlContent)
  
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
 * 生成FreeMind格式的XML内容
 */
const generateFreeMindXML = (data, name) => {
  // XML头部
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<map version="1.0.1">\n'
  
  // 添加根节点
  xml += processNode(data, true)
  
  // XML尾部
  xml += '</map>'
  
  return xml
}

/**
 * 处理节点数据，转换为FreeMind格式的XML
 */
const processNode = (node, isRoot = false) => {
  const nodeData = node.data
  const children = node.children || []
  
  // 节点文本内容，转义XML特殊字符
  const text = nodeData.text ? escapeXML(nodeData.text) : ''
  
  // 节点开始标签
  let nodeXml = isRoot 
    ? `  <node ID="${nodeData.uid || 'root'}" TEXT="${text}">\n` 
    : `  <node ID="${nodeData.uid || generateUUID()}" TEXT="${text}">\n`
  
  // 添加节点样式
  if (nodeData.expandState === false) {
    nodeXml += '    <node FOLDED="true"/>\n'
  }
  
  // 添加节点颜色
  if (nodeData.color) {
    nodeXml += `    <font NAME="SansSerif" SIZE="12" BOLD="false" ITALIC="false"><COLOR value="${nodeData.color}"/></font>\n`
  }
  
  // 添加节点备注
  if (nodeData.note) {
    nodeXml += `    <richcontent TYPE="NOTE"><html><head></head><body>${escapeXML(nodeData.note)}</body></html></richcontent>\n`
  }
  
  // 处理子节点
  if (children && children.length > 0) {
    children.forEach(child => {
      nodeXml += processNode(child)
    })
  }
  
  // 节点结束标签
  nodeXml += '  </node>\n'
  
  return nodeXml
}

/**
 * 转义XML特殊字符
 */
const escapeXML = (str) => {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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
  transformToFreeMind
}