<!-- =====================================================
     统计面板组件 - 城市交通风险热力图
     功能：风险分布柱状图 + Top-10高风险路段表
     ===================================================== -->

<template>
  <div class="stats-panel-container">
    <!-- 当前阈值指示 -->
    <el-card class="stats-card threshold-card">
      <template #header>
        <div class="card-header">
          <el-icon><Aim /></el-icon>
          <span>当前阈值</span>
        </div>
      </template>
      <div class="threshold-indicator">
        <div class="threshold-level">
          <span class="level-label">风险阈值级别:</span>
          <el-tag :type="getThresholdTagType(store.currentThresholdLevel)">
            {{ thresholdLabels[store.currentThresholdLevel] }}
          </el-tag>
        </div>
        <div class="threshold-value">
          <span class="value-label">阈值数值:</span>
          <span class="value-number">{{ (store.currentThreshold * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </el-card>

    <!-- 风险分布柱状图 -->
    <el-card class="stats-card chart-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>风险分布统计</span>
        </div>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <!-- Top-10 高风险路段 -->
    <el-card class="stats-card table-card">
      <template #header>
        <div class="card-header">
          <el-icon><Warning /></el-icon>
          <span>Top 10 高风险路段</span>
        </div>
      </template>
      <el-table
        :data="store.topRiskSegments"
        style="width: 100%"
        size="small"
        max-height="300"
        class="risk-table"
      >
        <el-table-column prop="name" label="路段名称" min-width="100">
          <template #default="{ row }">
            <span class="road-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="risk" label="风险指数" width="100" align="center">
          <template #default="{ row }">
            <span class="risk-value" :style="{ color: store.getRiskColor(row.risk) }">
              {{ (row.risk * 100).toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 时段风险变化图表 -->
    <el-card class="stats-card timeslot-chart-card">
      <template #header>
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>时段风险变化</span>
        </div>
      </template>
      <div ref="timeSlotChartRef" class="chart-container"></div>
      <div class="daily-avg">
        <span class="avg-label">当天平均风险:</span>
        <span class="avg-value" :style="{ color: store.getRiskColor(store.dailyAvgRisk) }">
          {{ (store.dailyAvgRisk * 100).toFixed(1) }}%
        </span>
      </div>
    </el-card>

    <!-- 风险趋势预测 -->
    <el-card class="stats-card prediction-card">
      <template #header>
        <div class="card-header">
          <el-icon><Odometer /></el-icon>
          <span>风险趋势预测 (30分钟-1小时)</span>
        </div>
      </template>
      <div ref="predictionChartRef" class="chart-container"></div>
      <div class="prediction-summary">
        <div class="prediction-item">
          <span class="pred-label">30分钟预测:</span>
          <span class="pred-value" :style="{ color: getPredictionColor(prediction30min) }">
            {{ (prediction30min * 100).toFixed(1) }}%
          </span>
        </div>
        <div class="prediction-item">
          <span class="pred-label">1小时预测:</span>
          <span class="pred-value" :style="{ color: getPredictionColor(prediction1hour) }">
            {{ (prediction1hour * 100).toFixed(1) }}%
          </span>
        </div>
        <div class="prediction-item trend">
          <span class="pred-label">趋势:</span>
          <span class="pred-trend" :class="trendDirection">
            {{ trendText }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 统计说明 -->
    <el-card class="stats-card info-card">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>统计说明</span>
        </div>
      </template>
      <div class="info-content">
        <p><strong>总路段数:</strong> {{ store.roadSegments.length }} 条</p>
        <p><strong>显示路段:</strong> {{ store.filteredSegments.length }} 条</p>
        <p><strong>高风险路段:</strong> {{ store.riskDistribution.high + store.riskDistribution.critical }} 条</p>
        <p class="update-time">数据更新: {{ formatUpdateTime(store.dataUpdateTime) }}</p>
        <p class="hint">点击路段或表格查看详情</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useHeatmapStore } from '@/stores/heatmap'

const store = useHeatmapStore()

const chartRef = ref(null)
const timeSlotChartRef = ref(null)
const predictionChartRef = ref(null)
const chartInstance = ref(null)
const timeSlotChartInstance = ref(null)
const predictionChartInstance = ref(null)

// 预测数据
const prediction30min = computed(() => {
  const currentRisk = store.dailyAvgRisk
  // 基于当前风险和时间段预测（模拟算法）
  const timeFactor = new Date().getHours()
  const hourMultiplier = timeFactor >= 7 && timeFactor <= 9 ? 1.15 : 
                         timeFactor >= 17 && timeFactor <= 19 ? 1.2 : 
                         timeFactor >= 21 || timeFactor <= 5 ? 0.9 : 1.0
  return Math.min(currentRisk * hourMultiplier * 1.1, 1)
})

const prediction1hour = computed(() => {
  const currentRisk = store.dailyAvgRisk
  const timeFactor = new Date().getHours()
  const hourMultiplier = timeFactor >= 7 && timeFactor <= 9 ? 1.2 : 
                         timeFactor >= 17 && timeFactor <= 19 ? 1.25 : 
                         timeFactor >= 21 || timeFactor <= 5 ? 0.85 : 1.05
  return Math.min(currentRisk * hourMultiplier * 1.15, 1)
})

const trendDirection = computed(() => {
  if (prediction1hour.value > prediction30min.value + 0.05) return 'up'
  if (prediction1hour.value < prediction30min.value - 0.05) return 'down'
  return 'stable'
})

const trendText = computed(() => {
  if (trendDirection.value === 'up') return '↑ 上升'
  if (trendDirection.value === 'down') return '↓ 下降'
  return '→ 平稳'
})

const getPredictionColor = (value) => {
  if (value >= 0.75) return '#ff4757'
  if (value >= 0.5) return '#ffa502'
  if (value >= 0.25) return '#2ed573'
  return '#00d4ff'
}

const thresholdLabels = {
  low: '低阈值',
  medium: '中阈值',
  high: '高阈值'
}

// 获取阈值标签类型
const getThresholdTagType = (level) => {
  const types = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return types[level] || 'info'
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance.value = echarts.init(chartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: ['低风险', '中低风险', '中高风险', '高风险'],
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '路段数量',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: (params) => {
            const colors = ['#2ed573', '#ffa502', '#ff7f50', '#ff4757']
            return colors[params.dataIndex]
          },
          borderRadius: [4, 4, 0, 0]
        },
        data: []
      }
    ]
  }
  
  chartInstance.value.setOption(option)
}

// 更新图表数据
const updateChart = () => {
  if (!chartInstance.value) return

  const distribution = store.riskDistribution

  chartInstance.value.setOption({
    series: [{
      data: [
        distribution.low,
        distribution.medium,
        distribution.high,
        distribution.critical
      ]
    }]
  })
}

// 初始化时段图表
const initTimeSlotChart = () => {
  if (!timeSlotChartRef.value) return

  timeSlotChartInstance.value = echarts.init(timeSlotChartRef.value)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      },
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>平均风险: ${(data.value * 100).toFixed(1)}%`
      }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: ['早高峰', '平峰', '晚高峰', '夜间'],
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 11,
        formatter: (value) => (value * 100).toFixed(0) + '%'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '平均风险',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#00d4ff',
          width: 3
        },
        itemStyle: {
          color: '#00d4ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.4)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }
            ]
          }
        },
        data: []
      }
    ]
  }

  timeSlotChartInstance.value.setOption(option)
}

// 初始化预测图表
const initPredictionChart = () => {
  if (!predictionChartRef.value) return
  
  predictionChartInstance.value = echarts.init(predictionChartRef.value)
  
  // 生成历史数据和预测数据
  const now = new Date()
  const timeLabels = []
  const historyData = []
  const predictData = []
  
  // 历史数据（过去1小时，每10分钟一个点）
  for (let i = 6; i >= 1; i--) {
    const time = new Date(now.getTime() - i * 10 * 60000)
    timeLabels.push(time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0'))
    historyData.push((store.dailyAvgRisk * (0.85 + Math.random() * 0.3)).toFixed(3))
  }
  
  // 当前时刻
  timeLabels.push('现在')
  historyData.push(store.dailyAvgRisk.toFixed(3))
  
  // 预测数据（未来30分钟和1小时）
  timeLabels.push('+30m')
  predictData.push({ value: [7, prediction30min.value.toFixed(3)], symbol: 'triangle' })
  timeLabels.push('+1h')
  predictData.push({ value: [8, prediction1hour.value.toFixed(3)], symbol: 'triangle' })
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0]
        return `${item.name}: ${(Number(item.value) * 100).toFixed(1)}%`
      }
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 45
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 9,
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        }
      },
      axisLabel: {
        color: '#a0aec0',
        fontSize: 10,
        formatter: (value) => (value * 100).toFixed(0) + '%'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '历史风险',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#00d4ff',
          width: 2
        },
        itemStyle: {
          color: '#00d4ff'
        },
        areaStyle: {
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }
          ]
        },
        data: historyData
      },
      {
        name: '预测风险',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 10,
        lineStyle: {
          color: '#ffa502',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#ffa502'
        },
        data: [null, null, null, null, null, null, null, prediction30min.value, prediction1hour.value]
      }
    ],
    markArea: {
      silent: true,
      data: [
        [
          { xAxis: '现在', itemStyle: { color: 'rgba(255, 165, 2, 0.05)' } },
          { xAxis: '+1h' }
        ]
      ]
    }
  }
  
  predictionChartInstance.value.setOption(option)
}

// 更新时段图表
const updateTimeSlotChart = () => {
  if (!timeSlotChartInstance.value) return

  const stats = store.timeSlotStats
  const data = [
    stats.morning?.avgRisk || 0,
    stats.noon?.avgRisk || 0,
    stats.evening?.avgRisk || 0,
    stats.night?.avgRisk || 0
  ]

  timeSlotChartInstance.value.setOption({
    series: [{
      data: data
    }]
  })
}

// 格式化更新时间
const formatUpdateTime = (date) => {
  if (!date) return '--'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 查看详情
const handleViewDetail = (segment) => {
  store.selectSegment(segment)
}

// 监听数据变化
watch(() => store.riskDistribution, () => {
  updateChart()
}, { deep: true })

watch(() => store.timeSlotStats, () => {
  updateTimeSlotChart()
}, { deep: true })

// 窗口大小变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
  if (timeSlotChartInstance.value) {
    timeSlotChartInstance.value.resize()
  }
  if (predictionChartInstance.value) {
    predictionChartInstance.value.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
    updateChart()
    initTimeSlotChart()
    updateTimeSlotChart()
    initPredictionChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  if (timeSlotChartInstance.value) {
    timeSlotChartInstance.value.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.stats-panel-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  height: 100%;
  overflow-y: auto;
}

.stats-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: 14px;
    font-weight: 600;
    color: $primary-color;
    
    .el-icon {
      font-size: 18px;
    }
  }
}

.threshold-card {
  .threshold-indicator {
    .threshold-level, .threshold-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-sm 0;
      
      .level-label, .value-label {
        color: $text-secondary;
        font-size: 13px;
      }
      
      .value-number {
        font-size: 18px;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }
}

.chart-card {
  .chart-container {
    width: 100%;
    height: 200px;
  }
}

.timeslot-chart-card {
  .chart-container {
    width: 100%;
    height: 180px;
  }

  .daily-avg {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: $spacing-sm;

    .avg-label {
      color: $text-secondary;
      font-size: 12px;
    }

    .avg-value {
      font-size: 16px;
      font-weight: 600;
    }
  }
}

.prediction-card {
  .chart-container {
    width: 100%;
    height: 160px;
  }
  
  .prediction-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: $spacing-sm;
    
    .prediction-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      
      .pred-label {
        color: $text-secondary;
        font-size: 11px;
      }
      
      .pred-value {
        font-size: 16px;
        font-weight: 600;
      }
      
      &.trend {
        .pred-trend {
          font-size: 14px;
          font-weight: 600;
          
          &.up {
            color: #ff4757;
          }
          &.down {
            color: #2ed573;
          }
          &.stable {
            color: #ffa502;
          }
        }
      }
    }
  }
}

.table-card {
  .risk-table {
    :deep(.el-table) {
      background: transparent;
      
      th.el-table__cell {
        background: rgba(0, 212, 255, 0.1);
        color: $primary-color;
        border-bottom: 1px solid $border-light;
      }
      
      td.el-table__cell {
        background: transparent;
        border-bottom: 1px solid $border-light;
      }
      
      tr:hover > td {
        background: rgba(0, 212, 255, 0.05) !important;
      }
      
      .road-name {
        font-size: 12px;
        color: $text-primary;
      }
      
      .risk-value {
        font-weight: 600;
        font-size: 13px;
      }
    }
  }
}

.info-card {
  .info-content {
    p {
      margin: $spacing-sm 0;
      font-size: 13px;
      color: $text-secondary;

      strong {
        color: $text-primary;
      }

      &.hint {
        margin-top: $spacing-md;
        padding-top: $spacing-sm;
        border-top: 1px solid $border-light;
        font-size: 12px;
        color: $text-muted;
      }

      &.update-time {
        font-size: 11px;
        color: $primary-color;
      }
    }
  }
}
</style>
