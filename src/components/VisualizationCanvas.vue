<!-- =====================================================
     主可视化画布组件 - 5G-V2X车联网可视化系统
     功能：车辆行驶动画、道路渲染、盲区可视化、碰撞动画
     使用Canvas实现高性能动画渲染
     ===================================================== -->

<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef" class="main-canvas"></canvas>
    
    <!-- 图例说明 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-color main-vehicle"></span>
        <span>主车（用户视角）</span>
      </div>
      <div class="legend-item">
        <span class="legend-color other-vehicle"></span>
        <span>周边车辆</span>
      </div>
      <div class="legend-item">
        <span class="legend-color v2x-range"></span>
        <span>V2X超视距范围</span>
      </div>
      <div class="legend-item">
        <span class="legend-color blind-spot"></span>
        <span>盲区遮挡</span>
      </div>
    </div>
    
    <!-- 场景信息 -->
    <div class="scene-info">
      <el-tag type="primary" effect="dark">{{ sceneName }}</el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { sceneConfigs } from '@/config/scenes.js'

const props = defineProps({
  currentScene: { type: String, default: 'city' },
  vehicleSpeed: { type: Number, default: 40 },
  vehicleDensity: { type: Number, default: 200 },
  simulationData: { type: Object, default: () => ({}) },
  warningLevel: { type: Number, default: 0 },
  collisionTriggered: { type: Boolean, default: false }
})

const emit = defineEmits(['collision-end'])

const containerRef = ref(null)
const canvasRef = ref(null)
const animationId = ref(null)
const ctx = ref(null)

const mainVehicle = ref(null)
const otherVehicles = ref([])
const blindSpots = ref([])
const v2xVehicles = ref([])

const animationState = ref({
  isRunning: false,
  collisionPlaying: false,
  collisionFrame: 0
})

const sceneName = computed(() => sceneConfigs[props.currentScene]?.name || '城市道路')
const sceneConfig = computed(() => sceneConfigs[props.currentScene] || sceneConfigs.city)

const initCanvas = () => {
  if (!containerRef.value || !canvasRef.value) return
  const container = containerRef.value
  const canvas = canvasRef.value
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  ctx.value = canvas.getContext('2d')
  initVehicles()
  startAnimation()
}

const initVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  mainVehicle.value = {
    x: canvas.width / 2 - 30,
    y: canvas.height * 0.7,
    width: 60,
    height: 30,
    speed: props.vehicleSpeed / 3.6,
    color: '#00d4ff',
    isMain: true
  }
  
  generateOtherVehicles()
  generateBlindSpots()
  generateV2xVehicles()
}

const generateOtherVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  otherVehicles.value = []
  const vehicleCount = Math.floor(props.vehicleDensity / 30) + 3
  
  for (let i = 0; i < vehicleCount; i++) {
    const lane = Math.floor(Math.random() * 4)
    const isOpposite = Math.random() > 0.5
    
    otherVehicles.value.push({
      x: Math.random() * canvas.width,
      y: lane * 80 + 100 + Math.random() * 40,
      width: 50 + Math.random() * 20,
      height: 25 + Math.random() * 10,
      speed: (props.vehicleSpeed / 3.6) * (0.8 + Math.random() * 0.4) * (isOpposite ? -1 : 1),
      color: getRandomVehicleColor(),
      isMain: false,
      isOpposite
    })
  }
}

const generateBlindSpots = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  blindSpots.value = []
  const config = sceneConfig.value
  
  if (config.blindSpots?.includes('building')) {
    blindSpots.value.push({
      type: 'building',
      x: canvas.width * 0.7,
      y: canvas.height * 0.3,
      width: 100,
      height: 150,
      color: 'rgba(100, 100, 120, 0.8)'
    })
  }
  
  if (config.blindSpots?.includes('frontVehicle')) {
    blindSpots.value.push({
      type: 'frontVehicle',
      x: canvas.width / 2 - 30,
      y: canvas.height * 0.5,
      width: 60,
      height: 30,
      color: 'rgba(150, 150, 170, 0.6)'
    })
  }
  
  if (config.blindSpots?.includes('heavyVehicle')) {
    blindSpots.value.push({
      type: 'heavyVehicle',
      x: canvas.width / 2 - 40,
      y: canvas.height * 0.45,
      width: 80,
      height: 40,
      color: 'rgba(80, 80, 100, 0.8)'
    })
  }
  
  if (config.blindSpots?.includes('curve')) {
    blindSpots.value.push({
      type: 'curve',
      x: canvas.width * 0.6,
      y: canvas.height * 0.2,
      radius: 100,
      angle: Math.PI / 3,
      color: 'rgba(60, 60, 80, 0.6)'
    })
  }
  
  if (config.blindSpots?.includes('tunnel')) {
    blindSpots.value.push({
      type: 'tunnel',
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      color: 'rgba(20, 20, 40, 0.4)'
    })
  }
}

const generateV2xVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  v2xVehicles.value = []
  
  blindSpots.value.forEach(spot => {
    if (Math.random() > 0.5) {
      v2xVehicles.value.push({
        x: spot.x + spot.width / 2 + Math.random() * 50,
        y: spot.y - spot.height / 2,
        width: 45,
        height: 22,
        speed: props.vehicleSpeed / 3.6 * 0.7,
        color: '#2ed573',
        isV2xVisible: true
      })
    }
  })
}

const getRandomVehicleColor = () => {
  const colors = ['#6c757d', '#495057', '#868e96', '#adb5bd', '#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7']
  return colors[Math.floor(Math.random() * colors.length)]
}

const draw = () => {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return
  
  context.clearRect(0, 0, canvas.width, canvas.height)
  drawBackground(context, canvas)
  drawRoad(context, canvas)
  drawBlindSpots(context, canvas)
  drawV2xRange(context, canvas)
  drawV2xVehicles(context, canvas)
  drawOtherVehicles(context, canvas)
  drawMainVehicle(context, canvas)
  if (props.warningLevel > 0) drawWarningEffect(context, canvas)
}

const drawBackground = (ctx, canvas) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#0a0e27')
  gradient.addColorStop(1, '#151a3d')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  if (props.currentScene === 'tunnel') {
    drawTunnelBackground(ctx, canvas)
  } else if (props.currentScene === 'city') {
    drawCityBackground(ctx, canvas)
  }
}

const drawTunnelBackground = (ctx, canvas) => {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, 80)
  
  for (let i = 0; i < canvas.width; i += 100) {
    ctx.beginPath()
    ctx.arc(i + 50, 40, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
    ctx.fill()
    
    const glow = ctx.createRadialGradient(i + 50, 40, 0, i + 50, 40, 30)
    glow.addColorStop(0, 'rgba(255, 200, 100, 0.3)')
    glow.addColorStop(1, 'rgba(255, 200, 100, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(i + 20, 10, 60, 60)
  }
}

const drawCityBackground = (ctx, canvas) => {
  const buildings = [
    { x: 50, y: 50, w: 80, h: 200 },
    { x: 180, y: 30, w: 100, h: 250 },
    { x: 350, y: 70, w: 70, h: 180 },
    { x: canvas.width - 200, y: 40, w: 90, h: 220 },
    { x: canvas.width - 80, y: 60, w: 70, h: 190 }
  ]
  
  buildings.forEach(b => {
    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)'
    ctx.fillRect(b.x, b.y, b.w, b.h)
    
    ctx.fillStyle = 'rgba(255, 220, 100, 0.3)'
    for (let row = 0; row < b.h - 20; row += 30) {
      for (let col = 10; col < b.w - 10; col += 25) {
        if (Math.random() > 0.3) {
          ctx.fillRect(b.x + col, b.y + row + 10, 15, 20)
        }
      }
    }
  })
}

const drawRoad = (ctx, canvas) => {
  const config = sceneConfig.value
  ctx.fillStyle = '#2d2d3a'
  
  if (config.roadLayout === 'crossroad') {
    ctx.fillRect(canvas.width * 0.2, 0, canvas.width * 0.6, canvas.height)
    ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height * 0.3)
  } else if (config.roadLayout === 'curve') {
    ctx.beginPath()
    ctx.moveTo(canvas.width * 0.3, canvas.height)
    ctx.quadraticCurveTo(canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.9, 0)
    ctx.lineTo(canvas.width * 0.7, 0)
    ctx.quadraticCurveTo(canvas.width * 0.4, canvas.height * 0.3, canvas.width * 0.1, canvas.height)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillRect(canvas.width * 0.2, 0, canvas.width * 0.6, canvas.height)
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.setLineDash([20, 15])
  
  const lanes = config.roadConfig?.lanes || 4
  for (let i = 1; i < lanes; i++) {
    const x = canvas.width * 0.2 + (canvas.width * 0.6 / lanes) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
}

const drawBlindSpots = (ctx, canvas) => {
  blindSpots.value.forEach(spot => {
    ctx.fillStyle = spot.color
    
    if (spot.type === 'building') {
      ctx.fillRect(spot.x, spot.y, spot.width, spot.height)
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(spot.x - 10, spot.y - 10, spot.width + 20, spot.height + 20)
      ctx.setLineDash([])
    } else if (spot.type === 'frontVehicle' || spot.type === 'heavyVehicle') {
      ctx.fillRect(spot.x, spot.y, spot.width, spot.height)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.beginPath()
      ctx.moveTo(spot.x, spot.y)
      ctx.lineTo(spot.x - spot.width * 0.5, spot.y - spot.height * 2)
      ctx.lineTo(spot.x + spot.width * 1.5, spot.y - spot.height * 2)
      ctx.closePath()
      ctx.fill()
    } else if (spot.type === 'curve') {
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, spot.radius, 0, spot.angle)
      ctx.lineTo(spot.x, spot.y)
      ctx.closePath()
      ctx.fill()
    }
  })
}

const drawV2xRange = (ctx, canvas) => {
  if (!mainVehicle.value) return
  const main = mainVehicle.value
  const v2xRange = 250
  
  ctx.strokeStyle = 'rgba(46, 213, 115, 0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 5])
  
  ctx.beginPath()
  ctx.moveTo(main.x + main.width / 2, main.y + main.height / 2)
  ctx.arc(main.x + main.width / 2, main.y + main.height / 2, v2xRange, -Math.PI * 0.8, -Math.PI * 0.2)
  ctx.closePath()
  ctx.stroke()
  
  ctx.fillStyle = 'rgba(46, 213, 115, 0.05)'
  ctx.fill()
  ctx.setLineDash([])
  
  ctx.font = '12px Microsoft YaHei'
  ctx.fillStyle = '#2ed573'
  ctx.fillText('V2X超视距感知范围', main.x + main.width / 2 - 60, main.y - v2xRange - 10)
}

const drawV2xVehicles = (ctx, canvas) => {
  v2xVehicles.value.forEach(vehicle => {
    ctx.fillStyle = 'rgba(46, 213, 115, 0.3)'
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height)
    
    ctx.strokeStyle = '#2ed573'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(vehicle.x - 2, vehicle.y - 2, vehicle.width + 4, vehicle.height + 4)
    ctx.setLineDash([])
    
    ctx.font = '10px Microsoft YaHei'
    ctx.fillStyle = '#2ed573'
    ctx.fillText('V2X', vehicle.x + 10, vehicle.y - 5)
  })
}

const drawOtherVehicles = (ctx, canvas) => {
  otherVehicles.value.forEach(vehicle => {
    ctx.fillStyle = vehicle.color
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height)
    
    ctx.fillStyle = 'rgba(100, 150, 200, 0.6)'
    ctx.fillRect(vehicle.x + 5, vehicle.y + 3, vehicle.width - 10, vehicle.height * 0.4)
    
    ctx.fillStyle = vehicle.isOpposite ? '#ff6b6b' : '#ffd43b'
    const lightX = vehicle.isOpposite ? vehicle.x + vehicle.width - 5 : vehicle.x
    ctx.fillRect(lightX, vehicle.y + 5, 3, 3)
    ctx.fillRect(lightX, vehicle.y + vehicle.height - 8, 3, 3)
  })
}

const drawMainVehicle = (ctx, canvas) => {
  if (!mainVehicle.value) return
  const main = mainVehicle.value
  
  const glow = ctx.createRadialGradient(
    main.x + main.width / 2, main.y + main.height / 2, 0,
    main.x + main.width / 2, main.y + main.height / 2, main.width
  )
  glow.addColorStop(0, 'rgba(0, 212, 255, 0.3)')
  glow.addColorStop(1, 'rgba(0, 212, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(main.x - main.width / 2, main.y - main.height / 2, main.width * 2, main.height * 2)
  
  ctx.fillStyle = main.color
  ctx.fillRect(main.x, main.y, main.width, main.height)
  
  ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
  ctx.fillRect(main.x + 8, main.y + 4, main.width - 16, main.height * 0.35)
  
  ctx.fillStyle = '#00ff88'
  ctx.fillRect(main.x + 3, main.y + 5, 4, 4)
  ctx.fillRect(main.x + 3, main.y + main.height - 9, 4, 4)
  ctx.fillRect(main.x + main.width - 7, main.y + 5, 4, 4)
  ctx.fillRect(main.x + main.width - 7, main.y + main.height - 9, 4, 4)
  
  ctx.font = 'bold 12px Microsoft YaHei'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('主车', main.x + main.width / 2, main.y + main.height + 15)
  ctx.textAlign = 'left'
}

const drawWarningEffect = (ctx, canvas) => {
  if (props.warningLevel === 1) {
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.6)'
    ctx.lineWidth = 4
    ctx.setLineDash([10, 5])
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    ctx.setLineDash([])
  } else if (props.warningLevel === 2) {
    ctx.fillStyle = `rgba(255, 71, 87, ${0.1 + Math.sin(Date.now() / 200) * 0.05})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

const startAnimation = () => {
  if (animationState.value.isRunning) return
  animationState.value.isRunning = true
  animate()
}

const stopAnimation = () => {
  animationState.value.isRunning = false
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

const animate = () => {
  if (!animationState.value.isRunning) return
  if (!props.collisionTriggered) updateVehicles()
  draw()
  animationId.value = requestAnimationFrame(animate)
}

const updateVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  otherVehicles.value.forEach(vehicle => {
    vehicle.x += vehicle.speed * 0.5
    if (vehicle.x > canvas.width + vehicle.width) vehicle.x = -vehicle.width
    else if (vehicle.x < -vehicle.width) vehicle.x = canvas.width + vehicle.width
  })
  
  v2xVehicles.value.forEach(vehicle => {
    vehicle.x += vehicle.speed * 0.3
  })
}

const resetAnimation = () => {
  stopAnimation()
  initVehicles()
  startAnimation()
}

const handleResize = () => {
  if (containerRef.value && canvasRef.value) {
    canvasRef.value.width = containerRef.value.clientWidth
    canvasRef.value.height = containerRef.value.clientHeight
    initVehicles()
  }
}

onMounted(() => {
  nextTick(() => initCanvas())
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAnimation()
  window.removeEventListener('resize', handleResize)
})

watch(() => props.vehicleSpeed, (newSpeed) => {
  if (mainVehicle.value) mainVehicle.value.speed = newSpeed / 3.6
})

watch(() => props.vehicleDensity, () => generateOtherVehicles())

watch(() => props.currentScene, () => {
  generateBlindSpots()
  generateV2xVehicles()
})

defineExpose({ resetAnimation })
</script>

<style lang="scss" scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: $bg-dark;
}

.main-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.legend {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(10, 14, 39, 0.85);
  border: 1px solid $border-color;
  border-radius: $radius-md;
  backdrop-filter: blur(10px);
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: $text-secondary;
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      
      &.main-vehicle { background: $primary-color; }
      &.other-vehicle { background: #6c757d; }
      &.v2x-range { background: rgba(46, 213, 115, 0.5); border: 2px dashed $success-color; }
      &.blind-spot { background: rgba(255, 71, 87, 0.3); border: 1px solid $danger-color; }
    }
  }
}

.scene-info {
  position: absolute;
  top: 16px;
  right: 16px;
  
  :deep(.el-tag) {
    background: $gradient-primary;
    border: none;
    color: $text-primary;
    font-weight: 600;
    padding: 8px 16px;
  }
}
</style>
