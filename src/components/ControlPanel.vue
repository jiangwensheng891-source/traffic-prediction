<!-- =====================================================
     左侧控制区组件 - 5G-V2X车联网可视化系统
     功能：场景切换、参数调节、文件上传、热力图控制
     ===================================================== -->

<template>
  <div class="control-panel-container">
    <!-- 视图切换 -->
    <el-card class="control-card view-card">
      <template #header>
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>视图模式</span>
        </div>
      </template>
      <el-radio-group v-model="viewMode" @change="handleViewChange" class="view-radio">
        <el-radio-button value="v2x">V2X可视化</el-radio-button>
        <el-radio-button value="heatmap">风险热力图</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- V2X模式控制 -->
    <template v-if="viewMode === 'v2x'">
      <!-- 场景切换模块 -->
      <el-card class="control-card scene-card">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>场景切换</span>
          </div>
        </template>
        <div class="scene-buttons">
          <el-radio-group v-model="localScene" @change="handleSceneChange" size="default">
            <el-radio-button v-for="scene in sceneList" :key="scene.id" :value="scene.id">
              {{ scene.name }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="scene-info" v-if="sceneConfig">
          <p class="info-text">{{ sceneConfig.description }}</p>
        </div>
      </el-card>

      <!-- 参数调节模块 -->
      <el-card class="control-card param-card">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>参数调节</span>
          </div>
        </template>
        
        <div class="param-item">
          <div class="param-label">
            <span>行驶车速</span>
            <span class="param-value">{{ localSpeed }} km/h</span>
          </div>
          <div class="param-control">
            <el-slider v-model="localSpeed" :min="speedRange[0]" :max="speedRange[1]" :step="10" :disabled="isDisabled" @change="handleSpeedChange" />
            <el-input-number v-model="localSpeed" :min="speedRange[0]" :max="speedRange[1]" :step="10" size="small" :disabled="isDisabled" @change="handleSpeedChange" />
          </div>
        </div>

        <div class="param-item">
          <div class="param-label">
            <span>车辆密度</span>
            <span class="param-value">{{ localDensity }} veh/km</span>
          </div>
          <div class="param-control">
            <el-slider v-model="localDensity" :min="densityRange[0]" :max="densityRange[1]" :step="50" :disabled="isDisabled" @change="handleDensityChange" />
            <el-input-number v-model="localDensity" :min="densityRange[0]" :max="densityRange[1]" :step="50" size="small" :disabled="isDisabled" @change="handleDensityChange" />
          </div>
        </div>
      </el-card>

      <!-- 预警阈值设置模块 -->
      <el-card class="control-card threshold-card">
        <template #header>
          <div class="card-header">
            <el-icon><Warning /></el-icon>
            <span>预警阈值设置</span>
          </div>
        </template>
        
        <div class="param-item">
          <div class="param-label">
            <span>一级预警阈值</span>
            <span class="param-value threshold-value">{{ localThreshold1 }}%</span>
          </div>
          <div class="param-control">
            <el-slider v-model="localThreshold1" :min="localThreshold2 + 1" :max="100" :step="1" :disabled="isDisabled" @change="handleThreshold1Change" />
            <el-input-number v-model="localThreshold1" :min="localThreshold2 + 1" :max="100" :step="1" size="small" :disabled="isDisabled" @change="handleThreshold1Change" />
          </div>
          <p class="param-hint">当避让成功率低于此阈值时触发红色警告</p>
        </div>

        <div class="param-item">
          <div class="param-label">
            <span>二级预警阈值</span>
            <span class="param-value threshold-value danger">{{ localThreshold2 }}%</span>
          </div>
          <div class="param-control">
            <el-slider v-model="localThreshold2" :min="0" :max="localThreshold1 - 1" :step="1" :disabled="isDisabled" @change="handleThreshold2Change" />
            <el-input-number v-model="localThreshold2" :min="0" :max="localThreshold1 - 1" :step="1" size="small" :disabled="isDisabled" @change="handleThreshold2Change" />
          </div>
          <p class="param-hint danger">当避让成功率低于此阈值时触发碰撞预警</p>
        </div>
      </el-card>

      <!-- 文件上传模块 -->
      <el-card class="control-card upload-card">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>仿真数据上传</span>
          </div>
        </template>
        <el-upload ref="uploadRef" class="upload-area" drag action="#" :auto-upload="false" :show-file-list="false" accept=".xls,.xlsx" :on-change="handleFileChange">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p>拖拽文件到此处或<em>点击上传</em></p>
            <p class="upload-hint">仅支持 .xls / .xlsx 格式</p>
          </div>
        </el-upload>
        <div class="upload-info" v-if="uploadedFileName">
          <el-icon><Document /></el-icon>
          <span>已上传: {{ uploadedFileName }}</span>
        </div>
      </el-card>
    </template>

    <!-- 热力图模式控制 -->
    <template v-else>
      <!-- 时间段选择 -->
      <el-card class="control-card time-card">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>时间段选择</span>
          </div>
        </template>
        <el-select v-model="selectedTimeSlot" placeholder="选择时间段" @change="handleTimeSlotChange">
          <el-option label="全部时段" value="all" />
          <el-option label="早高峰 (7:00-9:00)" value="morning" />
          <el-option label="午间 (11:00-13:00)" value="noon" />
          <el-option label="晚高峰 (17:00-19:00)" value="evening" />
          <el-option label="夜间 (22:00-6:00)" value="night" />
        </el-select>
      </el-card>

      <!-- 风险阈值调节 -->
      <el-card class="control-card risk-card">
        <template #header>
          <div class="card-header">
            <el-icon><Aim /></el-icon>
            <span>风险阈值调节</span>
          </div>
        </template>
        <div class="risk-level-buttons">
          <el-radio-group v-model="riskLevel" @change="handleRiskLevelChange">
            <el-radio-button value="low">低 (30%)</el-radio-button>
            <el-radio-button value="medium">中 (60%)</el-radio-button>
            <el-radio-button value="high">高 (80%)</el-radio-button>
          </el-radio-group>
        </div>
        <div class="param-item" style="margin-top: 16px">
          <div class="param-label">
            <span>自定义阈值</span>
            <span class="param-value">{{ customThreshold }}%</span>
          </div>
          <el-slider v-model="customThreshold" :min="0" :max="100" :step="5" @change="handleCustomThresholdChange" />
        </div>
      </el-card>

      <!-- 车密度过滤 -->
      <el-card class="control-card density-card">
        <template #header>
          <div class="card-header">
            <el-icon><DataLine /></el-icon>
            <span>车密度过滤</span>
          </div>
        </template>
        <div class="density-range">
          <div class="range-label">
            <span>最小密度</span>
            <span class="range-value">{{ densityMin }} veh/km</span>
          </div>
          <el-slider v-model="densityMin" :min="0" :max="densityMax" :step="10" @change="handleDensityFilterChange" />
        </div>
        <div class="density-range" style="margin-top: 12px">
          <div class="range-label">
            <span>最大密度</span>
            <span class="range-value">{{ densityMax }} veh/km</span>
          </div>
          <el-slider v-model="densityMax" :min="densityMin" :max="200" :step="10" @change="handleDensityFilterChange" />
        </div>
      </el-card>

      <!-- 热力图文件上传 -->
      <el-card class="control-card upload-card">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>路段数据上传</span>
          </div>
        </template>
        <el-upload class="upload-area" drag action="#" :auto-upload="false" :show-file-list="false" accept=".xls,.xlsx" :on-change="handleHeatmapFileChange">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p>拖拽文件到此处或<em>点击上传</em></p>
            <p class="upload-hint">Excel格式：id, name, geometry, speed, density, risk</p>
          </div>
        </el-upload>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { sceneList } from '@/config/scenes.js'
import { useHeatmapStore } from '@/stores/heatmap'
import { parseHeatmapFile } from '@/utils/heatmapParser.js'

const heatmapStore = useHeatmapStore()

const props = defineProps({
  currentScene: { type: String, default: 'city' },
  vehicleSpeed: { type: Number, default: 40 },
  vehicleDensity: { type: Number, default: 200 },
  thresholdLevel1: { type: Number, default: 80 },
  thresholdLevel2: { type: Number, default: 50 },
  sceneConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits([
  'scene-change', 'speed-change', 'density-change',
  'threshold1-change', 'threshold2-change', 'file-upload',
  'view-change'
])

// V2X模式状态
const localScene = ref(props.currentScene)
const localSpeed = ref(props.vehicleSpeed)
const localDensity = ref(props.vehicleDensity)
const localThreshold1 = ref(props.thresholdLevel1)
const localThreshold2 = ref(props.thresholdLevel2)
const uploadedFileName = ref('')
const isDisabled = ref(false)

// 热力图模式状态
const selectedTimeSlot = ref('all')
const riskLevel = ref('medium')
const customThreshold = ref(60)
const densityMin = ref(0)
const densityMax = ref(200)

// 视图模式
const viewMode = ref('v2x')

const speedRange = computed(() => props.sceneConfig?.speedRange || [20, 60])
const densityRange = computed(() => props.sceneConfig?.densityRange || [100, 300])

// 监听器
watch(() => props.currentScene, (val) => { localScene.value = val })
watch(() => props.vehicleSpeed, (val) => { localSpeed.value = val })
watch(() => props.vehicleDensity, (val) => { localDensity.value = val })
watch(() => props.thresholdLevel1, (val) => { localThreshold1.value = val })
watch(() => props.thresholdLevel2, (val) => { localThreshold2.value = val })

// V2X模式事件处理
const handleSceneChange = (scene) => { emit('scene-change', scene) }

const handleSpeedChange = (value) => {
  if (value < speedRange.value[0]) localSpeed.value = speedRange.value[0]
  else if (value > speedRange.value[1]) localSpeed.value = speedRange.value[1]
  emit('speed-change', localSpeed.value)
}

const handleDensityChange = (value) => {
  if (value < densityRange.value[0]) localDensity.value = densityRange.value[0]
  else if (value > densityRange.value[1]) localDensity.value = densityRange.value[1]
  emit('density-change', localDensity.value)
}

const handleThreshold1Change = (value) => {
  if (value <= localThreshold2.value) {
    ElMessage.error('一级预警阈值必须大于二级预警阈值')
    localThreshold1.value = localThreshold2.value + 1
    return
  }
  emit('threshold1-change', localThreshold1.value)
}

const handleThreshold2Change = (value) => {
  if (value >= localThreshold1.value) {
    ElMessage.error('二级预警阈值必须小于一级预警阈值')
    localThreshold2.value = localThreshold1.value - 1
    return
  }
  emit('threshold2-change', localThreshold2.value)
}

const handleFileChange = async (uploadFile) => {
  const file = uploadFile.raw
  const extension = file.name.split('.').pop().toLowerCase()
  if (!['xls', 'xlsx'].includes(extension)) {
    ElMessage.error('仅支持 .xls 和 .xlsx 格式的文件')
    return false
  }
  const success = await emit('file-upload', file)
  if (success !== false) {
    uploadedFileName.value = file.name
    ElMessage.success('文件上传成功')
  }
  return false
}

// 热力图模式事件处理
const handleTimeSlotChange = (slot) => {
  heatmapStore.setTimeSlot(slot)
}

const handleRiskLevelChange = (level) => {
  heatmapStore.setThresholdLevel(level)
  const thresholds = { low: 30, medium: 60, high: 80 }
  customThreshold.value = thresholds[level]
}

const handleCustomThresholdChange = (value) => {
  // 根据自定义值自动判断级别
  if (value <= 35) riskLevel.value = 'low'
  else if (value <= 70) riskLevel.value = 'medium'
  else riskLevel.value = 'high'
  
  heatmapStore.updateThreshold(riskLevel.value, value / 100)
}

const handleDensityFilterChange = () => {
  heatmapStore.setDensityFilter(densityMin.value, densityMax.value)
}

const handleHeatmapFileChange = async (uploadFile) => {
  const file = uploadFile.raw
  const extension = file.name.split('.').pop().toLowerCase()
  if (!['xls', 'xlsx'].includes(extension)) {
    ElMessage.error('仅支持 .xls 和 .xlsx 格式的文件')
    return false
  }
  
  try {
    const segments = await parseHeatmapFile(file)
    heatmapStore.setRoadSegments(segments)
    ElMessage.success(`成功导入 ${segments.length} 条路段数据`)
  } catch (error) {
    ElMessage.error('文件解析失败：' + error.message)
  }
  return false
}

// 视图切换
const handleViewChange = (mode) => {
  emit('view-change', mode)
  if (mode === 'heatmap') {
    heatmapStore.loadDefaultData()
  }
}

defineExpose({
  setDisabled: (d) => { isDisabled.value = d },
  resetUpload: () => { uploadedFileName.value = '' }
})
</script>

<style lang="scss" scoped>
.control-panel-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  height: 100%;
}

.control-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  transition: all $transition-base;
  
  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: 16px;
    font-weight: 600;
    color: $primary-color;
    
    .el-icon { font-size: 20px; }
  }
}

.view-card {
  .view-radio {
    width: 100%;
    
    :deep(.el-radio-button) {
      width: 50%;
      
      .el-radio-button__inner {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border-color: $border-light;
        color: $text-secondary;
      }
      
      &.is-active .el-radio-button__inner {
        background: $gradient-primary;
        border-color: $primary-color;
        color: $text-primary;
      }
    }
  }
}

.scene-card .scene-buttons {
  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    
    .el-radio-button {
      flex: 0 0 calc(50% - 4px);
      
      .el-radio-button__inner {
        width: 100%;
        padding: 10px 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid $border-light;
        color: $text-secondary;
        border-radius: $radius-sm;
        
        &:hover {
          border-color: $primary-color;
          color: $primary-light;
        }
      }
      
      &.is-active .el-radio-button__inner {
        background: $gradient-primary;
        border-color: $primary-color;
        color: $text-primary;
        box-shadow: $shadow-primary;
      }
    }
  }
  
  .scene-info {
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;
    
    .info-text {
      font-size: 12px;
      color: $text-muted;
      line-height: 1.6;
    }
  }
}

.param-card, .threshold-card, .risk-card, .density-card {
  .param-item {
    margin-bottom: $spacing-lg;
    
    &:last-child { margin-bottom: 0; }
    
    .param-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;
      
      span:first-child { font-size: 14px; color: $text-secondary; }
      
      .param-value {
        font-size: 16px;
        font-weight: 600;
        color: $primary-color;
        
        &.danger { color: $danger-color; }
        &.threshold-value { font-size: 14px; }
      }
    }
    
    .param-control {
      display: flex;
      gap: $spacing-sm;
      align-items: center;
      
      :deep(.el-slider) { flex: 1; }
      
      :deep(.el-input-number) {
        width: 90px;
        
        .el-input__wrapper {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid $border-light;
          box-shadow: none;
          
          &:hover, &.is-focus { border-color: $primary-color; }
        }
        
        .el-input__inner { color: $text-primary; text-align: center; }
      }
    }
    
    .param-hint {
      font-size: 12px;
      color: $text-muted;
      margin-top: $spacing-xs;
      
      &.danger { color: $danger-color; }
    }
  }
}

.time-card {
  :deep(.el-select) {
    width: 100%;
    
    .el-input__wrapper {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid $border-light;
      
      &:hover { border-color: $primary-color; }
    }
    
    .el-input__inner { color: $text-primary; }
  }
}

.risk-level-buttons {
  :deep(.el-radio-group) {
    display: flex;
    width: 100%;
    
    .el-radio-button {
      flex: 1;
      
      .el-radio-button__inner {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border-color: $border-light;
        color: $text-secondary;
      }
      
      &.is-active .el-radio-button__inner {
        background: $gradient-primary;
        border-color: $primary-color;
        color: $text-primary;
      }
    }
  }
}

.density-card {
  .density-range {
    .range-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-xs;
      
      span:first-child { font-size: 13px; color: $text-secondary; }
      .range-value { font-size: 14px; color: $primary-color; font-weight: 500; }
    }
  }
}

.upload-card {
  .upload-area {
    :deep(.el-upload-dragger) {
      background: rgba(255, 255, 255, 0.02);
      border: 2px dashed $border-light;
      border-radius: $radius-md;
      padding: $spacing-lg;
      transition: all $transition-base;
      
      &:hover {
        border-color: $primary-color;
        background: rgba(0, 212, 255, 0.05);
      }
      
      .upload-icon {
        font-size: 48px;
        color: $primary-color;
        margin-bottom: $spacing-sm;
      }
      
      .upload-text {
        p {
          color: $text-secondary;
          font-size: 14px;
          margin: 0;
          
          em { color: $primary-color; font-style: normal; }
          
          &.upload-hint { font-size: 11px; color: $text-muted; margin-top: $spacing-xs; }
        }
      }
    }
  }
  
  .upload-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: rgba(0, 212, 255, 0.1);
    border-radius: $radius-sm;
    font-size: 12px;
    color: $primary-light;
  }
}
</style>
