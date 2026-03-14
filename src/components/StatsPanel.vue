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
const chartInstance = ref(null)

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

// 查看详情
const handleViewDetail = (segment) => {
  store.selectSegment(segment)
}

// 监听数据变化
watch(() => store.riskDistribution, () => {
  updateChart()
}, { deep: true })

// 窗口大小变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
    updateChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
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
    }
  }
}
</style>
