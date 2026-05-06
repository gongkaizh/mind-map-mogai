import { readBlob } from '../utils/index'

// 导出EdrawMind插件，需要通过Export插件使用
class ExportEdrawMind {
  // 构造函数
  constructor(opt) {
    this.mindMap = opt.mindMap
  }

  // 转换节点数据为EdrawMind格式
  transformNodeData(node, parentId = null) {
    const id = node.data.id || 'node_' + Math.random().toString(36).substring(2, 11)

    const nodeData = {
      id: id,
      parentId: parentId,
      text: node.data.text || '',
      note: node.data.note || '',
      hyperlink: node.data.hyperlink || '',
      attachment: node.data.attachment || '',
      callout: node.data.callout || '',
      summary: node.data.summary || '',

      // 样式信息
      style: {
        // 文本样式
        fontFamily: node.data.fontFamily || 'Arial',
        fontSize: node.data.fontSize || 14,
        fontWeight: node.data.fontWeight || 'normal',
        fontStyle: node.data.fontStyle || 'normal',
        textDecoration: node.data.textDecoration || 'none',
        color: node.data.color || '#333333',

        // 背景样式
        backgroundColor: node.data.backgroundColor || '#ffffff',
        backgroundImage: node.data.backgroundImage || '',

        // 边框样式
        borderStyle: node.data.borderStyle || 'solid',
        borderWidth: node.data.borderWidth || 1,
        borderColor: node.data.borderColor || '#cccccc',
        borderRadius: node.data.borderRadius || 0,

        // 形状
        shape: node.data.shape || 'rectangle',

        // 其他样式
        padding: node.data.padding || 8,
        margin: node.data.margin || 0,
        opacity: node.data.opacity || 1
      },

      // 位置信息
      position: {
        x: node.data.x || 0,
        y: node.data.y || 0
      },

      // 尺寸信息
      size: {
        width: node.data.width || 'auto',
        height: node.data.height || 'auto'
      },

      // 展开状态
      expanded: node.data.expand !== false,

      // 图标
      icons: node.data.icon ? [node.data.icon] : [],

      // 标签
      tags: node.data.tag ? [node.data.tag] : [],

      // 优先级
      priority: node.data.priority || 0,

      // 进度
      progress: node.data.progress || 0,

      // 子节点
      children: []
    }

    // 添加子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        nodeData.children.push(this.transformNodeData(child, id))
      })
    }

    return nodeData
  }

  // 生成EdrawMind JSON格式
  generateEdrawMindJSON(data) {
    const rootNode = this.transformNodeData(data, null)

    const edrawMindData = {
      // 文件信息
      fileInfo: {
        version: '9.0',
        creator: 'SimpleMindMap',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        title: rootNode.text || '思维导图'
      },

      // 文档设置
      documentSettings: {
        // 页面设置
        pageSettings: {
          width: 210,
          height: 297,
          orientation: 'landscape',
          margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },

        // 主题设置
        theme: {
          name: 'default',
          backgroundColor: this.mindMap.themeConfig?.backgroundColor || '#ffffff',
          backgroundImage: '',

          // 连接线样式
          connectionLine: {
            style: 'curved',
            color: this.mindMap.themeConfig?.lineColor || '#999999',
            width: this.mindMap.themeConfig?.lineWidth || 2
          },

          // 默认节点样式
          defaultNodeStyle: {
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#333333',
            backgroundColor: '#ffffff',
            borderColor: '#cccccc',
            borderWidth: 1,
            borderRadius: 4,
            shape: 'rectangle'
          }
        },

        // 布局设置
        layout: {
          type: data.layout || 'mindMap',
          direction: 'right',
          spacing: {
            horizontal: 50,
            vertical: 30
          }
        }
      },

      // 根节点
      rootTopic: rootNode,

      // 关系线（如果有）
      relationships: [],

      // 浮动主题（如果有）
      floatingTopics: [],

      // 边界（如果有）
      boundaries: [],

      // 摘要（如果有）
      summaries: []
    }

    return edrawMindData
  }

  // 导出为EdrawMind格式
  async edrawmind() {
    const data = this.mindMap.getData()

    // 使用简化的XML格式，更兼容
    const xml = this.generateEdrawMindXML(data)

    // 创建XML文件的Blob对象
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const res = await readBlob(blob)
    return res
  }

  // 生成EdrawMind兼容的XML格式
  generateEdrawMindXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<map version="1.0">\n'

    // 转换根节点
    xml += this.nodeToEdrawXML(data, 1)

    xml += '</map>\n'
    return xml
  }

  // 将节点转换为EdrawMind XML
  nodeToEdrawXML(node, level) {
    const indent = '  '.repeat(level)
    const text = this.escapeXml(node.data.text || '')

    let xml = `${indent}<node TEXT="${text}"`

    // 添加基本属性
    if (node.data.id) xml += ` ID="${node.data.id}"`
    if (node.data.side) xml += ` POSITION="${node.data.side}"`

    // 检查是否有子节点
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
      xml += '>\n'
      node.children.forEach(child => {
        xml += this.nodeToEdrawXML(child, level + 1)
      })
      xml += `${indent}</node>\n`
    } else {
      xml += '/>\n'
    }

    return xml
  }

  // XML字符转义
  escapeXml(text) {
    if (!text) return ''
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }


}

ExportEdrawMind.instanceName = 'doExportEdrawMind'

export default ExportEdrawMind