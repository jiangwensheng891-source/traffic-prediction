<!-- =====================================================
     热力图地图组件 - 城市交通风险热力图
     使用Leaflet + Canvas渲染风险热力图
     增强版：发光效果、区域热力、动态动画
     ===================================================== -->

<template>
  <div class="map-container">
    <div ref="mapRef" class="map-canvas"></div>
    
    <!-- 动态粒子背景 -->
    <div class="particle-overlay">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
    
    <!-- 扫描线动画 -->
    <div class="scan-line"></div>
    
    <!-- 图例 -->
    <div class="map-legend">
      <div class="legend-title">
        <span class="pulse-dot"></span>
        风险等级
      </div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color low"></span>
          <span>低风险 (0-0.25)</span>
          <span class="legend-percent">{{ lowRiskCount }}段</span>
        </div>
        <div class="legend-item">
          <span class="legend-color medium-low"></span>
          <span>中低风险 (0.25-0.5)</span>
          <span class="legend-percent">{{ mediumLowCount }}段</span>
        </div>
        <div class="legend-item">
          <span class="legend-color medium-high"></span>
          <span>中高风险 (0.5-0.75)</span>
          <span class="legend-percent">{{ mediumHighCount }}段</span>
        </div>
        <div class="legend-item">
          <span class="legend-color high"></span>
          <span>高风险 (0.75-1.0)</span>
          <span class="legend-percent">{{ highRiskCount }}段</span>
        </div>
      </div>
      <div class="legend-total">
        共 <strong>{{ store.filteredSegments.length }}</strong> 条路段
      </div>
    </div>
    
    <!-- 数据统计浮窗 -->
    <div class="stats-float">
      <div class="stats-item">
        <span class="stats-icon">📍</span>
        <span class="stats-label">监测路段</span>
        <span class="stats-value">{{ store.filteredSegments.length }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">⚠️</span>
        <span class="stats-label">高风险</span>
        <span class="stats-value danger">{{ highRiskCount }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">📊</span>
        <span class="stats-label">平均风险</span>
        <span class="stats-value">{{ (avgRisk * 100).toFixed(1) }}%</span>
      </div>
    </div>
    
    <!-- 路段详情弹框 -->
    <el-dialog
      v-model="showDetail"
      :title="selectedSegmentInfo?.name || '路段详情'"
      width="420px"
      class="segment-dialog"
    >
      <div v-if="selectedSegmentInfo" class="segment-detail">
        <div class="detail-header">
          <div class="risk-gauge" :style="{ '--risk-color': store.getRiskColor(selectedSegmentInfo.risk) }">
            <div class="gauge-value">{{ (selectedSegmentInfo.risk * 100).toFixed(1) }}%</div>
            <div class="gauge-bar">
              <div class="gauge-fill" :style="{ width: selectedSegmentInfo.risk * 100 + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">路段ID</span>
            <span class="value">{{ selectedSegmentInfo.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">平均车速</span>
            <span class="value">{{ selectedSegmentInfo.speed }} km/h</span>
          </div>
          <div class="detail-item">
            <span class="label">车流密度</span>
            <span class="value">{{ selectedSegmentInfo.density }} veh/km</span>
          </div>
          <div class="detail-item">
            <span class="label">风险等级</span>
            <el-tag :type="getRiskTagType(selectedSegmentInfo.risk)" effect="dark">
              {{ getRiskLevel(selectedSegmentInfo.risk) }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import L from 'leaflet'
import { useHeatmapStore } from '@/stores/heatmap'

const store = useHeatmapStore()

const mapRef = ref(null)
const map = ref(null)
const roadLayers = ref([])
const markerLayers = ref([])
const heatCanvas = ref(null)
const showDetail = ref(false)

const selectedSegmentInfo = computed(() => store.selectedSegment)

// 统计计算
const lowRiskCount = computed(() => store.filteredSegments.filter(s => s.risk < 0.25).length)
const mediumLowCount = computed(() => store.filteredSegments.filter(s => s.risk >= 0.25 && s.risk < 0.5).length)
const mediumHighCount = computed(() => store.filteredSegments.filter(s => s.risk >= 0.5 && s.risk < 0.75).length)
const highRiskCount = computed(() => store.filteredSegments.filter(s => s.risk >= 0.75).length)
const avgRisk = computed(() => {
  const segments = store.filteredSegments
  if (segments.length === 0) return 0
  return segments.reduce((sum, s) => sum + s.risk, 0) / segments.length
})

// 粒子样式生成
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 2
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 10 + 10}s`
  }
}

// 初始化地图
const initMap = () => {
  if (!mapRef.value) return
  
  // 创建Leaflet地图
  map.value = L.map(mapRef.value, {
    center: [39.90, 116.40],
    zoom: 13,
    zoomControl: true,
    attributionControl: false,
    preferCanvas: true
  })
  
  // 使用深色主题地图
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map.value)
  
  // 添加区域热力背景
  addHeatBackground()
  
  // 渲染路段
  renderRoadSegments()
  
  // 添加关键节点标记
  addKeyMarkers()
}

// 添加热力背景区域
const addHeatBackground = () => {
  // 创建一个Canvas图层用于热力背景
  const canvasLayer = L.layerGroup().addTo(map.value)
  
  store.filteredSegments.forEach(segment => {
    const color = store.getRiskColor(segment.risk)
    const opacity = Math.min(segment.risk * 0.3 + 0.1, 0.4)
    
    // 创建多边形区域（路段两侧扩展）
    if (segment.geometry.length >= 2) {
      const bounds = getExpandedBounds(segment.geometry, 0.003)
      L.polygon(bounds, {
        color: 'transparent',
        fillColor: color,
        fillOpacity: opacity,
        stroke: false
      }).addTo(canvasLayer)
    }
  })
  
  heatCanvas.value = canvasLayer
}

// 计算路段扩展边界
const getExpandedBounds = (coords, expand) => {
  const bounds = []
  coords.forEach(coord => {
    bounds.push([coord[0] + expand, coord[1] + expand])
    bounds.push([coord[0] - expand, coord[1] - expand])
  })
  return bounds
}

// 渲染路段 - 增强版
const renderRoadSegments = () => {
  // 清除旧图层
  roadLayers.value.forEach(layer => {
    map.value.removeLayer(layer)
  })
  roadLayers.value = []
  
  // 清除热力背景
  if (heatCanvas.value) {
    map.value.removeLayer(heatCanvas.value)
  }
  
  // 重新添加热力背景
  addHeatBackground()
  
  // 渲染过滤后的路段
  store.filteredSegments.forEach(segment => {
    const color = store.getRiskColor(segment.risk)
    const opacity = store.getRiskOpacity(segment.risk, store.currentThreshold)
    const isHighRisk = segment.risk >= 0.75
    
    // 发光底层（模拟发光效果）
    if (isHighRisk) {
      const glowLine = L.polyline(segment.geometry, {
        color: color,
        weight: 20,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'road-glow'
      })
      glowLine.addTo(map.value)
      roadLayers.value.push(glowLine)
    }
    
    // 主路段线条
    const polyline = L.polyline(segment.geometry, {
      color: color,
      weight: isHighRisk ? 8 : 6,
      opacity: opacity,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: isHighRisk ? null : '10, 5',
      dashOffset: '0',
      className: isHighRisk ? 'road-high-risk' : 'road-normal'
    })
    
    // 添加动画效果（高风险路段脉冲）
    if (isHighRisk) {
      animatePolyline(polyline, color)
    }
    
    // 添加点击事件
    polyline.on('click', () => {
      store.selectSegment(segment)
      showDetail.value = true
    })
    
    // 添加悬停事件
    polyline.on('mouseover', function() {
      this.setStyle({ weight: 12, opacity: 1, dashArray: null })
      this.bringToFront()
    })
    
    polyline.on('mouseout', function() {
      this.setStyle({ 
        weight: isHighRisk ? 8 : 6, 
        opacity: opacity,
        dashArray: isHighRisk ? null : '10, 5'
      })
    })
    
    // 添加到地图
    polyline.addTo(map.value)
    roadLayers.value.push(polyline)
    
    // 在路段起点和终点添加标记
    if (segment.geometry.length > 0) {
      const startMarker = L.circleMarker(segment.geometry[0], {
        radius: isHighRisk ? 6 : 4,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2
      })
      startMarker.addTo(map.value)
      roadLayers.value.push(startMarker)
      
      const endMarker = L.circleMarker(segment.geometry[segment.geometry.length - 1], {
        radius: isHighRisk ? 6 : 4,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2
      })
      endMarker.addTo(map.value)
      roadLayers.value.push(endMarker)
    }
  })
}

// 路段动画效果
const animatePolyline = (polyline, color) => {
  let offset = 0
  const animate = () => {
    offset = (offset + 0.5) % 20
    if (polyline.getElement && polyline.getElement()) {
      polyline.setStyle({ dashOffset: String(-offset) })
    }
    requestAnimationFrame(animate)
  }
  animate()
}

// 添加关键节点标记
const addKeyMarkers = () => {
  // 清除旧标记
  markerLayers.value.forEach(layer => {
    map.value.removeLayer(layer)
  })
  markerLayers.value = []
  
  // 添加一些关键地点标记
  const keyLocations = [
    { lat: 39.9142, lng: 116.3915, name: '天安门', type: 'landmark' },
    { lat: 39.9087, lng: 116.3975, name: '王府井', type: 'commercial' },
    { lat: 39.9163, lng: 116.3972, name: '东单路口', type: 'intersection' },
    { lat: 39.9024, lng: 116.3834, name: '西单路口', type: 'intersection' },
    { lat: 39.9344, lng: 116.4109, name: '朝阳门', type: 'landmark' },
    { lat: 39.9319, lng: 116.4168, name: '建国门', type: 'intersection' },
  ]
  
  keyLocations.forEach(loc => {
    // 自定义图标
    const iconHtml = `
      <div class="custom-marker ${loc.type}">
        <div class="marker-inner"></div>
        <div class="marker-pulse"></div>
      </div>
    `
    
    const icon = L.divIcon({
      html: iconHtml,
      className: 'marker-container',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
    
    const marker = L.marker([loc.lat, loc.lng], { icon })
    
    marker.bindTooltip(loc.name, {
      permanent: false,
      direction: 'top',
      className: 'location-tooltip'
    })
    
    marker.addTo(map.value)
    markerLayers.value.push(marker)
  })
}

// 获取风险等级文字
const getRiskLevel = (risk) => {
  if (risk < 0.25) return '低风险'
  if (risk < 0.5) return '中低风险'
  if (risk < 0.75) return '中高风险'
  return '高风险'
}

// 获取风险标签类型
const getRiskTagType = (risk) => {
  if (risk < 0.25) return 'success'
  if (risk < 0.5) return 'warning'
  if (risk < 0.75) return 'danger'
  return 'danger'
}

// 监听数据变化
watch(() => store.filteredSegments, () => {
  renderRoadSegments()
}, { deep: true })

watch(() => store.currentThreshold, () => {
  renderRoadSegments()
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})

defineExpose({
  refresh: renderRoadSegments
})
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%);
  border-radius: $radius-md;
  overflow: hidden;
  
  // 动态粒子背景
  .particle-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
    
    .particle {
      position: absolute;
      background: radial-gradient(circle, rgba(0, 212, 255, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      animation: float 15s infinite ease-in-out;
      
      @keyframes float {
        0%, 100% {
          transform: translate(0, 0) scale(1);
          opacity: 0.3;
        }
        25% {
          transform: translate(50px, -30px) scale(1.2);
          opacity: 0.6;
        }
        50% {
          transform: translate(100px, 20px) scale(0.8);
          opacity: 0.4;
        }
        75% {
          transform: translate(50px, 50px) scale(1.1);
          opacity: 0.5;
        }
      }
    }
  }
  
  // 扫描线动画
  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(0, 212, 255, 0.5) 50%, 
      transparent 100%);
    animation: scan 4s infinite linear;
    z-index: 2;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100px;
      background: linear-gradient(180deg, 
        rgba(0, 212, 255, 0.1) 0%, 
        transparent 100%);
    }
    
    @keyframes scan {
      0% {
        top: 0;
      }
      100% {
        top: 100%;
      }
    }
  }
}

.map-canvas {
  width: 100%;
  height: 100%;
  z-index: 0;
  
  :deep(.leaflet-container) {
    background: transparent;
  }
  
  // 高风险路段样式
  :deep(.road-high-risk) {
    filter: drop-shadow(0 0 8px currentColor);
    animation: pulse-glow 2s infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      filter: drop-shadow(0 0 8px currentColor);
    }
    50% {
      filter: drop-shadow(0 0 15px currentColor);
    }
  }
  
  // 发光效果
  :deep(.road-glow) {
    filter: blur(8px);
  }
  
  // 自定义标记样式
  :deep(.marker-container) {
    background: transparent;
    border: none;
  }
  
  :deep(.custom-marker) {
    position: relative;
    width: 16px;
    height: 16px;
    
    .marker-inner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: $primary-color;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.8);
    }
    
    .marker-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      background: rgba(0, 212, 255, 0.3);
      border-radius: 50%;
      animation: marker-pulse 2s infinite;
    }
    
    &.intersection {
      .marker-inner {
        background: #ffa502;
      }
      .marker-pulse {
        background: rgba(255, 165, 2, 0.3);
      }
    }
    
    &.landmark {
      .marker-inner {
        background: #2ed573;
      }
      .marker-pulse {
        background: rgba(46, 213, 115, 0.3);
      }
    }
    
    &.commercial {
      .marker-inner {
        background: #ff6b81;
      }
      .marker-pulse {
        background: rgba(255, 107, 129, 0.3);
      }
    }
  }
  
  @keyframes marker-pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.5);
      opacity: 0;
    }
  }
  
  // 地点提示框
  :deep(.location-tooltip) {
    background: rgba(10, 14, 39, 0.95);
    border: 1px solid $border-color;
    border-radius: 4px;
    color: $text-primary;
    font-size: 12px;
    padding: 4px 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

// 图例样式
.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(10, 14, 39, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: $radius-md;
  padding: $spacing-md;
  backdrop-filter: blur(10px);
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  
  .legend-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: $primary-color;
    margin-bottom: $spacing-sm;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: $primary-color;
      border-radius: 50%;
      animation: pulse 2s infinite;
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.2);
        }
      }
    }
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: 12px;
    color: $text-secondary;
    padding: 4px 0;
    
    .legend-color {
      width: 24px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
      
      &.low {
        background: linear-gradient(90deg, #00d4ff, #2ed573);
      }
      &.medium-low {
        background: linear-gradient(90deg, #2ed573, #ffa502);
      }
      &.medium-high {
        background: linear-gradient(90deg, #ffa502, #ff7f50);
      }
      &.high {
        background: linear-gradient(90deg, #ff7f50, #ff4757);
        animation: high-risk-pulse 1.5s infinite;
      }
      
      @keyframes high-risk-pulse {
        0%, 100% {
          box-shadow: 0 0 5px #ff4757;
        }
        50% {
          box-shadow: 0 0 15px #ff4757;
        }
      }
    }
    
    .legend-percent {
      margin-left: auto;
      font-weight: 600;
      color: $text-primary;
      font-size: 11px;
    }
  }
  
  .legend-total {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: $text-secondary;
    text-align: center;
    
    strong {
      color: $primary-color;
      font-size: 14px;
    }
  }
}

// 数据统计浮窗
.stats-float {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  
  .stats-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(10, 14, 39, 0.9);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    backdrop-filter: blur(10px);
    
    .stats-icon {
      font-size: 14px;
    }
    
    .stats-label {
      font-size: 11px;
      color: $text-secondary;
    }
    
    .stats-value {
      margin-left: auto;
      font-size: 14px;
      font-weight: 600;
      color: $primary-color;
      
      &.danger {
        color: #ff4757;
        animation: blink 1s infinite;
      }
      
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    }
  }
}

// 详情弹窗样式
.segment-dialog {
  :deep(.el-dialog) {
    background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 100%);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
  
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .el-dialog__title {
      color: $primary-color;
      font-weight: 600;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
  
  .segment-detail {
    .detail-header {
      margin-bottom: 20px;
      
      .risk-gauge {
        --risk-color: #00d4ff;
        
        .gauge-value {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: var(--risk-color);
          text-shadow: 0 0 20px var(--risk-color);
          margin-bottom: 8px;
        }
        
        .gauge-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          
          .gauge-fill {
            height: 100%;
            background: var(--risk-color);
            border-radius: 4px;
            transition: width 0.5s ease;
            box-shadow: 0 0 10px var(--risk-color);
          }
        }
      }
    }
    
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      
      .label {
        color: $text-secondary;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .value {
        color: $text-primary;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}
</style>
