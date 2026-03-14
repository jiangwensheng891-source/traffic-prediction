<!-- =====================================================
     主可视化画布组件 - 5G-V2X车联网可视化系统
     功能：车辆行驶动画、道路渲染、盲区可视化、碰撞动画
     增强版：赛车游戏风格、键盘控制、相向/相背行驶
     使用Canvas实现高性能动画渲染
     ===================================================== -->

<template>
  <div class="canvas-container" ref="containerRef" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <canvas ref="canvasRef" class="main-canvas"></canvas>
    
    <!-- 控制提示（默认隐藏，按H键显示） -->
    <div v-if="showControlHint" class="control-hint">
      <div class="hint-title">🎮 键盘控制</div>
      <div class="hint-keys">
        <div class="key-row">
          <div class="key" :class="{ pressed: keys.up }">↑</div>
          <span class="key-desc">加速</span>
        </div>
        <div class="key-row">
          <div class="key" :class="{ pressed: keys.left }">←</div>
          <div class="key" :class="{ pressed: keys.down }">↓</div>
          <div class="key" :class="{ pressed: keys.right }">→</div>
        </div>
        <div class="key-row">
          <span class="key-desc">左转</span>
          <span class="key-desc">减速</span>
          <span class="key-desc">右转</span>
        </div>
      </div>
      <div class="hint-close" @click="showControlHint = false">点击关闭提示</div>
    </div>
    
    <!-- 底部小控制提示 -->
    <div class="control-tip">
      <span>🎮 ↑加速 ↓减速 ←→变道 空格刹车</span>
    </div>
    
    <!-- 速度仪表盘 -->
    <div class="speedometer">
      <div class="speed-value">{{ Math.round(controlledSpeed) }}</div>
      <div class="speed-unit">km/h</div>
      <div class="speed-bar">
        <div class="speed-fill" :style="{ width: (controlledSpeed / 150) * 100 + '%' }"></div>
      </div>
      <div class="speed-gear">
        <span v-for="g in ['N', '1', '2', '3', '4', '5']" :key="g" :class="{ active: currentGear === g }">
          {{ g }}
        </span>
      </div>
    </div>
    
    <!-- 方向指示器 -->
    <div class="direction-indicator">
      <div class="dir-arrow left" :class="{ active: keys.left }">◀</div>
      <div class="dir-arrow up" :class="{ active: keys.up }">▲</div>
      <div class="dir-arrow down" :class="{ active: keys.down }">▼</div>
      <div class="dir-arrow right" :class="{ active: keys.right }">▶</div>
    </div>
    
    <!-- 小地图 -->
    <div class="mini-map">
      <div class="mini-road"></div>
      <div class="mini-main" :style="{ top: miniMapMainY + '%', left: miniMapMainX + '%' }"></div>
      <div 
        v-for="(v, i) in nearbyVehicles" 
        :key="'mini-' + i"
        class="mini-vehicle"
        :class="{ danger: v.isDanger }"
        :style="{ top: v.miniY + '%', left: v.miniX + '%' }"
      ></div>
    </div>
    
    <!-- 图例说明 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-color main-vehicle"></span>
        <span>主车（可控制）</span>
      </div>
      <div class="legend-item">
        <span class="legend-color same-direction"></span>
        <span>同向车辆</span>
      </div>
      <div class="legend-item">
        <span class="legend-color opposite-direction"></span>
        <span>对向车辆</span>
      </div>
      <div class="legend-item">
        <span class="legend-color v2x-range"></span>
        <span>V2X超视距感知</span>
      </div>
    </div>
    
    <!-- 场景信息 -->
    <div class="scene-info">
      <el-tag type="primary" effect="dark">{{ sceneName }}</el-tag>
    </div>
    
    <!-- 碰撞提示（小型，不挡视野） -->
    <transition name="collision-alert">
      <div v-if="showCollisionAlert" class="collision-alert-mini">
        <span class="alert-text">💥 碰撞！按 <kbd>R</kbd> 重置</span>
      </div>
    </transition>
    
    <!-- 得分/行驶距离 -->
    <div class="score-panel">
      <div class="score-item">
        <span class="score-label">行驶距离</span>
        <span class="score-value">{{ Math.floor(travelDistance) }}m</span>
      </div>
      <div class="score-item">
        <span class="score-label">最高速度</span>
        <span class="score-value">{{ maxSpeed }}km/h</span>
      </div>
      <div class="score-item">
        <span class="score-label">避让次数</span>
        <span class="score-value">{{ dodgeCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { sceneConfigs } from '@/config/scenes.js'

const props = defineProps({
  currentScene: { type: String, default: 'city' },
  vehicleSpeed: { type: Number, default: 40 },
  vehicleDensity: { type: Number, default: 200 },
  simulationData: { type: Object, default: () => ({}) },
  warningLevel: { type: Number, default: 0 },
  collisionTriggered: { type: Boolean, default: false }
})

const emit = defineEmits(['collision-end', 'speed-change'])

const containerRef = ref(null)
const canvasRef = ref(null)
const animationId = ref(null)
const ctx = ref(null)

// 车辆系统
const mainVehicle = ref(null)
const otherVehicles = ref([])
const roadLines = ref([])
const particles = ref([])
const nearbyVehicles = ref([])

// 键盘控制状态
const keys = reactive({
  up: false,
  down: false,
  left: false,
  right: false
})

// 控制相关状态
const controlledSpeed = ref(40) // 用户控制的速度
const targetLane = ref(1) // 目标车道 (0, 1, 2)
const currentGear = ref('N') // 当前档位
const showControlHint = ref(false) // 默认不显示控制提示

// 游戏统计
const travelDistance = ref(0) // 行驶距离
const maxSpeed = ref(40) // 最高速度
const dodgeCount = ref(0) // 避让次数

// 小地图位置
const miniMapMainX = ref(50)
const miniMapMainY = ref(60)

// 动画状态
const animationState = ref({
  isRunning: false,
  frame: 0,
  roadOffset: 0,
  collisionFrame: 0,
  lastTime: 0,
  gameLoop: 0
})

const showCollisionAlert = ref(false)

const sceneName = computed(() => sceneConfigs[props.currentScene]?.name || '城市道路')
const sceneConfig = computed(() => sceneConfigs[props.currentScene] || sceneConfigs.city)

// 道路配置
const roadConfig = computed(() => ({
  laneWidth: 80,
  lanes: 6,
  roadWidth: 480,
  centerX: 0
}))

// =====================================================
// 键盘控制
// =====================================================

const handleKeyDown = (e) => {
  if (showCollisionAlert.value) {
    // 碰撞后按R重置
    if (e.key.toLowerCase() === 'r') {
      resetGame()
    }
    return
  }
  
  switch(e.key) {
    case 'ArrowUp':
      keys.up = true
      e.preventDefault()
      break
    case 'ArrowDown':
      keys.down = true
      e.preventDefault()
      break
    case 'ArrowLeft':
      keys.left = true
      e.preventDefault()
      break
    case 'ArrowRight':
      keys.right = true
      e.preventDefault()
      break
    case ' ':
      // 空格键刹车
      keys.down = true
      e.preventDefault()
      break
  }
}

const handleKeyUp = (e) => {
  switch(e.key) {
    case 'ArrowUp':
      keys.up = false
      break
    case 'ArrowDown':
      keys.down = false
      break
    case 'ArrowLeft':
      keys.left = false
      break
    case 'ArrowRight':
      keys.right = false
      break
    case ' ':
      keys.down = false
      break
  }
}

// 更新控制状态
const updateControls = () => {
  if (!mainVehicle.value) return
  
  // 加速/减速
  if (keys.up) {
    controlledSpeed.value = Math.min(controlledSpeed.value + 0.8, 150)
  } else if (keys.down) {
    controlledSpeed.value = Math.max(controlledSpeed.value - 1.2, 0)
  } else {
    // 自然减速（模拟摩擦力）
    if (controlledSpeed.value > props.vehicleSpeed) {
      controlledSpeed.value -= 0.2
    } else if (controlledSpeed.value < props.vehicleSpeed && controlledSpeed.value > 5) {
      controlledSpeed.value += 0.1
    }
  }
  
  // 更新最高速度记录
  if (controlledSpeed.value > maxSpeed.value) {
    maxSpeed.value = Math.round(controlledSpeed.value)
  }
  
  // 更新档位
  if (controlledSpeed.value < 5) currentGear.value = 'N'
  else if (controlledSpeed.value < 30) currentGear.value = '1'
  else if (controlledSpeed.value < 50) currentGear.value = '2'
  else if (controlledSpeed.value < 70) currentGear.value = '3'
  else if (controlledSpeed.value < 100) currentGear.value = '4'
  else currentGear.value = '5'
  
  // 左右移动（变道）
  const canvas = canvasRef.value
  if (!canvas) return
  
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  const moveSpeed = 8
  
  // 计算左右边界（同向车道范围）
  const leftBound = centerX - laneWidth * 3 + 20
  const rightBound = centerX - 20 - mainVehicle.value.width
  
  if (keys.left && mainVehicle.value.x > leftBound) {
    mainVehicle.value.x -= moveSpeed
    mainVehicle.value.tilt = -0.1 // 左倾
  } else if (keys.right && mainVehicle.value.x < rightBound) {
    mainVehicle.value.x += moveSpeed
    mainVehicle.value.tilt = 0.1 // 右倾
  } else {
    mainVehicle.value.tilt = 0 // 恢复
  }
  
  // 更新小地图位置
  miniMapMainX.value = ((mainVehicle.value.x - leftBound) / (rightBound - leftBound)) * 30 + 35
  
  // 通知父组件速度变化
  emit('speed-change', Math.round(controlledSpeed.value))
}

// =====================================================
// 初始化
// =====================================================

const initCanvas = () => {
  if (!containerRef.value || !canvasRef.value) return
  const container = containerRef.value
  const canvas = canvasRef.value
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  ctx.value = canvas.getContext('2d')
  
  initRoadLines()
  initMainVehicle()
  initOtherVehicles()
  initParticles()
  startAnimation()
  
  // 聚焦容器以接收键盘事件
  containerRef.value.focus()
}

// 初始化道路标线
const initRoadLines = () => {
  roadLines.value = []
  const canvas = canvasRef.value
  if (!canvas) return
  
  for (let y = -100; y < canvas.height + 100; y += 80) {
    roadLines.value.push({ y, type: 'dashed' })
  }
}

// 初始化主车（用户视角）
const initMainVehicle = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  
  mainVehicle.value = {
    x: centerX - laneWidth * 1.5, // 中间车道
    y: canvas.height * 0.7,
    width: 60,
    height: 100,
    lane: 1,
    speed: controlledSpeed.value,
    color: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    tilt: 0, // 倾斜角度（变道时）
    trail: [],
    headlights: true
  }
  
  // 重置统计
  travelDistance.value = 0
  maxSpeed.value = 40
  dodgeCount.value = 0
  controlledSpeed.value = props.vehicleSpeed
}

// 初始化其他车辆
const initOtherVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  otherVehicles.value = []
  nearbyVehicles.value = []
  
  const vehicleCount = Math.min(Math.floor(props.vehicleDensity / 15) + 5, 25)
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  
  for (let i = 0; i < vehicleCount; i++) {
    const isOpposite = i < vehicleCount / 2
    const lane = isOpposite 
      ? Math.floor(Math.random() * 3) + 3
      : Math.floor(Math.random() * 3)
    
    const laneX = centerX - (laneWidth * 3) + (lane * laneWidth) + laneWidth / 2 - 25
    
    const vehicle = {
      id: i,
      x: laneX,
      y: Math.random() * canvas.height * 3 - canvas.height * 1.5,
      width: 50 + Math.random() * 15,
      height: 80 + Math.random() * 20,
      lane,
      speed: props.vehicleSpeed * (0.7 + Math.random() * 0.6),
      color: getRandomVehicleColor(isOpposite),
      isOpposite,
      type: isOpposite ? 'opposite' : 'same',
      trail: [],
      braking: false,
      isDanger: false,
      miniX: (lane / 6) * 100,
      miniY: 0,
      passed: false // 是否已经通过主车
    }
    
    otherVehicles.value.push(vehicle)
  }
}

// 初始化粒子系统
const initParticles = () => {
  particles.value = []
}

// 获取随机车辆颜色
const getRandomVehicleColor = (isOpposite) => {
  if (isOpposite) {
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#d35400', '#c0392b', '#ff6b6b', '#ff8c42']
    return colors[Math.floor(Math.random() * colors.length)]
  } else {
    const colors = ['#3498db', '#2ecc71', '#1abc9c', '#9b59b6', '#34495e', '#95a5a6', '#5dade2']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

// =====================================================
// 绘制函数
// =====================================================

const draw = () => {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return
  
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  drawBackground(context, canvas)
  drawRoad(context, canvas)
  drawRoadLines(context, canvas)
  drawBlindSpots(context, canvas)
  drawV2xRange(context, canvas)
  drawParticles(context, canvas)
  drawOtherVehicles(context, canvas)
  drawMainVehicle(context, canvas)
  drawSpeedLines(context, canvas)
  
  if (props.warningLevel > 0) {
    drawWarningEffect(context, canvas)
  }
  
  if (showCollisionAlert.value) {
    drawCollisionEffect(context, canvas)
  }
}

// 绘制背景
const drawBackground = (ctx, canvas) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#0a0e27')
  gradient.addColorStop(0.5, '#151a3d')
  gradient.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  if (props.currentScene === 'tunnel') {
    drawTunnelEffect(ctx, canvas)
  } else if (props.currentScene === 'city') {
    drawCityBuildings(ctx, canvas)
  } else if (props.currentScene === 'highway') {
    drawHighwayScenery(ctx, canvas)
  }
}

// 隧道效果
const drawTunnelEffect = (ctx, canvas) => {
  ctx.fillStyle = '#0d0d15'
  ctx.fillRect(0, 0, canvas.width, 100)
  
  for (let i = 0; i < canvas.width; i += 120) {
    const glow = ctx.createRadialGradient(i + 60, 50, 0, i + 60, 50, 60)
    glow.addColorStop(0, 'rgba(255, 200, 100, 0.4)')
    glow.addColorStop(0.5, 'rgba(255, 200, 100, 0.1)')
    glow.addColorStop(1, 'rgba(255, 200, 100, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(i, 0, 120, 100)
    
    ctx.beginPath()
    ctx.arc(i + 60, 30, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd93d'
    ctx.fill()
  }
}

// 城市建筑
const drawCityBuildings = (ctx, canvas) => {
  const buildings = [
    { x: 0, y: 0, w: 120, h: canvas.height * 0.4 },
    { x: canvas.width - 150, y: 0, w: 150, h: canvas.height * 0.45 },
    { x: 50, y: canvas.height * 0.5, w: 80, h: canvas.height * 0.3 },
    { x: canvas.width - 200, y: canvas.height * 0.55, w: 100, h: canvas.height * 0.25 }
  ]
  
  buildings.forEach(b => {
    ctx.fillStyle = 'rgba(20, 20, 40, 0.9)'
    ctx.fillRect(b.x, b.y, b.w, b.h)
    
    ctx.fillStyle = 'rgba(255, 220, 100, 0.15)'
    for (let row = 20; row < b.h - 20; row += 35) {
      for (let col = 15; col < b.w - 15; col += 30) {
        if (Math.random() > 0.3) {
          ctx.fillRect(b.x + col, b.y + row, 18, 25)
        }
      }
    }
  })
}

// 高速公路风景
const drawHighwayScenery = (ctx, canvas) => {
  ctx.fillStyle = 'rgba(30, 40, 60, 0.5)'
  ctx.beginPath()
  ctx.moveTo(0, canvas.height * 0.3)
  ctx.lineTo(canvas.width * 0.2, canvas.height * 0.15)
  ctx.lineTo(canvas.width * 0.4, canvas.height * 0.25)
  ctx.lineTo(canvas.width * 0.6, canvas.height * 0.1)
  ctx.lineTo(canvas.width * 0.8, canvas.height * 0.2)
  ctx.lineTo(canvas.width, canvas.height * 0.15)
  ctx.lineTo(canvas.width, canvas.height * 0.3)
  ctx.closePath()
  ctx.fill()
}

// 绘制道路
const drawRoad = (ctx, canvas) => {
  const centerX = canvas.width / 2
  const roadWidth = roadConfig.value.roadWidth
  
  // 道路主体
  ctx.fillStyle = '#2a2a35'
  ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, canvas.height)
  
  // 道路边缘（红白条纹）
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor(y / 20) % 2 === 0) ? '#ff4757' : '#ffffff'
    ctx.fillRect(centerX - roadWidth / 2, y, 5, 20)
    ctx.fillRect(centerX + roadWidth / 2 - 5, y, 5, 20)
  }
  
  // 中央隔离带
  ctx.fillStyle = '#1a1a25'
  ctx.fillRect(centerX - 5, 0, 10, canvas.height)
  
  // 中央双黄线
  ctx.strokeStyle = '#ffd93d'
  ctx.lineWidth = 3
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(centerX - 8, 0)
  ctx.lineTo(centerX - 8, canvas.height)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(centerX + 8, 0)
  ctx.lineTo(centerX + 8, canvas.height)
  ctx.stroke()
}

// 绘制道路标线（动态移动）
const drawRoadLines = (ctx, canvas) => {
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 3
  ctx.setLineDash([40, 30])
  
  // 更新标线位置（根据控制速度）
  animationState.value.roadOffset += controlledSpeed.value * 0.2
  
  // 左侧车道线（同向）
  for (let i = 1; i < 3; i++) {
    const x = centerX - (laneWidth * 3) + (i * laneWidth)
    ctx.beginPath()
    ctx.moveTo(x, -100 + (animationState.value.roadOffset % 70))
    for (let y = -100; y < canvas.height + 100; y += 70) {
      ctx.lineTo(x, y + (animationState.value.roadOffset % 70))
    }
    ctx.stroke()
  }
  
  // 右侧车道线（对向）
  for (let i = 1; i < 3; i++) {
    const x = centerX + (i * laneWidth)
    ctx.beginPath()
    ctx.moveTo(x, -100 - (animationState.value.roadOffset % 70))
    for (let y = -100; y < canvas.height + 100; y += 70) {
      ctx.lineTo(x, y - (animationState.value.roadOffset % 70))
    }
    ctx.stroke()
  }
  
  ctx.setLineDash([])
}

// 绘制盲区
const drawBlindSpots = (ctx, canvas) => {
  const config = sceneConfig.value
  if (!config.blindSpots?.length) return
  
  const main = mainVehicle.value
  if (!main) return
  
  // 前车遮挡盲区
  if (config.blindSpots.includes('frontVehicle')) {
    const frontVehicles = otherVehicles.value.filter(v => 
      !v.isOpposite && v.y < main.y && v.y > main.y - 300
    )
    
    frontVehicles.forEach(v => {
      ctx.fillStyle = 'rgba(255, 71, 87, 0.15)'
      ctx.beginPath()
      ctx.moveTo(v.x + v.width / 2, v.y + v.height)
      ctx.lineTo(v.x - 50, main.y)
      ctx.lineTo(v.x + v.width + 50, main.y)
      ctx.closePath()
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.stroke()
      ctx.setLineDash([])
    })
  }
  
  // 弯道盲区
  if (config.blindSpots.includes('curve')) {
    ctx.fillStyle = 'rgba(255, 71, 87, 0.1)'
    ctx.beginPath()
    ctx.arc(canvas.width * 0.7, canvas.height * 0.3, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 5])
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.font = '12px Microsoft YaHei'
    ctx.fillStyle = '#ff4757'
    ctx.fillText('弯道盲区', canvas.width * 0.7 - 25, canvas.height * 0.3 - 160)
  }
}

// 绘制V2X超视距范围
const drawV2xRange = (ctx, canvas) => {
  if (!mainVehicle.value) return
  const main = mainVehicle.value
  
  const v2xRange = 350
  const centerX = main.x + main.width / 2
  const centerY = main.y + main.height / 2
  
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.arc(centerX, centerY, v2xRange, -Math.PI * 0.75, -Math.PI * 0.25)
  ctx.closePath()
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, v2xRange)
  gradient.addColorStop(0, 'rgba(46, 213, 115, 0.05)')
  gradient.addColorStop(0.7, 'rgba(46, 213, 115, 0.02)')
  gradient.addColorStop(1, 'rgba(46, 213, 115, 0)')
  ctx.fillStyle = gradient
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(46, 213, 115, 0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([15, 8])
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.font = 'bold 13px Microsoft YaHei'
  ctx.fillStyle = '#2ed573'
  ctx.textAlign = 'center'
  ctx.fillText('V2X超视距感知', centerX, main.y - v2xRange - 15)
  ctx.fillText(`${v2xRange}m`, centerX, main.y - v2xRange + 5)
  ctx.textAlign = 'left'
  
  // 显示V2X感知到的车辆
  otherVehicles.value.forEach(vehicle => {
    const dx = (vehicle.x + vehicle.width / 2) - centerX
    const dy = (vehicle.y + vehicle.height / 2) - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < v2xRange && vehicle.y < main.y) {
      ctx.strokeStyle = '#2ed573'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(vehicle.x - 8, vehicle.y - 8, vehicle.width + 16, vehicle.height + 16)
      ctx.setLineDash([])
      
      ctx.font = '10px Microsoft YaHei'
      ctx.fillStyle = '#2ed573'
      ctx.textAlign = 'center'
      ctx.fillText('V2X', vehicle.x + vehicle.width / 2, vehicle.y - 12)
      ctx.textAlign = 'left'
    }
  })
}

// 绘制粒子效果
const drawParticles = (ctx, canvas) => {
  if (mainVehicle.value && controlledSpeed.value > 20 && Math.random() > 0.3) {
    particles.value.push({
      x: mainVehicle.value.x + mainVehicle.value.width / 2 + (Math.random() - 0.5) * 20,
      y: mainVehicle.value.y + mainVehicle.value.height,
      vx: (Math.random() - 0.5) * 2,
      vy: controlledSpeed.value * 0.15 + Math.random() * 2,
      life: 1,
      size: Math.random() * 3 + 1
    })
  }
  
  particles.value = particles.value.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    p.size *= 0.98
    
    if (p.life > 0) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(150, 150, 180, ${p.life * 0.3})`
      ctx.fill()
      return true
    }
    return false
  })
}

// 绘制其他车辆（赛车风格）
const drawOtherVehicles = (ctx, canvas) => {
  otherVehicles.value.forEach(vehicle => {
    const isDanger = vehicle.isDanger
    
    // 车辆阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(vehicle.x + 5, vehicle.y + 5, vehicle.width, vehicle.height)
    
    // 车辆主体
    const gradient = ctx.createLinearGradient(vehicle.x, vehicle.y, vehicle.x + vehicle.width, vehicle.y)
    gradient.addColorStop(0, vehicle.color)
    gradient.addColorStop(0.5, lightenColor(vehicle.color, 20))
    gradient.addColorStop(1, vehicle.color)
    ctx.fillStyle = gradient
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height)
    
    // 车顶
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(vehicle.x + 8, vehicle.y + 15, vehicle.width - 16, vehicle.height - 35)
    
    // 前挡风玻璃
    ctx.fillStyle = vehicle.isOpposite ? 'rgba(100, 150, 200, 0.6)' : 'rgba(80, 130, 180, 0.6)'
    if (vehicle.isOpposite) {
      ctx.fillRect(vehicle.x + 8, vehicle.y + vehicle.height - 25, vehicle.width - 16, 18)
    } else {
      ctx.fillRect(vehicle.x + 8, vehicle.y + 8, vehicle.width - 16, 18)
    }
    
    // 车灯
    if (vehicle.isOpposite) {
      ctx.fillStyle = isDanger ? '#ff4757' : '#ffd93d'
      ctx.shadowColor = isDanger ? '#ff4757' : '#ffd93d'
      ctx.shadowBlur = isDanger ? 20 : 15
      
      ctx.beginPath()
      ctx.arc(vehicle.x + 10, vehicle.y + 8, isDanger ? 7 : 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(vehicle.x + vehicle.width - 10, vehicle.y + 8, isDanger ? 7 : 5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowBlur = 0
    } else {
      ctx.fillStyle = '#ff4757'
      ctx.shadowColor = '#ff4757'
      ctx.shadowBlur = 10
      
      ctx.fillRect(vehicle.x + 5, vehicle.y + vehicle.height - 8, 6, 4)
      ctx.fillRect(vehicle.x + vehicle.width - 11, vehicle.y + vehicle.height - 8, 6, 4)
      
      ctx.shadowBlur = 0
    }
    
    // 危险标记
    if (isDanger) {
      ctx.strokeStyle = '#ff4757'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 3])
      ctx.strokeRect(vehicle.x - 5, vehicle.y - 5, vehicle.width + 10, vehicle.height + 10)
      ctx.setLineDash([])
      
      // 危险标识
      ctx.font = 'bold 14px Arial'
      ctx.fillStyle = '#ff4757'
      ctx.textAlign = 'center'
      ctx.fillText('!', vehicle.x + vehicle.width / 2, vehicle.y - 15)
      ctx.textAlign = 'left'
    }
    
    // 车辆尾迹
    if (!vehicle.isOpposite && controlledSpeed.value > 30) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(
          vehicle.x + 5, 
          vehicle.y + vehicle.height + i * 12, 
          vehicle.width - 10, 
          2
        )
      }
    }
  })
  
  updateMiniMap()
}

// 绘制主车（带倾斜效果）
const drawMainVehicle = (ctx, canvas) => {
  if (!mainVehicle.value) return
  const main = mainVehicle.value
  
  ctx.save()
  
  // 应用倾斜（变道效果）
  if (main.tilt !== 0) {
    ctx.translate(main.x + main.width / 2, main.y + main.height / 2)
    ctx.rotate(main.tilt)
    ctx.translate(-(main.x + main.width / 2), -(main.y + main.height / 2))
  }
  
  // 车辆发光效果（根据速度变化）
  const glowIntensity = Math.min(controlledSpeed.value / 100, 1)
  const glow = ctx.createRadialGradient(
    main.x + main.width / 2, main.y + main.height / 2, 0,
    main.x + main.width / 2, main.y + main.height / 2, main.width * 1.5
  )
  glow.addColorStop(0, `rgba(0, 212, 255, ${0.3 * glowIntensity})`)
  glow.addColorStop(0.5, `rgba(0, 212, 255, ${0.1 * glowIntensity})`)
  glow.addColorStop(1, 'rgba(0, 212, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(
    main.x - main.width, 
    main.y - main.height, 
    main.width * 3, 
    main.height * 3
  )
  
  // 车辆阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillRect(main.x + 8, main.y + 8, main.width, main.height)
  
  // 车身主体渐变
  const bodyGradient = ctx.createLinearGradient(main.x, main.y, main.x + main.width, main.y)
  bodyGradient.addColorStop(0, '#0099cc')
  bodyGradient.addColorStop(0.3, '#00d4ff')
  bodyGradient.addColorStop(0.7, '#00d4ff')
  bodyGradient.addColorStop(1, '#0099cc')
  ctx.fillStyle = bodyGradient
  ctx.fillRect(main.x, main.y, main.width, main.height)
  
  // 车顶
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fillRect(main.x + 10, main.y + 20, main.width - 20, main.height - 45)
  
  // 前挡风玻璃
  ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
  ctx.fillRect(main.x + 10, main.y + 10, main.width - 20, 25)
  
  // 后挡风玻璃
  ctx.fillStyle = 'rgba(80, 180, 230, 0.4)'
  ctx.fillRect(main.x + 10, main.y + main.height - 30, main.width - 20, 20)
  
  // 前大灯
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#00ffff'
  ctx.shadowBlur = 20 + controlledSpeed.value * 0.1
  ctx.fillRect(main.x + 5, main.y + 5, 12, 8)
  ctx.fillRect(main.x + main.width - 17, main.y + 5, 12, 8)
  
  // 尾灯
  ctx.fillStyle = '#ff4757'
  ctx.shadowColor = '#ff4757'
  ctx.shadowBlur = keys.down ? 25 : 10 // 刹车时尾灯更亮
  ctx.fillRect(main.x + 5, main.y + main.height - 10, 10, 6)
  ctx.fillRect(main.x + main.width - 15, main.y + main.height - 10, 10, 6)
  
  ctx.shadowBlur = 0
  
  // 车身装饰线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(main.x + 5, main.y + main.height / 2)
  ctx.lineTo(main.x + main.width - 5, main.y + main.height / 2)
  ctx.stroke()
  
  // 车牌
  ctx.fillStyle = '#004466'
  ctx.fillRect(main.x + 12, main.y + main.height - 18, main.width - 24, 12)
  ctx.font = 'bold 8px Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('V2X-AI', main.x + main.width / 2, main.y + main.height - 10)
  ctx.textAlign = 'left'
  
  // 主车标签
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.fillStyle = '#00d4ff'
  ctx.textAlign = 'center'
  ctx.fillText('主车', main.x + main.width / 2, main.y - 15)
  ctx.textAlign = 'left'
  
  ctx.restore()
}

// 绘制速度线条
const drawSpeedLines = (ctx, canvas) => {
  if (controlledSpeed.value < 60) return
  
  const lineCount = Math.floor((controlledSpeed.value - 60) / 10)
  const alpha = Math.min((controlledSpeed.value - 60) / 90, 0.4)
  
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
  ctx.lineWidth = 1
  
  for (let i = 0; i < lineCount; i++) {
    const x = Math.random() * canvas.width
    const length = 50 + Math.random() * 100 + controlledSpeed.value * 0.5
    
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, length)
    ctx.stroke()
  }
}

// 绘制预警效果
const drawWarningEffect = (ctx, canvas) => {
  if (props.warningLevel === 1) {
    const alpha = 0.3 + Math.sin(Date.now() / 300) * 0.2
    ctx.strokeStyle = `rgba(255, 165, 2, ${alpha})`
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
  } else if (props.warningLevel === 2) {
    const alpha = 0.1 + Math.sin(Date.now() / 150) * 0.1
    ctx.fillStyle = `rgba(255, 71, 87, ${alpha})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

// 绘制碰撞效果
const drawCollisionEffect = (ctx, canvas) => {
  animationState.value.collisionFrame++
  const frame = animationState.value.collisionFrame
  
  if (frame < 30) {
    const alpha = Math.sin(frame / 5) * 0.5
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(alpha)})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  if (frame > 10 && frame < 60) {
    for (let i = 0; i < 20; i++) {
      const x = canvas.width / 2 + (Math.random() - 0.5) * 300
      const y = canvas.height / 2 + (Math.random() - 0.5) * 200
      const size = Math.random() * 15 + 5
      
      ctx.fillStyle = `rgba(255, 100, 50, ${1 - frame / 60})`
      ctx.fillRect(x, y, size, size)
    }
  }
  
  if (frame > 20) {
    for (let i = 0; i < 10; i++) {
      const x = canvas.width / 2 + (Math.random() - 0.5) * 100
      const y = canvas.height / 2 + (Math.random() - 0.5) * 80
      const radius = Math.random() * 30 + 10
      
      const fireGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      fireGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)')
      fireGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)')
      fireGradient.addColorStop(1, 'rgba(255, 50, 0, 0)')
      
      ctx.fillStyle = fireGradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// =====================================================
// 更新函数
// =====================================================

const updateVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const main = mainVehicle.value
  const speedFactor = controlledSpeed.value / 50
  
  // 更新行驶距离
  travelDistance.value += controlledSpeed.value * 0.01
  
  // 更新其他车辆位置
  otherVehicles.value.forEach(vehicle => {
    const relativeSpeed = vehicle.isOpposite 
      ? (controlledSpeed.value + vehicle.speed)
      : (vehicle.speed - controlledSpeed.value)
    
    vehicle.y += relativeSpeed * 0.08 * speedFactor
    
    // 重置出界车辆
    if (vehicle.isOpposite) {
      if (vehicle.y > canvas.height + 150) {
        vehicle.y = -200 - Math.random() * 100
        vehicle.x = getRandomLaneX(vehicle.isOpposite)
        vehicle.speed = controlledSpeed.value * (0.7 + Math.random() * 0.6)
        vehicle.passed = false
      }
    } else {
      if (vehicle.y < -200) {
        vehicle.y = canvas.height + 150 + Math.random() * 100
        vehicle.x = getRandomLaneX(vehicle.isOpposite)
        vehicle.speed = controlledSpeed.value * (0.7 + Math.random() * 0.6)
        vehicle.passed = false
      }
    }
    
    // 检测危险（距离主车太近）- 同向车辆
    if (main && !vehicle.isOpposite) {
      const dx = Math.abs(vehicle.x - main.x)
      const dy = vehicle.y - main.y
      
      // 碰撞检测
      if (dx < main.width - 10 && dy > -main.height && dy < vehicle.height) {
        // 发生碰撞！
        if (dy > -main.height && dy < main.height * 0.5) {
          triggerCollision()
        }
      }
      
      // 危险警告
      vehicle.isDanger = dx < main.width + 20 && dy > -150 && dy < 150
      
      // 统计避让次数
      if (!vehicle.passed && vehicle.y > main.y + main.height) {
        vehicle.passed = true
        if (vehicle.isDanger) {
          dodgeCount.value++
        }
      }
    }
    
    // 对向车辆危险检测
    if (main && vehicle.isOpposite) {
      vehicle.isDanger = Math.abs(vehicle.x - main.x) < main.width + 30 && vehicle.y > main.y - 200 && vehicle.y < main.y + 100
    }
  })
  
  updateMiniMap()
}

// 触发碰撞
const triggerCollision = () => {
  if (showCollisionAlert.value) return
  showCollisionAlert.value = true
  animationState.value.collisionFrame = 0
  controlledSpeed.value = 0
}

// 重置游戏
const resetGame = () => {
  showCollisionAlert.value = false
  animationState.value.collisionFrame = 0
  initMainVehicle()
  initOtherVehicles()
  containerRef.value?.focus()
}

// 获取随机车道X坐标
const getRandomLaneX = (isOpposite) => {
  const canvas = canvasRef.value
  if (!canvas) return 0
  
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  
  const lane = isOpposite 
    ? Math.floor(Math.random() * 3) + 3
    : Math.floor(Math.random() * 3)
  
  return centerX - (laneWidth * 3) + (lane * laneWidth) + laneWidth / 2 - 25
}

// 更新小地图
const updateMiniMap = () => {
  const main = mainVehicle.value
  if (!main) return
  
  nearbyVehicles.value = otherVehicles.value
    .filter(v => Math.abs(v.y - main.y) < 500)
    .map(v => ({
      ...v,
      miniX: (v.x / canvasRef.value.width) * 100,
      miniY: ((main.y - v.y + 500) / 1000) * 100
    }))
}

// =====================================================
// 动画控制
// =====================================================

const startAnimation = () => {
  if (animationState.value.isRunning) return
  animationState.value.isRunning = true
  animationState.value.lastTime = performance.now()
  animate()
}

const stopAnimation = () => {
  animationState.value.isRunning = false
  showCollisionAlert.value = false
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

const animate = () => {
  if (!animationState.value.isRunning) return
  
  // 更新控制
  if (!showCollisionAlert.value) {
    updateControls()
    updateVehicles()
  }
  
  draw()
  animationId.value = requestAnimationFrame(animate)
}

const resetAnimation = () => {
  stopAnimation()
  animationState.value.collisionFrame = 0
  showCollisionAlert.value = false
  initMainVehicle()
  initOtherVehicles()
  initRoadLines()
  startAnimation()
}

// 颜色工具函数
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

// =====================================================
// 生命周期
// =====================================================

const handleResize = () => {
  if (containerRef.value && canvasRef.value) {
    canvasRef.value.width = containerRef.value.clientWidth
    canvasRef.value.height = containerRef.value.clientHeight
    initMainVehicle()
    initOtherVehicles()
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

// 监听参数变化
watch(() => props.vehicleSpeed, (newSpeed) => {
  if (!keys.up && !keys.down) {
    controlledSpeed.value = newSpeed
  }
})

watch(() => props.vehicleDensity, () => {
  initOtherVehicles()
})

watch(() => props.currentScene, () => {
  initOtherVehicles()
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
  outline: none; // 移除焦点边框
  
  &:focus {
    outline: none;
  }
}

.main-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

// 底部控制小提示
.control-tip {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 14, 39, 0.7);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  z-index: 100;
  pointer-events: none;
}

// 控制提示
.control-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(10, 14, 39, 0.95);
  border: 2px solid rgba(0, 212, 255, 0.5);
  border-radius: 16px;
  padding: 30px 40px;
  text-align: center;
  z-index: 200;
  animation: fadeIn 0.5s ease;
  
  &.active {
    animation: pulse 2s infinite;
  }
  
  .hint-title {
    font-size: 20px;
    font-weight: 600;
    color: $primary-color;
    margin-bottom: 20px;
  }
  
  .hint-keys {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    
    .key-row {
      display: flex;
      justify-content: center;
      gap: 15px;
      align-items: center;
      
      .key {
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #fff;
        transition: all 0.15s ease;
        
        &.pressed {
          background: $primary-color;
          border-color: $primary-color;
          transform: scale(0.95);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }
      }
      
      .key-desc {
        font-size: 12px;
        color: $text-secondary;
        min-width: 50px;
        text-align: center;
      }
    }
  }
  
  .hint-close {
    font-size: 12px;
    color: $text-secondary;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: $text-primary;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.5); }
}

// 速度仪表盘
.speedometer {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 15px 20px;
  text-align: center;
  backdrop-filter: blur(10px);
  
  .speed-value {
    font-size: 42px;
    font-weight: 700;
    color: $primary-color;
    line-height: 1;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    font-family: 'Courier New', monospace;
  }
  
  .speed-unit {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
  }
  
  .speed-bar {
    width: 100px;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    margin-top: 10px;
    overflow: hidden;
    
    .speed-fill {
      height: 100%;
      background: linear-gradient(90deg, #2ed573, #ffd93d, #ff7f50, #ff4757);
      border-radius: 3px;
      transition: width 0.1s ease;
    }
  }
  
  .speed-gear {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
    
    span {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      transition: all 0.2s ease;
      
      &.active {
        color: #fff;
        background: $primary-color;
      }
    }
  }
}

// 方向指示器
.direction-indicator {
  position: absolute;
  bottom: 160px;
  left: 30px;
  display: grid;
  grid-template-columns: repeat(3, 40px);
  grid-template-rows: repeat(2, 40px);
  gap: 5px;
  
  .dir-arrow {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.15s ease;
    
    &.active {
      background: $primary-color;
      border-color: $primary-color;
      color: #fff;
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
    }
    
    &.left { grid-column: 1; grid-row: 2; }
    &.up { grid-column: 2; grid-row: 1; }
    &.down { grid-column: 2; grid-row: 2; }
    &.right { grid-column: 3; grid-row: 2; }
  }
}

// 小地图
.mini-map {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 120px;
  height: 180px;
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  .mini-road {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 40px;
    height: 100%;
    background: rgba(40, 40, 50, 0.8);
    
    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      width: 2px;
      height: 100%;
      background: #ffd93d;
    }
  }
  
  .mini-main {
    position: absolute;
    width: 16px;
    height: 20px;
    background: $primary-color;
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    transform: translateX(-50%);
    transition: left 0.1s ease;
  }
  
  .mini-vehicle {
    position: absolute;
    width: 8px;
    height: 10px;
    background: #6c757d;
    border-radius: 2px;
    
    &.danger {
      background: #ff4757;
      box-shadow: 0 0 8px rgba(255, 71, 87, 0.5);
    }
  }
}

// 图例
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
      
      &.main-vehicle { 
        background: $primary-color;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
      }
      &.same-direction { 
        background: linear-gradient(180deg, #3498db, #2980b9);
      }
      &.opposite-direction { 
        background: linear-gradient(180deg, #e74c3c, #c0392b);
      }
      &.v2x-range { 
        background: rgba(46, 213, 115, 0.3); 
        border: 2px dashed $success-color; 
      }
    }
  }
}

// 场景信息
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

// 碰撞提示（小型，不挡视野）
.collision-alert-mini {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 71, 87, 0.95);
  border-radius: 25px;
  padding: 10px 25px;
  z-index: 300;
  animation: slideUp 0.3s ease;
  
  .alert-text {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    
    kbd {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      padding: 2px 8px;
      margin: 0 4px;
      font-family: inherit;
    }
  }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// 得分面板
.score-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  
  .score-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    
    &:last-child {
      border-bottom: none;
    }
    
    .score-label {
      font-size: 11px;
      color: $text-secondary;
      margin-right: 20px;
    }
    
    .score-value {
      font-size: 14px;
      font-weight: 600;
      color: $primary-color;
      font-family: 'Courier New', monospace;
    }
  }
}
</style>
