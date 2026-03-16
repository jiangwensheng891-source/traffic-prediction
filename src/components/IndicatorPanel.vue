<!-- =====================================================
     右侧指标面板组件 - 5G-V2X车联网可视化系统
     功能：展示基础工况、通信性能、安全性能指标（柱状图）
     ===================================================== -->

<template>
  <div class="indicator-panel-container">
    <!-- 预警提示区域 -->
    <transition name="slide-fade">
      <div v-if="warningLevel > 0" class="warning-banner" :class="warningClass">
        <div class="warning-icon">
          <el-icon v-if="warningLevel === 1"><Warning /></el-icon>
          <el-icon v-else><CircleClose /></el-icon>
        </div>
        <div class="warning-content">
          <h4>{{ warningLevel === 1 ? '一级预警' : '碰撞事故已触发' }}</h4>
          <p>{{ warningMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- 基础工况指标卡片 -->
    <el-card class="indicator-card basic-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>基础工况指标</span>
        </div>
      </template>
      <div ref="basicChartRef" class="chart-container"></div>
    </el-card>

    <!-- 通信性能指标卡片 - 柱状图 -->
    <el-card class="indicator-card communication-card">
      <template #header>
        <div class="card-header">
          <el-icon><Connection /></el-icon>
          <span>通信性能指标</span>
        </div>
      </template>
      <div ref="commChartRef" class="chart-container"></div>
    </el-card>

    <!-- 安全性能指标卡片 - 柱状图 -->
    <el-card class="indicator-card safety-card">
      <template #header>
        <div class="card-header">
          <el-icon><Shield /></el-icon>
          <span>安全性能指标</span>
        </div>
      </template>
      <div ref="safetyChartRef" class="chart-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  simulationData: { type: Object, default: () => ({}) },
  warningLevel: { type: Number, default: 0 },
  currentScene: { type: String, default: 'city' },
  sceneConfig: { type: Object, default: () => ({}) }
})

// 图表引用
const basicChartRef = ref(null)
const commChartRef = ref(null)
const safetyChartRef = ref(null)
let basicChart = null
let commChart = null
let safetyChart = null

// 图表颜色
const chartColors = {
  primary: '#00d4ff',
  success: '#2ed573',
  warning: '#ffa502',
  danger: '#ff4757',
  purple: '#a55eea'
}

const warningClass = computed(() => ({
  'warning-level-1': props.warningLevel === 1,
  'warning-level-2': props.warningLevel === 2
}))

const warningMessage = computed(() => {
  if (props.warningLevel === 1) return '当前避让成功率低于安全阈值，存在碰撞风险'
  if (props.warningLevel === 2) return 'V2X超视距预警可有效避免该类事故'
  return ''
})

// 初始化基础工况柱状图
const initBasicChart = () => {
  if (!basicChartRef.value) return
  
  basicChart = echarts.init(basicChartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: ['车速', '密度'],
      axisLabel: { color: '#888' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: [
        { value: props.simulationData?.vehicleSpeed || 0, itemStyle: { color: chartColors.primary } },
        { value: props.simulationData?.vehicleDensity || 0, itemStyle: { color: chartColors.warning } }
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        color: '#fff',
        formatter: (params) => params.value + (params.dataIndex === 0 ? 'km/h' : 'veh/km')
      }
    }]
  }
  basicChart.setOption(option)
}

// 初始化通信性能柱状图
const initCommChart = () => {
  if (!commChartRef.value) return
  
  commChart = echarts.init(commChartRef.value)
  
  const data = [
    { name: '50m成功率', value: props.simulationData?.msgSuccessRate50m || 0 },
    { name: '150m成功率', value: props.simulationData?.msgSuccessRate150m || 0 },
    { name: '150m丢包率', value: props.simulationData?.packetLossRate150m || 0 },
    { name: '消息时延', value: props.simulationData?.avgMsgDelay || 0 },
    { name: '吞吐量', value: props.simulationData?.throughput || 0 },
    { name: '信道忙碌率', value: props.simulationData?.channelBusyRate || 0 }
  ]
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0]
        const units = ['%', '%', '%', 'ms', 'Mbps', '%']
        return `${item.name}: ${item.value}${units[item.dataIndex]}`
      }
    },
    grid: { top: 30, right: 20, bottom: 50, left: 50 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { 
        color: '#888',
        rotate: 30,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.value,
        itemStyle: { 
          color: i < 2 ? chartColors.success : (i < 4 ? chartColors.primary : chartColors.warning)
        }
      })),
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        color: '#fff',
        fontSize: 9,
        formatter: (params) => params.value.toFixed(1)
      }
    }]
  }
  commChart.setOption(option)
}

// 初始化安全性能柱状图
const initSafetyChart = () => {
  if (!safetyChartRef.value) return
  
  safetyChart = echarts.init(safetyChartRef.value)
  
  const data = [
    { name: '相邻车辆', value: props.simulationData?.adjacentVehicles || 0 },
    { name: '无线盲区', value: props.simulationData?.wirelessBlindSpot || 0 },
    { name: '避让成功率', value: props.simulationData?.avoidanceSuccessRate || 0 },
    { name: '预警时间', value: props.simulationData?.advanceWarningTime || 0 }
  ]
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0]
        const units = ['', '', '%', 's']
        return `${item.name}: ${item.value}${units[item.dataIndex]}`
      }
    },
    grid: { top: 30, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { color: '#888' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.value,
        itemStyle: { 
          color: i === 2 ? (props.warningLevel > 0 ? chartColors.danger : chartColors.success) : 
                  (i === 3 ? chartColors.primary : chartColors.purple)
        }
      })),
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        color: '#fff',
        formatter: (params) => params.dataIndex >= 2 ? params.value.toFixed(1) + '%' : params.value.toFixed(1)
      }
    }]
  }
  safetyChart.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  nextTick(() => {
    initBasicChart()
    initCommChart()
    initSafetyChart()
  })
}

// 监听数据变化
watch(() => props.simulationData, updateCharts, { deep: true })
watch(() => props.warningLevel, updateCharts)

onMounted(() => {
  updateCharts()
  window.addEventListener('resize', () => {
    basicChart?.resize()
    commChart?.resize()
    safetyChart?.resize()
  })
})

onUnmounted(() => {
  basicChart?.dispose()
  commChart?.dispose()
  safetyChart?.dispose()
})
</script>

<style lang="scss" scoped>
.indicator-panel-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  height: 100%;
  overflow-y: auto;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-radius: $radius-md;
  animation: slideIn 0.3s ease;
  
  &.warning-level-1 {
    background: rgba(255, 165, 2, 0.2);
    border: 1px solid $warning-color;
    .warning-icon { color: $warning-color; }
  }
  
  &.warning-level-2 {
    background: rgba(255, 71, 87, 0.2);
    border: 1px solid $danger-color;
    animation: flash 1s infinite;
    .warning-icon { color: $danger-color; }
  }
  
  .warning-icon { font-size: 32px; flex-shrink: 0; }
  
  .warning-content {
    h4 { font-size: 16px; font-weight: 600; color: $text-primary; margin: 0 0 4px 0; }
    p { font-size: 12px; color: $text-secondary; margin: 0; }
  }
}

.indicator-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  transition: all $transition-base;
  
  &:hover { border-color: rgba(0, 212, 255, 0.4); }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: 14px;
    font-weight: 600;
    color: $primary-color;
    .el-icon { font-size: 18px; }
  }
}

.chart-container {
  width: 100%;
  height: 150px;
}

.indicator-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.indicator-item {
  padding: $spacing-md;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-sm;
  border: 1px solid transparent;
  transition: all $transition-base;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: $border-light;
  }
  
  &.large { padding: $spacing-lg; }
  
  &.highlight {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.3);
    .indicator-label { color: $primary-light; }
    .indicator-value { color: $primary-color; font-weight: 700; }
  }
  
  &.danger {
    background: rgba(255, 71, 87, 0.1);
    border-color: rgba(255, 71, 87, 0.3);
    .indicator-label { color: $danger-light; }
    .indicator-value { color: $danger-color; }
  }
  
  .indicator-label { font-size: 12px; color: $text-muted; margin-bottom: $spacing-xs; }
  
  .indicator-value {
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    
    .unit { font-size: 12px; font-weight: 400; color: $text-secondary; margin-left: 2px; }
  }
  
  &.large .indicator-value { font-size: 28px; color: $primary-color; }
}
</style>
