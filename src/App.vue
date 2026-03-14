<!-- =====================================================
     主应用组件 - 5G-V2X车联网可视化系统
     支持双视图模式：V2X可视化 + 城市交通风险热力图
     ===================================================== -->

<template>
  <div class="v2x-system">
    <!-- 顶部标题栏 -->
    <header class="system-header">
      <div class="header-title">
        <h1>{{ pageTitle }}</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleReset" class="reset-btn">
          <el-icon><RefreshRight /></el-icon>
          重置模拟
        </el-button>
      </div>
    </header>

    <!-- 主体内容区域 -->
    <main class="system-main">
      <!-- 左侧控制区 -->
      <aside class="control-panel">
        <ControlPanel
          :current-scene="currentScene"
          :vehicle-speed="vehicleSpeed"
          :vehicle-density="vehicleDensity"
          :threshold-level1="thresholdLevel1"
          :threshold-level2="thresholdLevel2"
          :scene-config="currentSceneConfig"
          @scene-change="handleSceneChange"
          @speed-change="handleSpeedChange"
          @density-change="handleDensityChange"
          @threshold1-change="handleThreshold1Change"
          @threshold2-change="handleThreshold2Change"
          @file-upload="handleFileUpload"
          @view-change="handleViewChange"
        />
      </aside>

      <!-- 主可视化区域 -->
      <section class="visualization-area">
        <!-- V2X可视化画布 -->
        <VisualizationCanvas
          v-if="viewMode === 'v2x'"
          ref="canvasRef"
          :current-scene="currentScene"
          :vehicle-speed="vehicleSpeed"
          :vehicle-density="vehicleDensity"
          :simulation-data="currentSimulationData"
          :warning-level="warningLevel"
          :collision-triggered="collisionTriggered"
          @collision-end="handleCollisionEnd"
        />
        
        <!-- 热力图地图 -->
        <MapCanvas v-else ref="mapRef" />
      </section>

      <!-- 右侧面板区域 -->
      <aside class="indicator-panel">
        <!-- V2X指标面板 -->
        <IndicatorPanel
          v-if="viewMode === 'v2x'"
          :simulation-data="currentSimulationData"
          :warning-level="warningLevel"
          :current-scene="currentScene"
          :scene-config="currentSceneConfig"
        />
        
        <!-- 热力图统计面板 -->
        <StatsPanel v-else />
      </aside>
    </main>

    <!-- 底部说明栏 -->
    <footer class="system-footer">
      <div class="footer-content">
        <p>
          <el-icon><InfoFilled /></el-icon>
          {{ footerText }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ControlPanel from '@/components/ControlPanel.vue'
import VisualizationCanvas from '@/components/VisualizationCanvas.vue'
import IndicatorPanel from '@/components/IndicatorPanel.vue'
import MapCanvas from '@/components/MapCanvas.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import { defaultSimulationData } from '@/data/simulationData.js'
import { parseSimulationFile } from '@/utils/dataParser.js'
import { sceneConfigs } from '@/config/scenes.js'
import { useHeatmapStore } from '@/stores/heatmap'

const heatmapStore = useHeatmapStore()

// =====================================================
// V2X模式状态
// =====================================================
const currentScene = ref('city')
const vehicleSpeed = ref(40)
const vehicleDensity = ref(200)
const thresholdLevel1 = ref(80)
const thresholdLevel2 = ref(50)
const uploadedData = ref(null)
const currentSimulationData = ref(null)
const warningLevel = ref(0)
const collisionTriggered = ref(false)
const canvasRef = ref(null)
const mapRef = ref(null)

// =====================================================
// 视图模式
// =====================================================
const viewMode = ref('v2x')

// =====================================================
// 计算属性
// =====================================================
const currentSceneConfig = computed(() => sceneConfigs[currentScene.value] || sceneConfigs.city)

const pageTitle = computed(() => {
  return viewMode.value === 'v2x' 
    ? '基于5G-V2X的智能车联网超视距协同避让可视化系统'
    : '城市交通风险热力图'
})

const footerText = computed(() => {
  return viewMode.value === 'v2x'
    ? '核心价值：通过5G-V2X车联网技术打破单车雷达的感知局限，让车辆被遮挡的盲区路况变得可见，实现超视距协同避让，显著提升道路交通安全水平'
    : '基于5G-V2X的智能交通可视化平台 - 通过热力图直观展示城市道路碰撞风险分布'
})

// =====================================================
// V2X数据匹配
// =====================================================
const matchSimulationData = (speed, density) => {
  const dataSource = uploadedData.value || defaultSimulationData
  const matchedData = dataSource.find(item => 
    item.vehicleSpeed === speed && item.vehicleDensity === density
  )
  if (matchedData) return { ...matchedData }
  return generateInterpolatedData(speed, density, dataSource)
}

const generateInterpolatedData = (speed, density, dataSource) => {
  let closestData = dataSource[0]
  let minDiff = Infinity
  dataSource.forEach(item => {
    const diff = Math.abs(item.vehicleSpeed - speed) + Math.abs(item.vehicleDensity - density)
    if (diff < minDiff) {
      minDiff = diff
      closestData = item
    }
  })
  return { ...closestData }
}

const updateSimulationData = () => {
  currentSimulationData.value = matchSimulationData(vehicleSpeed.value, vehicleDensity.value)
  checkWarningStatus()
}

const checkWarningStatus = () => {
  if (!currentSimulationData.value) return
  const successRate = currentSimulationData.value.avoidanceSuccessRate
  
  if (successRate < thresholdLevel2.value) {
    if (warningLevel.value !== 2) {
      warningLevel.value = 2
      collisionTriggered.value = true
      showCollisionWarning()
    }
  } else if (successRate < thresholdLevel1.value) {
    if (warningLevel.value !== 1) {
      warningLevel.value = 1
      ElMessage.warning('当前避让成功率低于安全阈值，存在碰撞风险')
    }
  } else {
    warningLevel.value = 0
  }
}

const showCollisionWarning = () => {
  ElMessageBox.alert('V2X超视距预警可有效避免该类事故', '碰撞事故已触发', {
    confirmButtonText: '确定',
    type: 'error',
    center: true
  })
}

// =====================================================
// 事件处理
// =====================================================
const handleViewChange = (mode) => {
  viewMode.value = mode
}

const handleSceneChange = (scene) => {
  currentScene.value = scene
  const config = sceneConfigs[scene]
  vehicleSpeed.value = Math.floor((config.speedRange[0] + config.speedRange[1]) / 2 / 10) * 10
  vehicleDensity.value = Math.floor((config.densityRange[0] + config.densityRange[1]) / 2 / 50) * 50
  updateSimulationData()
  if (collisionTriggered.value) {
    collisionTriggered.value = false
    warningLevel.value = 0
  }
  ElMessage.success(`已切换至${config.name}场景`)
}

const handleSpeedChange = (speed) => {
  vehicleSpeed.value = speed
  updateSimulationData()
}

const handleDensityChange = (density) => {
  vehicleDensity.value = density
  updateSimulationData()
}

const handleThreshold1Change = (value) => {
  if (value <= thresholdLevel2.value) {
    ElMessage.error('一级预警阈值必须大于二级预警阈值')
    return
  }
  thresholdLevel1.value = value
  checkWarningStatus()
}

const handleThreshold2Change = (value) => {
  if (value >= thresholdLevel1.value) {
    ElMessage.error('二级预警阈值必须小于一级预警阈值')
    return
  }
  thresholdLevel2.value = value
  checkWarningStatus()
}

const handleFileUpload = async (file) => {
  try {
    const parsedData = await parseSimulationFile(file)
    if (!validateData(parsedData)) {
      ElMessage.error('数据格式不正确，请检查文件是否包含所有必需字段')
      return false
    }
    uploadedData.value = parsedData
    updateSimulationData()
    ElMessage.success('仿真数据文件上传成功')
    return true
  } catch (error) {
    ElMessage.error('文件解析失败：' + error.message)
    return false
  }
}

const validateData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return false
  const requiredFields = ['vehicleSpeed', 'vehicleDensity', 'msgSuccessRate50m', 'msgSuccessRate150m', 'packetLossRate150m', 'adjacentVehicles', 'channelBusyRate', 'avgMsgDelay', 'throughput', 'wirelessBlindSpot', 'avoidanceSuccessRate', 'advanceWarningTime']
  return data.every(item => requiredFields.every(field => item.hasOwnProperty(field)))
}

const handleReset = () => {
  if (viewMode.value === 'v2x') {
    // V2X模式重置
    const config = currentSceneConfig.value
    vehicleSpeed.value = Math.floor((config.speedRange[0] + config.speedRange[1]) / 2 / 10) * 10
    vehicleDensity.value = Math.floor((config.densityRange[0] + config.densityRange[1]) / 2 / 50) * 50
    thresholdLevel1.value = 80
    thresholdLevel2.value = 50
    warningLevel.value = 0
    collisionTriggered.value = false
    updateSimulationData()
    if (canvasRef.value) canvasRef.value.resetAnimation()
    ElMessage.success('V2X模拟已重置')
  } else {
    // 热力图模式重置
    heatmapStore.reset()
    ElMessage.success('热力图已重置')
  }
}

const handleCollisionEnd = () => {}

// =====================================================
// 生命周期
// =====================================================
onMounted(() => {
  updateSimulationData()
})

watch([vehicleSpeed, vehicleDensity], () => {
  updateSimulationData()
})
</script>

<style lang="scss" scoped>
.v2x-system {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg;
  overflow: hidden;
}

.system-header {
  height: $header-height;
  min-height: 60px;
  background: rgba(10, 14, 39, 0.95);
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-xl;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  
  .header-title {
    flex: 1;
    h1 {
      font-size: 24px;
      font-weight: 600;
      background: $gradient-primary;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 2px;
    }
  }
  
  .header-actions {
    .reset-btn {
      padding: 10px 24px;
      font-size: 16px;
      font-weight: 500;
      border-radius: $radius-md;
      box-shadow: $shadow-primary;
      transition: all $transition-base;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
      }
    }
  }
}

.system-main {
  flex: 1;
  display: flex;
  height: 84vh;
  overflow: hidden;
}

.control-panel {
  width: $sidebar-width;
  min-width: 300px;
  height: 100%;
  background: rgba(10, 14, 39, 0.8);
  border-right: 1px solid $border-color;
  overflow-y: auto;
  padding: $spacing-md;
}

.visualization-area {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.indicator-panel {
  width: $sidebar-width;
  min-width: 300px;
  height: 100%;
  background: rgba(10, 14, 39, 0.8);
  border-left: 1px solid $border-color;
  overflow-y: auto;
  padding: $spacing-md;
}

.system-footer {
  height: $footer-height;
  min-height: 60px;
  background: rgba(10, 14, 39, 0.95);
  border-top: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-xl;
  
  .footer-content {
    text-align: center;
    p {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      color: $text-secondary;
      font-size: 14px;
      
      .el-icon {
        color: $primary-color;
        font-size: 18px;
      }
    }
  }
}
</style>
