// 测试jszip是否正确安装
try {
  const JSZip = require('jszip')
  console.log('JSZip 安装成功:', typeof JSZip)
  
  // 测试其他依赖
  const jsPDF = require('jspdf')
  console.log('jsPDF 安装成功:', typeof jsPDF)
  
  const html2canvas = require('html2canvas')
  console.log('html2canvas 安装成功:', typeof html2canvas)
  
  const pdfLib = require('pdf-lib')
  console.log('pdf-lib 安装成功:', typeof pdfLib)
  
  console.log('所有依赖都已正确安装!')
} catch (error) {
  console.error('依赖安装检查失败:', error.message)
}
