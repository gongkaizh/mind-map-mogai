import { readBlob } from '../utils/index'

// 导出FreeMind插件，需要通过Export插件使用
class ExportFreeMind {
  // 构造函数
  constructor(opt) {
    this.mindMap = opt.mindMap
  }

  // 转换节点数据为FreeMind格式
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

    const data = {
      TEXT: escapeXml(node.data.text || ''),
      ID: node.data.id || `ID_${Math.random().toString(36).substring(2, 11)}`
    }

    // 根节点不需要POSITION属性，子节点需要
    if (!isRoot) {
      data.POSITION = node.data.side === 'left' ? 'left' : 'right'
    }

    // 添加颜色信息
    if (node.data.color) {
      data.COLOR = node.data.color
    }

    // 添加背景色（通过BACKGROUND_COLOR属性）
    if (node.data.backgroundColor) {
      data.BACKGROUND_COLOR = node.data.backgroundColor
    }

    // 添加字体信息
    const fontInfo = {}
    if (node.data.fontSize) {
      fontInfo.SIZE = node.data.fontSize
    }
    if (node.data.fontFamily) {
      fontInfo.NAME = node.data.fontFamily
    }
    if (node.data.fontWeight === 'bold') {
      fontInfo.BOLD = 'true'
    }
    if (node.data.fontStyle === 'italic') {
      fontInfo.ITALIC = 'true'
    }
    if (Object.keys(fontInfo).length > 0) {
      data.font = fontInfo
    }

    // 添加边框信息
    if (node.data.borderColor || node.data.borderWidth) {
      data.edge = {
        COLOR: node.data.borderColor || '#808080',
        WIDTH: node.data.borderWidth || '1'
      }
    }

    // 添加超链接
    if (node.data.hyperlink) {
      data.LINK = node.data.hyperlink
    }

    // 添加备注
    if (node.data.note) {
      data.richcontent = {
        TYPE: 'NOTE',
        content: escapeXml(node.data.note)
      }
    }

    // 添加子节点
    if (node.children && node.children.length > 0) {
      data.children = node.children.map(child => this.transformNodeData(child, false))
    }

    return data
  }

  // 生成FreeMind XML格式
  generateFreeMindXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<map version="1.0.1">\n'
    xml += '<!-- To view this file, download free mind mapping software FreeMind from http://freemind.sourceforge.net -->\n'

    // 转换根节点
    const rootNode = this.transformNodeData(data, true)
    xml += this.nodeToXML(rootNode, 1)

    xml += '</map>\n'
    return xml
  }

  // 将节点数据转换为XML字符串
  nodeToXML(node, level) {
    const indent = '  '.repeat(level)
    let xml = `${indent}<node`

    // 添加基本属性
    if (node.TEXT) xml += ` TEXT="${node.TEXT}"`
    if (node.ID) xml += ` ID="${node.ID}"`
    if (node.POSITION) xml += ` POSITION="${node.POSITION}"`
    if (node.COLOR) xml += ` COLOR="${node.COLOR}"`
    if (node.BACKGROUND_COLOR) xml += ` BACKGROUND_COLOR="${node.BACKGROUND_COLOR}"`
    if (node.LINK) xml += ` LINK="${node.LINK}"`

    // 检查是否有子元素
    const hasChildren = (node.children && node.children.length > 0) ||
                       node.font || node.edge || node.richcontent

    if (hasChildren) {
      xml += '>\n'

      // 添加字体信息
      if (node.font) {
        xml += `${indent}  <font`
        if (node.font.NAME) xml += ` NAME="${node.font.NAME}"`
        if (node.font.SIZE) xml += ` SIZE="${node.font.SIZE}"`
        if (node.font.BOLD) xml += ` BOLD="${node.font.BOLD}"`
        if (node.font.ITALIC) xml += ` ITALIC="${node.font.ITALIC}"`
        xml += '/>\n'
      }

      // 添加边框信息
      if (node.edge) {
        xml += `${indent}  <edge`
        if (node.edge.COLOR) xml += ` COLOR="${node.edge.COLOR}"`
        if (node.edge.WIDTH) xml += ` WIDTH="${node.edge.WIDTH}"`
        xml += '/>\n'
      }

      // 添加备注信息
      if (node.richcontent) {
        xml += `${indent}  <richcontent TYPE="${node.richcontent.TYPE}">\n`
        xml += `${indent}    <html>\n`
        xml += `${indent}      <head></head>\n`
        xml += `${indent}      <body>\n`
        xml += `${indent}        <p>${node.richcontent.content}</p>\n`
        xml += `${indent}      </body>\n`
        xml += `${indent}    </html>\n`
        xml += `${indent}  </richcontent>\n`
      }

      // 添加子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          xml += this.nodeToXML(child, level + 1)
        })
      }

      xml += `${indent}</node>\n`
    } else {
      xml += '/>\n'
    }

    return xml
  }

  // 导出为FreeMind格式
  async freemind() {
    const data = this.mindMap.getData()
    const xml = this.generateFreeMindXML(data)
    // 添加UTF-8 BOM并创建Blob
    const bom = '\uFEFF'
    const blob = new Blob([bom + xml], { type: 'application/xml;charset=utf-8' })
    const res = await readBlob(blob)
    return res
  }
}

ExportFreeMind.instanceName = 'doExportFreeMind'

export default ExportFreeMind