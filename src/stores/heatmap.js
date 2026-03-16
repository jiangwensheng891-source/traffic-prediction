// =====================================================
// Pinia Store - 城市交通风险热力图状态管理
// =====================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { defaultRoadSegments, timeSlotConfig } from '@/data/heatmapData.js'

export const useHeatmapStore = defineStore('heatmap', () => {
  // =====================================================
  // 状态
  // =====================================================

  // 路段数据
  const roadSegments = ref([])

  // 风险阈值
  const riskThresholds = ref({
    low: 0.3,
    medium: 0.6,
    high: 0.8
  })

  // 当前选中的阈值级别
  const currentThresholdLevel = ref('medium')

  // 时间段过滤
  const selectedTimeSlot = ref('all') // all, morning, noon, evening, night

  // 当前实际时间（用于实时数据）
  const currentTime = ref(new Date())

  // 数据更新时间
  const dataUpdateTime = ref(new Date())

  // 车密度过滤
  const densityFilter = ref({
    min: 0,
    max: 200
  })

  // 选中的路段
  const selectedSegment = ref(null)

  // 加载状态
  const isLoading = ref(false)
  
  // =====================================================
  // 计算属性
  // =====================================================
  
  // 当前阈值数值
  const currentThreshold = computed(() => {
    return riskThresholds.value[currentThresholdLevel.value] || riskThresholds.value.medium
  })
  
  // 过滤后的路段数据
  const filteredSegments = computed(() => {
    return roadSegments.value.map(segment => {
      // 根据选择的时段返回对应的风险值
      let displayRisk = segment.risk

      // 如果选择了特定时段，使用该时段的风险值
      if (selectedTimeSlot.value !== 'all' && segment.timeSlots) {
        displayRisk = segment.timeSlots[selectedTimeSlot.value] || segment.risk
      }

      return {
        ...segment,
        displayRisk
      }
    }).filter(segment => {
      // 车密度过滤
      if (segment.density < densityFilter.value.min || segment.density > densityFilter.value.max) {
        return false
      }

      return true
    })
  })
  
  // 高风险路段（Top 10）
  const topRiskSegments = computed(() => {
    const segments = selectedTimeSlot.value === 'all'
      ? roadSegments.value
      : filteredSegments.value
    return [...segments]
      .sort((a, b) => {
        const riskA = a.displayRisk || a.risk
        const riskB = b.displayRisk || b.risk
        return riskB - riskA
      })
      .slice(0, 10)
  })

  // 风险分布统计（根据当前时段）
  const riskDistribution = computed(() => {
    const distribution = {
      low: 0,      // 0-0.3
      medium: 0,   // 0.3-0.6
      high: 0,     // 0.6-0.8
      critical: 0  // 0.8-1.0
    }

    const segments = filteredSegments.value

    segments.forEach(segment => {
      const risk = segment.displayRisk || segment.risk
      if (risk < 0.3) distribution.low++
      else if (risk < 0.6) distribution.medium++
      else if (risk < 0.8) distribution.high++
      else distribution.critical++
    })

    return distribution
  })

  // 时段风险统计
  const timeSlotStats = computed(() => {
    const stats = {}
    const slots = ['morning', 'noon', 'evening', 'night']

    slots.forEach(slot => {
      const slotRisks = roadSegments.value
        .filter(s => s.timeSlots && s.timeSlots[slot] !== undefined)
        .map(s => s.timeSlots[slot])

      if (slotRisks.length > 0) {
        const avg = slotRisks.reduce((a, b) => a + b, 0) / slotRisks.length
        stats[slot] = {
          avgRisk: avg,
          count: slotRisks.length,
          config: timeSlotConfig[slot]
        }
      }
    })

    return stats
  })

  // 当天平均风险
  const dailyAvgRisk = computed(() => {
    const segments = roadSegments.value
    if (segments.length === 0) return 0

    // 计算所有时段的总风险
    const slots = ['morning', 'noon', 'evening', 'night']
    let totalRisk = 0
    let count = 0

    segments.forEach(segment => {
      slots.forEach(slot => {
        if (segment.timeSlots && segment.timeSlots[slot]) {
          totalRisk += segment.timeSlots[slot]
          count++
        }
      })
    })

    return count > 0 ? totalRisk / count : 0
  })
  
  // =====================================================
  // 方法
  // =====================================================
  
  /**
   * 加载默认数据
   */
  const loadDefaultData = () => {
    roadSegments.value = defaultRoadSegments
  }
  
  /**
   * 设置路段数据
   */
  const setRoadSegments = (segments) => {
    roadSegments.value = segments
  }
  
  /**
   * 更新风险阈值
   */
  const updateThreshold = (level, value) => {
    if (riskThresholds.value.hasOwnProperty(level)) {
      riskThresholds.value[level] = value
    }
  }
  
  /**
   * 设置当前阈值级别
   */
  const setThresholdLevel = (level) => {
    currentThresholdLevel.value = level
  }
  
  /**
   * 设置时间段
   */
  const setTimeSlot = (slot) => {
    selectedTimeSlot.value = slot
  }
  
  /**
   * 设置密度过滤
   */
  const setDensityFilter = (min, max) => {
    densityFilter.value = { min, max }
  }
  
  /**
   * 选择路段
   */
  const selectSegment = (segment) => {
    selectedSegment.value = segment
  }
  
  /**
   * 重置所有状态
   */
  const reset = () => {
    riskThresholds.value = {
      low: 0.3,
      medium: 0.6,
      high: 0.8
    }
    currentThresholdLevel.value = 'medium'
    selectedTimeSlot.value = 'all'
    densityFilter.value = { min: 0, max: 200 }
    selectedSegment.value = null
    loadDefaultData()
  }
  
  /**
   * 根据风险值获取颜色（增强渐变版）
   */
  const getRiskColor = (risk) => {
    // 使用更鲜艳的渐变颜色
    if (risk < 0.15) return '#00d4ff'      // 青色 - 极低风险
    if (risk < 0.25) return '#2ed573'      // 绿色 - 低风险
    if (risk < 0.4) return '#7bed9f'       // 浅绿 - 中低风险
    if (risk < 0.5) return '#ffa502'       // 黄色 - 中风险
    if (risk < 0.65) return '#ff9f43'      // 浅橙 - 中高风险
    if (risk < 0.75) return '#ff7f50'      // 橙色 - 高风险
    if (risk < 0.85) return '#ff6348'      // 深橙 - 极高风险
    return '#ff4757'                        // 红色 - 危险
  }
  
  /**
   * 根据风险值获取发光颜色
   */
  const getRiskGlowColor = (risk) => {
    if (risk < 0.25) return 'rgba(0, 212, 255, 0.5)'
    if (risk < 0.5) return 'rgba(255, 165, 2, 0.5)'
    if (risk < 0.75) return 'rgba(255, 127, 80, 0.6)'
    return 'rgba(255, 71, 87, 0.7)'
  }
  
  /**
   * 根据风险值获取透明度（增强版）
   */
  const getRiskOpacity = (risk, threshold) => {
    if (risk >= threshold) {
      // 高风险路段更不透明
      return Math.min(0.6 + risk * 0.4, 1)
    }
    // 低风险路段半透明但可见
    return 0.3 + risk * 0.2
  }
  
  /**
   * 根据风险值获取线条宽度
   */
  const getRiskWeight = (risk) => {
    if (risk < 0.25) return 4
    if (risk < 0.5) return 5
    if (risk < 0.75) return 7
    return 10
  }
  
  // 更新时间
  const updateDataTime = () => {
    dataUpdateTime.value = new Date()
    currentTime.value = new Date()
  }

  // 获取当前时段
  const getCurrentTimeSlot = () => {
    const hour = currentTime.value.getHours()
    if (hour >= 7 && hour < 9) return 'morning'
    if (hour >= 11 && hour < 14) return 'noon'
    if (hour >= 17 && hour < 19) return 'evening'
    return 'night'
  }

  return {
    // 状态
    roadSegments,
    riskThresholds,
    currentThresholdLevel,
    selectedTimeSlot,
    currentTime,
    dataUpdateTime,
    densityFilter,
    selectedSegment,
    isLoading,

    // 计算属性
    currentThreshold,
    filteredSegments,
    topRiskSegments,
    riskDistribution,
    timeSlotStats,
    dailyAvgRisk,

    // 方法
    loadDefaultData,
    setRoadSegments,
    updateThreshold,
    setThresholdLevel,
    setTimeSlot,
    setDensityFilter,
    selectSegment,
    reset,
    updateDataTime,
    getCurrentTimeSlot,
    getRiskColor,
    getRiskGlowColor,
    getRiskOpacity,
    getRiskWeight
  }
})
