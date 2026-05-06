import { readBlob } from '../utils/index'

// 导出MindManager插件，需要通过Export插件使用
class ExportMindManager {
  // 构造函数
  constructor(opt) {
    this.mindMap = opt.mindMap
  }

  // 转换节点数据为MindManager格式
  transformNodeData(node, isRoot = false) {
    // 转义XML特殊字符
    const escapeXml = (text) => {
      if (!text) return ''
      return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    // 生成MindManager兼容的ID（使用GUID格式）
    const generateGuid = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const data = {
      id: node.data.id || generateGuid(),
      text: escapeXml(node.data.text || ''),
      position: isRoot ? 'center' : (node.data.side === 'left' ? 'left' : 'right')
    }

    // 添加样式属性
    const style = {}
    if (node.data.color) style.color = node.data.color
    if (node.data.backgroundColor) style.backgroundColor = node.data.backgroundColor
    if (node.data.fontSize) style.fontSize = node.data.fontSize
    if (node.data.fontFamily) style.fontFamily = node.data.fontFamily
    if (node.data.fontWeight) style.fontWeight = node.data.fontWeight
    if (node.data.fontStyle) style.fontStyle = node.data.fontStyle
    if (node.data.borderColor) style.borderColor = node.data.borderColor
    if (node.data.borderWidth) style.borderWidth = node.data.borderWidth
    if (Object.keys(style).length > 0) {
      data.style = style
    }

    // 添加备注信息（如果有）
    if (node.data.note) {
      data.note = escapeXml(node.data.note)
    }

    // 添加超链接（如果有）
    if (node.data.hyperlink) {
      data.hyperlink = escapeXml(node.data.hyperlink)
    }

    // 添加图标（如果有）
    if (node.data.icon) {
      data.icon = node.data.icon
    }

    // 添加标签（如果有）
    if (node.data.tag) {
      data.tag = escapeXml(node.data.tag)
    }

    // 添加优先级（如果有）
    if (node.data.priority) {
      data.priority = node.data.priority
    }

    // 添加进度（如果有）
    if (node.data.progress) {
      data.progress = node.data.progress
    }

    // 添加展开状态
    data.folded = node.data.expand === false

    // 添加子节点
    if (node.children && node.children.length > 0) {
      data.children = node.children.map(child => this.transformNodeData(child, false))
    }

    return data
  }

  // 生成MindManager XML格式
  generateMindManagerXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<ap:Map xmlns:ap="http://schemas.mindjet.com/MindManager/Application/2003" xmlns:cor="http://schemas.mindjet.com/MindManager/Core/2003" xmlns:pri="http://schemas.mindjet.com/MindManager/Primitive/2003">\n'

    // 添加文档信息
    xml += '  <ap:OneTopic>\n'

    // 转换根节点
    const rootNode = this.transformNodeData(data, true)
    xml += this.topicToXML(rootNode, 2)

    xml += '  </ap:OneTopic>\n'
    xml += '</ap:Map>\n'
    return xml
  }

  // 将主题数据转换为XML字符串（MindManager标准格式）
  topicToXML(topic, level) {
    const indent = '  '.repeat(level)
    let xml = `${indent}<ap:Topic>\n`

    // 添加主题文本（这是MindManager显示的主要内容）
    xml += `${indent}  <ap:Text>\n`
    xml += `${indent}    <ap:PlainText>${topic.text}</ap:PlainText>\n`
    xml += `${indent}  </ap:Text>\n`

    // 添加主题属性
    if (topic.position || topic.folded) {
      xml += `${indent}  <ap:TopicProperties>\n`

      if (topic.position && topic.position !== 'center') {
        xml += `${indent}    <ap:Offset>\n`
        xml += `${indent}      <ap:X>0</ap:X>\n`
        xml += `${indent}      <ap:Y>0</ap:Y>\n`
        xml += `${indent}    </ap:Offset>\n`
      }

      if (topic.folded) {
        xml += `${indent}    <ap:SubTopicsShape>ap:stFolded</ap:SubTopicsShape>\n`
      }

      xml += `${indent}  </ap:TopicProperties>\n`
    }

    // 添加样式信息
    if (topic.style && (topic.style.color || topic.style.backgroundColor ||
        topic.style.fontFamily || topic.style.fontSize ||
        topic.style.fontWeight || topic.style.fontStyle ||
        topic.style.borderColor || topic.style.borderWidth)) {
      xml += `${indent}  <ap:StyleProperties>\n`

      // 文本样式
      if (topic.style.color || topic.style.fontFamily || topic.style.fontSize ||
          topic.style.fontWeight || topic.style.fontStyle) {
        xml += `${indent}    <ap:TextStyle>\n`
        if (topic.style.fontFamily) {
          xml += `${indent}      <ap:Font>${topic.style.fontFamily}</ap:Font>\n`
        }
        if (topic.style.fontSize) {
          xml += `${indent}      <ap:Size>${topic.style.fontSize}</ap:Size>\n`
        }
        if (topic.style.color) {
          xml += `${indent}      <ap:Color>${topic.style.color}</ap:Color>\n`
        }
        if (topic.style.fontWeight === 'bold') {
          xml += `${indent}      <ap:Bold>true</ap:Bold>\n`
        }
        if (topic.style.fontStyle === 'italic') {
          xml += `${indent}      <ap:Italic>true</ap:Italic>\n`
        }
        xml += `${indent}    </ap:TextStyle>\n`
      }

      // 填充样式
      if (topic.style.backgroundColor) {
        xml += `${indent}    <ap:FillStyle>\n`
        xml += `${indent}      <ap:FillColor>${topic.style.backgroundColor}</ap:FillColor>\n`
        xml += `${indent}    </ap:FillStyle>\n`
      }

      // 边框样式
      if (topic.style.borderColor || topic.style.borderWidth) {
        xml += `${indent}    <ap:LineStyle>\n`
        if (topic.style.borderColor) {
          xml += `${indent}      <ap:LineColor>${topic.style.borderColor}</ap:LineColor>\n`
        }
        if (topic.style.borderWidth) {
          xml += `${indent}      <ap:LineWidth>${topic.style.borderWidth}</ap:LineWidth>\n`
        }
        xml += `${indent}    </ap:LineStyle>\n`
      }

      xml += `${indent}  </ap:StyleProperties>\n`
    }

    // 添加备注
    if (topic.note) {
      xml += `${indent}  <ap:Note>\n`
      xml += `${indent}    <ap:PlainText>${topic.note}</ap:PlainText>\n`
      xml += `${indent}  </ap:Note>\n`
    }

    // 添加超链接
    if (topic.hyperlink) {
      xml += `${indent}  <ap:Hyperlink>\n`
      xml += `${indent}    <ap:Url>${topic.hyperlink}</ap:Url>\n`
      xml += `${indent}  </ap:Hyperlink>\n`
    }

    // 添加子主题
    if (topic.children && topic.children.length > 0) {
      xml += `${indent}  <ap:SubTopics>\n`
      topic.children.forEach(child => {
        xml += this.topicToXML(child, level + 2)
      })
      xml += `${indent}  </ap:SubTopics>\n`
    }

    xml += `${indent}</ap:Topic>\n`
    return xml
  }

  // 导出为MindManager格式
  async mindmanager() {
    const data = this.mindMap.getData()
    const xml = this.generateMindManagerXML(data)
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const res = await readBlob(blob)
    return res
  }
}

ExportMindManager.instanceName = 'doExportMindManager'

export default ExportMindManager