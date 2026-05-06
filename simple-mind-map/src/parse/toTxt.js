import { walk, nodeRichTextToTextWithWrap } from '../utils'

const getNodeText = data => {
  return data.richText ? nodeRichTextToTextWithWrap(data.text) : data.text
}

const getIndent = level => {
  return new Array(level).fill('\t').join('')
}

// 转换成txt格式
export const transformToTxt = root => {
  let content = ''
  let isFirst = true
  walk(
    root,
    null,
    (node, parent, isRoot, layerIndex) => {
      if (!isFirst) {
        content += '\n'
      }
      isFirst = false
      content += getIndent(layerIndex)
      content += getNodeText(node.data)
      // 概要
      const generalization = node.data.generalization
      if (Array.isArray(generalization)) {
        content += generalization.map(item => {
          return ` [${getNodeText(item)}]`
        })
      } else if (generalization && generalization.text) {
        content += ` [${getNodeText(generalization)}]`
      }
    },
    () => {},
    true
  )
  return content
}
