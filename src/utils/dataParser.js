// =====================================================
// 数据解析工具 - 5G-V2X车联网可视化系统
// 使用SheetJS解析本地.xls/.xlsx仿真数据文件
// =====================================================

import * as XLSX from 'xlsx'

/**
 * 解析仿真数据文件
 * @param {File} file - 上传的文件对象
 * @returns {Promise<Array>} 解析后的数据数组
 */
export const parseSimulationFile = (file) => {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const extension = file.name.split('.').pop().toLowerCase()
    
    if (!validTypes.includes(file.type) && !['xls', 'xlsx'].includes(extension)) {
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
        
        // 字段映射（支持中英文表头）
        const mappedData = jsonData.map(row => mapFields(row))
        
        // 验证并过滤有效数据
        const validData = mappedData.filter(item => validateDataItem(item))
        
        if (validData.length === 0) {
          reject(new Error('文件中没有有效的仿真数据'))
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
    
    // 读取文件为ArrayBuffer
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 字段映射（支持多种表头格式）
 * @param {Object} row - 原始行数据
 * @returns {Object} 映射后的数据对象
 */
const mapFields = (row) => {
  // 字段映射表
  const fieldMapping = {
    // 车速
    '车速': 'vehicleSpeed',
    '车速(km/h)': 'vehicleSpeed',
    'vehicleSpeed': 'vehicleSpeed',
    'speed': 'vehicleSpeed',
    'Speed_kmh': 'vehicleSpeed',
    'Speed': 'vehicleSpeed',

    // 车辆密度
    '车辆密度': 'vehicleDensity',
    '车辆密度(veh/km)': 'vehicleDensity',
    'vehicleDensity': 'vehicleDensity',
    'density': 'vehicleDensity',
    'Density_veh_per_km': 'vehicleDensity',
    'Density': 'vehicleDensity',

    // 50米消息接收成功率
    '50米消息接收成功率': 'msgSuccessRate50m',
    '50米消息接收成功率(%)': 'msgSuccessRate50m',
    'msgSuccessRate50m': 'msgSuccessRate50m',
    'PRR_50m': 'msgSuccessRate50m',

    // 150米消息接收成功率
    '150米消息接收成功率': 'msgSuccessRate150m',
    '150米消息接收成功率(%)': 'msgSuccessRate150m',
    'msgSuccessRate150m': 'msgSuccessRate150m',
    'PRR_150m': 'msgSuccessRate150m',

    // 150米丢包率
    '150米丢包率': 'packetLossRate150m',
    '150米丢包率(%)': 'packetLossRate150m',
    'packetLossRate150m': 'packetLossRate150m',
    'PacketLoss_150m': 'packetLossRate150m',

    // 相邻车辆数
    '相邻车辆数': 'adjacentVehicles',
    '相邻车辆数(辆)': 'adjacentVehicles',
    'adjacentVehicles': 'adjacentVehicles',
    'Avg_Neighbors': 'adjacentVehicles',

    // 信道忙碌率
    '信道忙碌率': 'channelBusyRate',
    '信道忙碌率(%)': 'channelBusyRate',
    'channelBusyRate': 'channelBusyRate',
    'Avg_CBR': 'channelBusyRate',

    // 平均消息时延
    '平均消息时延': 'avgMsgDelay',
    '平均消息时延(ms)': 'avgMsgDelay',
    'avgMsgDelay': 'avgMsgDelay',
    'Avg_Delay_s': 'avgMsgDelay',

    // 吞吐量
    '吞吐量': 'throughput',
    '吞吐量(Mbps)': 'throughput',
    'throughput': 'throughput',
    'Throughput_kbps': 'throughput',

    // 无线盲区指标
    '无线盲区指标': 'wirelessBlindSpot',
    'wirelessBlindSpot': 'wirelessBlindSpot',
    'Blind_Spot_Metric': 'wirelessBlindSpot',

    // 避让成功率
    '避让成功率': 'avoidanceSuccessRate',
    '避让成功率(%)': 'avoidanceSuccessRate',
    'avoidanceSuccessRate': 'avoidanceSuccessRate',
    'Avoidance_Success_Prob': 'avoidanceSuccessRate',

    // 提前预警时间
    '提前预警时间': 'advanceWarningTime',
    '提前预警时间(s)': 'advanceWarningTime',
    'advanceWarningTime': 'advanceWarningTime',
    'Warning_Time_s': 'advanceWarningTime'
  }
  
  const mappedItem = {}
  // 记录原始字段名，用于判断单位
  const originalKeys = {}

  // 遍历原始字段进行映射
  Object.keys(row).forEach(key => {
    const trimmedKey = key.trim()
    const mappedKey = fieldMapping[trimmedKey]
    
    if (mappedKey) {
      // 转换数值类型
      const value = row[key]
      if (value !== undefined && value !== '') {
        mappedItem[mappedKey] = parseFloat(value) || 0
        originalKeys[mappedKey] = trimmedKey
      }
    }
  })

  // =====================================================
  // 单位自动检测与换算
  // 规则：如果原始字段名含 _kmh/_veh/_kbps/_s 等后缀，
  //       或值范围明显是小数（≤1），则自动换算为系统使用的单位
  // =====================================================

  // 1. 成功率/丢包率/信道忙碌率/避让成功率：小数→百分比 (×100)
  const rateFields = ['msgSuccessRate50m', 'msgSuccessRate150m', 'packetLossRate150m', 'channelBusyRate', 'avoidanceSuccessRate']
  rateFields.forEach(field => {
    if (mappedItem[field] !== undefined && mappedItem[field] <= 1.0) {
      mappedItem[field] = parseFloat((mappedItem[field] * 100).toFixed(4))
    }
  })

  // 2. 无线盲区指标：如果是极小值（≤0.1）也×100换成百分比
  if (mappedItem['wirelessBlindSpot'] !== undefined && mappedItem['wirelessBlindSpot'] <= 0.1) {
    mappedItem['wirelessBlindSpot'] = parseFloat((mappedItem['wirelessBlindSpot'] * 100).toFixed(4))
  }

  // 3. 平均消息时延：原始字段名含 _s 或值 < 1（秒），换算为毫秒 (×1000)
  if (mappedItem['avgMsgDelay'] !== undefined) {
    const origKey = originalKeys['avgMsgDelay'] || ''
    if (origKey.includes('_s') || (mappedItem['avgMsgDelay'] < 1 && !origKey.includes('ms'))) {
      mappedItem['avgMsgDelay'] = parseFloat((mappedItem['avgMsgDelay'] * 1000).toFixed(2))
    }
  }

  // 4. 吞吐量：原始字段名含 _kbps，换算为 Mbps (÷1000)
  if (mappedItem['throughput'] !== undefined) {
    const origKey = originalKeys['throughput'] || ''
    if (origKey.toLowerCase().includes('kbps')) {
      mappedItem['throughput'] = parseFloat((mappedItem['throughput'] / 1000).toFixed(4))
    }
  }

  return mappedItem
}

/**
 * 验证单个数据项
 * @param {Object} item - 数据项
 * @returns {boolean} 是否有效
 */
const validateDataItem = (item) => {
  const requiredFields = [
    'vehicleSpeed',
    'vehicleDensity',
    'msgSuccessRate50m',
    'msgSuccessRate150m',
    'packetLossRate150m',
    'adjacentVehicles',
    'channelBusyRate',
    'avgMsgDelay',
    'throughput',
    'wirelessBlindSpot',
    'avoidanceSuccessRate',
    'advanceWarningTime'
  ]
  
  return requiredFields.every(field => {
    const value = item[field]
    return value !== undefined && value !== null && !isNaN(value)
  })
}

/**
 * 导出数据为Excel文件
 * @param {Array} data - 要导出的数据
 * @param {string} filename - 文件名
 */
export const exportToExcel = (data, filename = 'simulation_data.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, filename)
}
