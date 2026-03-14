<!-- =====================================================
     右侧指标面板组件 - 5G-V2X车联网可视化系统
     功能：展示基础工况、通信性能、安全性能指标
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
      <div class="indicator-grid basic-grid">
        <div class="indicator-item large">
          <div class="indicator-label">行驶车速</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.vehicleSpeed) }}
            <span class="unit">km/h</span>
          </div>
        </div>
        <div class="indicator-item large">
          <div class="indicator-label">车辆密度</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.vehicleDensity) }}
            <span class="unit">veh/km</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 通信性能指标卡片 -->
    <el-card class="indicator-card communication-card">
      <template #header>
        <div class="card-header">
          <el-icon><Connection /></el-icon>
          <span>通信性能指标</span>
        </div>
      </template>
      <div class="indicator-grid">
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('msgSuccessRate50m') }">
          <div class="indicator-label">50米消息接收成功率</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.msgSuccessRate50m, 2) }}
            <span class="unit">%</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('msgSuccessRate150m') }">
          <div class="indicator-label">150米消息接收成功率</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.msgSuccessRate150m, 2) }}
            <span class="unit">%</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('packetLossRate150m') }">
          <div class="indicator-label">150米丢包率</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.packetLossRate150m, 2) }}
            <span class="unit">%</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('avgMsgDelay') }">
          <div class="indicator-label">平均消息时延</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.avgMsgDelay, 2) }}
            <span class="unit">ms</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('throughput') }">
          <div class="indicator-label">吞吐量</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.throughput, 2) }}
            <span class="unit">Mbps</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('channelBusyRate') }">
          <div class="indicator-label">信道忙碌率</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.channelBusyRate, 2) }}
            <span class="unit">%</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 安全性能指标卡片 -->
    <el-card class="indicator-card safety-card">
      <template #header>
        <div class="card-header">
          <el-icon><Shield /></el-icon>
          <span>安全性能指标</span>
        </div>
      </template>
      <div class="indicator-grid">
        <div class="indicator-item">
          <div class="indicator-label">相邻车辆数</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.adjacentVehicles, 0) }}
            <span class="unit">辆</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('wirelessBlindSpot') }">
          <div class="indicator-label">无线盲区指标</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.wirelessBlindSpot, 2) }}
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('avoidanceSuccessRate'), danger: isDangerIndicator('avoidanceSuccessRate') }">
          <div class="indicator-label">避让成功率</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.avoidanceSuccessRate, 2) }}
            <span class="unit">%</span>
          </div>
        </div>
        <div class="indicator-item" :class="{ highlight: isCoreIndicator('advanceWarningTime'), danger: isDangerIndicator('advanceWarningTime') }">
          <div class="indicator-label">提前预警时间</div>
          <div class="indicator-value">
            {{ formatValue(simulationData?.advanceWarningTime, 2) }}
            <span class="unit">s</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  simulationData: { type: Object, default: () => ({}) },
  warningLevel: { type: Number, default: 0 },
  currentScene: { type: String, default: 'city' },
  sceneConfig: { type: Object, default: () => ({}) }
})

const warningClass = computed(() => ({
  'warning-level-1': props.warningLevel === 1,
  'warning-level-2': props.warningLevel === 2
}))

const warningMessage = computed(() => {
  if (props.warningLevel === 1) return '当前避让成功率低于安全阈值，存在碰撞风险'
  if (props.warningLevel === 2) return 'V2X超视距预警可有效避免该类事故'
  return ''
})

const formatValue = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) return '--'
  return Number(value).toFixed(decimals)
}

const isCoreIndicator = (indicator) => {
  return props.sceneConfig?.coreIndicators?.includes(indicator) || false
}

const isDangerIndicator = (indicator) => {
  if (props.warningLevel === 0) return false
  return ['avoidanceSuccessRate', 'advanceWarningTime'].includes(indicator)
}
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
