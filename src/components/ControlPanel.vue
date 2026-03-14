<!-- =====================================================
     左侧控制区组件 - 5G-V2X车联网可视化系统
     功能：场景切换、参数调节、文件上传
     ===================================================== -->

<template>
  <div class="control-panel-container">
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
          <el-radio-button 
            v-for="scene in sceneList" 
            :key="scene.id" 
            :value="scene.id"
          >
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
      
      <!-- 车速调节 -->
      <div class="param-item">
        <div class="param-label">
          <span>行驶车速</span>
          <span class="param-value">{{ localSpeed }} km/h</span>
        </div>
        <div class="param-control">
          <el-slider
            v-model="localSpeed"
            :min="speedRange[0]"
            :max="speedRange[1]"
            :step="10"
            :disabled="isDisabled"
            @change="handleSpeedChange"
          />
          <el-input-number
            v-model="localSpeed"
            :min="speedRange[0]"
            :max="speedRange[1]"
            :step="10"
            size="small"
            :disabled="isDisabled"
            @change="handleSpeedChange"
          />
        </div>
      </div>

      <!-- 车辆密度调节 -->
      <div class="param-item">
        <div class="param-label">
          <span>车辆密度</span>
          <span class="param-value">{{ localDensity }} veh/km</span>
        </div>
        <div class="param-control">
          <el-slider
            v-model="localDensity"
            :min="densityRange[0]"
            :max="densityRange[1]"
            :step="50"
            :disabled="isDisabled"
            @change="handleDensityChange"
          />
          <el-input-number
            v-model="localDensity"
            :min="densityRange[0]"
            :max="densityRange[1]"
            :step="50"
            size="small"
            :disabled="isDisabled"
            @change="handleDensityChange"
          />
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
      
      <!-- 一级预警阈值 -->
      <div class="param-item">
        <div class="param-label">
          <span>一级预警阈值</span>
          <span class="param-value threshold-value">{{ localThreshold1 }}%</span>
        </div>
        <div class="param-control">
          <el-slider
            v-model="localThreshold1"
            :min="localThreshold2 + 1"
            :max="100"
            :step="1"
            :disabled="isDisabled"
            @change="handleThreshold1Change"
          />
          <el-input-number
            v-model="localThreshold1"
            :min="localThreshold2 + 1"
            :max="100"
            :step="1"
            size="small"
            :disabled="isDisabled"
            @change="handleThreshold1Change"
          />
        </div>
        <p class="param-hint">当避让成功率低于此阈值时触发红色警告</p>
      </div>

      <!-- 二级预警阈值 -->
      <div class="param-item">
        <div class="param-label">
          <span>二级预警阈值</span>
          <span class="param-value threshold-value danger">{{ localThreshold2 }}%</span>
        </div>
        <div class="param-control">
          <el-slider
            v-model="localThreshold2"
            :min="0"
            :max="localThreshold1 - 1"
            :step="1"
            :disabled="isDisabled"
            @change="handleThreshold2Change"
          />
          <el-input-number
            v-model="localThreshold2"
            :min="0"
            :max="localThreshold1 - 1"
            :step="1"
            size="small"
            :disabled="isDisabled"
            @change="handleThreshold2Change"
          />
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
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        accept=".xls,.xlsx"
        :on-change="handleFileChange"
      >
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { sceneList } from '@/config/scenes.js'

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
  'threshold1-change', 'threshold2-change', 'file-upload'
])

const localScene = ref(props.currentScene)
const localSpeed = ref(props.vehicleSpeed)
const localDensity = ref(props.vehicleDensity)
const localThreshold1 = ref(props.thresholdLevel1)
const localThreshold2 = ref(props.thresholdLevel2)
const uploadedFileName = ref('')
const isDisabled = ref(false)

const speedRange = computed(() => props.sceneConfig?.speedRange || [20, 60])
const densityRange = computed(() => props.sceneConfig?.densityRange || [100, 300])

watch(() => props.currentScene, (val) => { localScene.value = val })
watch(() => props.vehicleSpeed, (val) => { localSpeed.value = val })
watch(() => props.vehicleDensity, (val) => { localDensity.value = val })
watch(() => props.thresholdLevel1, (val) => { localThreshold1.value = val })
watch(() => props.thresholdLevel2, (val) => { localThreshold2.value = val })

const handleSceneChange = (scene) => { emit('scene-change', scene) }

const handleSpeedChange = (value) => {
  if (value < speedRange.value[0]) {
    localSpeed.value = speedRange.value[0]
    ElMessage.warning(`车速已调整为最小值 ${speedRange.value[0]} km/h`)
  } else if (value > speedRange.value[1]) {
    localSpeed.value = speedRange.value[1]
    ElMessage.warning(`车速已调整为最大值 ${speedRange.value[1]} km/h`)
  }
  emit('speed-change', localSpeed.value)
}

const handleDensityChange = (value) => {
  if (value < densityRange.value[0]) {
    localDensity.value = densityRange.value[0]
    ElMessage.warning(`车辆密度已调整为最小值 ${densityRange.value[0]} veh/km`)
  } else if (value > densityRange.value[1]) {
    localDensity.value = densityRange.value[1]
    ElMessage.warning(`车辆密度已调整为最大值 ${densityRange.value[1]} veh/km`)
  }
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

defineExpose({ setDisabled: (d) => { isDisabled.value = d }, resetUpload: () => { uploadedFileName.value = '' } })
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
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
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

.scene-card {
  .scene-buttons {
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
        
        &.is-active {
          .el-radio-button__inner {
            background: $gradient-primary;
            border-color: $primary-color;
            color: $text-primary;
            box-shadow: $shadow-primary;
          }
        }
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

.param-card, .threshold-card {
  .param-item {
    margin-bottom: $spacing-lg;
    
    &:last-child { margin-bottom: 0; }
    
    .param-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;
      
      span:first-child {
        font-size: 14px;
        color: $text-secondary;
      }
      
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
        
        .el-input__inner {
          color: $text-primary;
          text-align: center;
        }
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
          
          em {
            color: $primary-color;
            font-style: normal;
          }
          
          &.upload-hint {
            font-size: 12px;
            color: $text-muted;
            margin-top: $spacing-xs;
          }
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
