// =====================================================
// Pinia Store - 城市交通风险热力图状态管理
// =====================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { defaultRoadSegments } from '@/data/heatmapData.js'

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
    return roadSegments.value.filter(segment => {
      // 车密度过滤
      if (segment.density < densityFilter.value.min || segment.density > densityFilter.value.max) {
        return false
      }
      
      // 时间段过滤（模拟数据中没有时间字段，跳过）
      // 实际项目中可以根据segment.timestamp过滤
      
      return true
    })
  })
  
  // 高风险路段（Top 10）
  const topRiskSegments = computed(() => {
    return [...roadSegments.value]
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 10)
  })
  
  // 风险分布统计
  const riskDistribution = computed(() => {
    const distribution = {
      low: 0,      // 0-0.3
      medium: 0,   // 0.3-0.6
      high: 0,     // 0.6-0.8
      critical: 0  // 0.8-1.0
    }
    
    roadSegments.value.forEach(segment => {
      if (segment.risk < 0.3) distribution.low++
      else if (segment.risk < 0.6) distribution.medium++
      else if (segment.risk < 0.8) distribution.high++
      else distribution.critical++
    })
    
    return distribution
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
  
  return {
    // 状态
    roadSegments,
    riskThresholds,
    currentThresholdLevel,
    selectedTimeSlot,
    densityFilter,
    selectedSegment,
    isLoading,
    
    // 计算属性
    currentThreshold,
    filteredSegments,
    topRiskSegments,
    riskDistribution,
    
    // 方法
    loadDefaultData,
    setRoadSegments,
    updateThreshold,
    setThresholdLevel,
    setTimeSlot,
    setDensityFilter,
    selectSegment,
    reset,
    getRiskColor,
    getRiskGlowColor,
    getRiskOpacity,
    getRiskWeight
  }
})
