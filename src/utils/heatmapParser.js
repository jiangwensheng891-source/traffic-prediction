// =====================================================
// 热力图数据解析工具 - 城市交通风险热力图
// 使用SheetJS解析本地.xls/.xlsx路段数据文件
// =====================================================

import * as XLSX from 'xlsx'

/**
 * 解析热力图数据文件
 * @param {File} file - 上传的文件对象
 * @returns {Promise<Array<RoadSegment>>} 解析后的路段数据数组
 */
export const parseHeatmapFile = (file) => {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    const extension = file.name.split('.').pop().toLowerCase()
    if (!['xls', 'xlsx'].includes(extension)) {
      reject(new Error('仅支持.xls和.xlsx格式的文件'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const data = event.target.result
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // 转换为JSON格式
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false })
        
        // 字段映射
        const mappedData = jsonData.map(row => mapFields(row))
        
        // 验证并过滤有效数据
        const validData = mappedData.filter(item => validateSegment(item))
        
        if (validData.length === 0) {
          reject(new Error('文件中没有有效的路段数据'))
          return
        }
        
        resolve(validData)
      } catch (error) {
        reject(new Error('文件解析失败：' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 字段映射
 */
const mapFields = (row) => {
  const segment = {}
  
  // ID
  segment.id = row['id'] || row['ID'] || row['路段ID'] || row['编号'] || `road_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 名称
  segment.name = row['name'] || row['Name'] || row['路段名称'] || row['名称'] || '未命名路段'
  
  // 几何坐标（JSON格式）
  try {
    if (row['geometry'] || row['Geometry'] || row['坐标'] || row['几何']) {
      const geomStr = row['geometry'] || row['Geometry'] || row['坐标'] || row['几何']
      segment.geometry = typeof geomStr === 'string' ? JSON.parse(geomStr) : geomStr
    } else {
      // 如果没有geometry字段，尝试从lng/lat字段构建
      if (row['lng'] && row['lat']) {
        segment.geometry = [[parseFloat(row['lng']), parseFloat(row['lat'])]]
      } else {
        segment.geometry = [[116.39, 39.90]] // 默认坐标
      }
    }
  } catch (e) {
    segment.geometry = [[116.39, 39.90]]
  }
  
  // 车速
  segment.speed = parseFloat(row['speed'] || row['Speed'] || row['车速'] || row['平均车速'] || 40)
  
  // 车流密度
  segment.density = parseFloat(row['density'] || row['Density'] || row['车流密度'] || row['密度'] || 100)
  
  // 风险指数
  let risk = parseFloat(row['risk'] || row['Risk'] || row['风险指数'] || row['风险'] || 0.5)
  // 确保risk在0-1范围内
  if (risk > 1) risk = risk / 100
  segment.risk = Math.max(0, Math.min(1, risk))
  
  return segment
}

/**
 * 验证路段数据
 */
const validateSegment = (segment) => {
  if (!segment.id) return false
  if (!Array.isArray(segment.geometry) || segment.geometry.length === 0) return false
  if (isNaN(segment.speed) || segment.speed < 0) return false
  if (isNaN(segment.density) || segment.density < 0) return false
  if (isNaN(segment.risk) || segment.risk < 0 || segment.risk > 1) return false
  
  return true
}
