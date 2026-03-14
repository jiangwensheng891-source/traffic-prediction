// =====================================================
// 默认仿真数据集 - 5G-V2X车联网可视化系统
// 66组仿真数据：6档车辆密度 × 11档车速
// 数据字段：车速、车辆密度、通信性能指标、安全性能指标
// =====================================================

/**
 * 生成默认仿真数据
 * 66组数据对应：6档密度(50,100,150,200,250,300) × 11档车速(20-120,步长10)
 */
const generateDefaultData = () => {
  const data = []
  const densities = [50, 100, 150, 200, 250, 300]
  const speeds = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
  
  densities.forEach(density => {
    speeds.forEach(speed => {
      // 基于车速和密度计算各项指标（模拟真实数据趋势）
      const baseFactor = speed / 100 + density / 200
      
      // 50米消息接收成功率 - 距离近，成功率高
      const msgSuccessRate50m = Math.min(99.5, 85 + (120 - speed) * 0.1 - density * 0.05 + Math.random() * 2).toFixed(2)
      
      // 150米消息接收成功率 - 距离远，成功率较低
      const msgSuccessRate150m = Math.min(95, 70 + (120 - speed) * 0.15 - density * 0.08 + Math.random() * 3).toFixed(2)
      
      // 150米丢包率
      const packetLossRate150m = Math.max(0.5, (100 - parseFloat(msgSuccessRate150m)) * 0.8 + Math.random() * 2).toFixed(2)
      
      // 相邻车辆数
      const adjacentVehicles = Math.floor(density * 0.15 + Math.random() * 3)
      
      // 信道忙碌率 - 速度和密度越高，信道越忙
      const channelBusyRate = Math.min(85, 20 + baseFactor * 15 + Math.random() * 5).toFixed(2)
      
      // 平均消息时延(ms) - 密度越高，时延越大
      const avgMsgDelay = Math.max(5, 10 + density * 0.1 + speed * 0.05 + Math.random() * 3).toFixed(2)
      
      // 吞吐量(Mbps) - 速度越高，吞吐量越大
      const throughput = Math.max(1, 5 + speed * 0.3 - density * 0.02 + Math.random() * 2).toFixed(2)
      
      // 无线盲区指标
      const wirelessBlindSpot = Math.max(0, 15 + density * 0.1 - speed * 0.05 + Math.random() * 3).toFixed(2)
      
      // 避让成功率 - 核心安全指标，速度和密度越高，成功率越低
      const avoidanceSuccessRate = Math.max(40, 95 - speed * 0.2 - density * 0.08 + Math.random() * 5).toFixed(2)
      
      // 提前预警时间(s) - 速度越高，预警时间越重要
      const advanceWarningTime = Math.max(1, 5 + (120 - speed) * 0.05 - density * 0.01 + Math.random() * 0.5).toFixed(2)
      
      data.push({
        vehicleSpeed: speed,
        vehicleDensity: density,
        msgSuccessRate50m: parseFloat(msgSuccessRate50m),
        msgSuccessRate150m: parseFloat(msgSuccessRate150m),
        packetLossRate150m: parseFloat(packetLossRate150m),
        adjacentVehicles: adjacentVehicles,
        channelBusyRate: parseFloat(channelBusyRate),
        avgMsgDelay: parseFloat(avgMsgDelay),
        throughput: parseFloat(throughput),
        wirelessBlindSpot: parseFloat(wirelessBlindSpot),
        avoidanceSuccessRate: parseFloat(avoidanceSuccessRate),
        advanceWarningTime: parseFloat(advanceWarningTime)
      })
    })
  })
  
  return data
}

// 导出默认仿真数据
export const defaultSimulationData = generateDefaultData()

// 预设的危险场景数据（用于演示预警功能）
export const dangerScenarioData = {
  vehicleSpeed: 110,
  vehicleDensity: 280,
  msgSuccessRate50m: 78.5,
  msgSuccessRate150m: 62.3,
  packetLossRate150m: 35.2,
  adjacentVehicles: 45,
  channelBusyRate: 72.8,
  avgMsgDelay: 42.5,
  throughput: 28.6,
  wirelessBlindSpot: 38.5,
  avoidanceSuccessRate: 42.3, // 低于阈值触发预警
  advanceWarningTime: 2.1
}
