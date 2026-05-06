import JSZip from 'jszip'
import { getNodeDataWithoutSelf } from '../utils'

/**
 * 将思维导图数据转换为MindManager格式
 */
const transformToMindManager = async (data, name = '思维导图') => {
  // 创建一个新的JSZip实例
  const zip = new JSZip()
  
  // 生成MindManager XML内容
  const xmlContent = generateMindManagerXML(data, name)
  
  // 创建Document.xml文件
  zip.file('Document.xml', xmlContent)
  
  // 添加必要的元数据文件
  zip.file('[Content_Types].xml', generateContentTypes())
  
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
 * 生成MindManager格式的XML内容
 */
const generateMindManagerXML = (data, name) => {
  // XML头部
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  xml += '<ap:Map xmlns:ap="http://schemas.mindjet.com/MindManager/Application/2003" '
  xml += 'xmlns:cor="http://schemas.mindjet.com/MindManager/Core/2003" '
  xml += 'xmlns:pri="http://schemas.mindjet.com/MindManager/Primitive/2003">\n'
  
  // 添加文档属性
  xml += '  <ap:OneTopic>\n'
  xml += `    <ap:Title>${escapeXML(name)}</ap:Title>\n`
  xml += '    <ap:CreatedBy></ap:CreatedBy>\n'
  xml += `    <ap:CreatedDate>${new Date().toISOString()}</ap:CreatedDate>\n`
  xml += '  </ap:OneTopic>\n'
  
  // 添加根节点
  xml += processNodeForMindManager(data, true)
  
  // XML尾部
  xml += '</ap:Map>'
  
  return xml
}

/**
 * 处理节点数据，转换为MindManager格式的XML
 */
const processNodeForMindManager = (node, isRoot = false) => {
  const nodeData = node.data
  const children = node.children || []
  
  // 节点文本内容
  const text = nodeData.text ? escapeXML(nodeData.text) : ''
  
  // 节点开始标签
  let nodeXml = isRoot 
    ? '  <ap:Topic type="Root">\n' 
    : '  <ap:Topic>\n'
  
  // 添加节点ID和文本
  nodeXml += `    <ap:OId>${nodeData.uid || generateUUID()}</ap:OId>\n`
  nodeXml += `    <ap:Text>${text}</ap:Text>\n`
  
  // 添加节点样式
  nodeXml += '    <ap:Style>\n'
  if (nodeData.color) {
    nodeXml += `      <ap:Font color="${nodeData.color}"/>\n`
  }
  if (nodeData.backgroundColor) {
    nodeXml += `      <ap:Fill color="${nodeData.backgroundColor}"/>\n`
  }
  nodeXml += '    </ap:Style>\n'
  
  // 添加节点展开状态
  if (nodeData.expand === false) {
    nodeXml += '    <ap:Collapsed>true</ap:Collapsed>\n'
  }
  
  // 添加节点备注
  if (nodeData.note) {
    nodeXml += '    <ap:Notes>\n'
    nodeXml += `      <ap:PlainText>${escapeXML(nodeData.note)}</ap:PlainText>\n`
    nodeXml += '    </ap:Notes>\n'
  }
  
  // 处理子节点
  if (children && children.length > 0) {
    nodeXml += '    <ap:SubTopics>\n'
    children.forEach(child => {
      nodeXml += processNodeForMindManager(child)
    })
    nodeXml += '    </ap:SubTopics>\n'
  }
  
  // 节点结束标签
  nodeXml += '  </ap:Topic>\n'
  
  return nodeXml
}

/**
 * 生成Content_Types.xml文件内容
 */
const generateContentTypes = () => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/vnd.mindjet.mindmanager"/>
</Types>`
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
  transformToMindManager
}