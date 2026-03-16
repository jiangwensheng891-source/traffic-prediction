<!-- =====================================================
     主可视化画布组件 - 5G-V2X车联网可视化系统
     功能：车辆行驶动画、道路渲染、盲区可视化、碰撞动画
     增强版：赛车游戏风格、键盘控制、相向/相背行驶
     使用Canvas实现高性能动画渲染
     ===================================================== -->

<template>
  <div class="canvas-container" ref="containerRef" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <canvas ref="canvasRef" class="main-canvas"></canvas>

    <!-- 演示模式标识 -->
    <div v-if="demoMode" class="demo-mode-badge">
      <span class="demo-icon">🎬</span>
      <span>演示模式</span>
    </div>

    <!-- 控制提示（默认隐藏，按H键显示，非演示模式显示） -->
    <div v-if="showControlHint && !demoMode" class="control-hint">
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

    <!-- 底部小控制提示（非演示模式） -->
    <div v-if="!demoMode" class="control-tip">
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
        <span class="alert-text">
          💥 碰撞！
          <template v-if="!demoMode">按 <kbd>R</kbd> 重置</template>
          <template v-else>演示模式自动重置</template>
        </span>
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
  collisionTriggered: { type: Boolean, default: false },
  demoMode: { type: Boolean, default: false }  // 演示模式
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
const roadConfig = computed(() => {
  const layout = sceneConfig.value.roadLayout || 'straight'
  const roadCfg = sceneConfig.value.roadConfig || {}
  
  return {
    laneWidth: 80,
    lanes: roadCfg.lanes || 6,
    roadWidth: roadCfg.laneWidth ? roadCfg.laneWidth * 20 : 480, // 调整道路宽度
    centerX: 0,
    layout,
    curveRadius: roadCfg.curveRadius || 0,
    hasCrossroad: roadCfg.hasCrossroad || false,
    tunnelLength: roadCfg.tunnelLength || 0
  }
})

// 红绿灯状态
const trafficLights = ref([])
const lightTimers = ref({})

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

  // 演示模式：自动控制（永不碰撞）
  if (props.demoMode) {
    const canvas = canvasRef.value
    if (!canvas) return

    const centerX = canvas.width / 2
    const laneWidth = roadConfig.value.laneWidth
    const leftBound = centerX - laneWidth * 3 + 20
    const rightBound = centerX - 20 - mainVehicle.value.width

    // 检测前方车辆，自动避让（加强版）
    const main = mainVehicle.value
    let needLaneChange = false
    let safeLaneX = null
    let closestDangerDistance = 9999

    // 检查同向车辆，看是否需要变道避让
    for (const vehicle of otherVehicles.value) {
      if (!vehicle.isOpposite) { // 同向车辆
        const dx = Math.abs(vehicle.x - main.x)
        const dy = vehicle.y - main.y

        // ======== 扩大检测范围，提前避让 ========
        // 前方有车且距离在安全范围内（扩大到300）
        if (dy > 0 && dy < 300 && dx < main.width + 40) {
          // 记录最危险车辆的距离
          if (dy < closestDangerDistance) {
            closestDangerDistance = dy
          }

          needLaneChange = true

          // 寻找安全的车道
          const currentLane = getCurrentLane(main.x, centerX, laneWidth)
          const leftLaneX = centerX - (laneWidth * 3) + (laneWidth * 0.5) + laneWidth / 2 - 25  // 最左车道
          const rightLaneX = centerX - (laneWidth * 3) + (laneWidth * 2.5) + laneWidth / 2 - 25  // 最右车道

          // 检查左右车道是否安全
          const leftSafe = isLaneSafe(vehicle, main, leftLaneX, dy)
          const rightSafe = isLaneSafe(vehicle, main, rightLaneX, dy)

          if (currentLane <= 1 && rightSafe) {
            safeLaneX = rightLaneX
          } else if (currentLane >= 1 && leftSafe) {
            safeLaneX = leftLaneX
          } else if (leftSafe) {
            safeLaneX = leftLaneX
          } else if (rightSafe) {
            safeLaneX = rightLaneX
          }
          break
        }
      }
    }

    // 如果需要变道或有安全车道，前往安全车道
    if (needLaneChange && safeLaneX) {
      // 找出目标车道索引
      let targetLane = mainVehicle.value.lane
      if (safeLaneX === leftLaneX) {
        targetLane = 0
      } else if (safeLaneX === rightLaneX) {
        targetLane = 2
      }
      mainVehicle.value.targetLaneChange = safeLaneX
      mainVehicle.value.targetLane = targetLane
    }

    // 如果正在变道中但前方危险解除，继续完成变道
    if (!needLaneChange && mainVehicle.value.targetLaneChange) {
      // 保持当前变道不变
    } else if (!needLaneChange && Math.random() < 0.002) {
      // 前方无车，随机变道让画面更丰富（使用车道中心）
      const targetLane = Math.floor(Math.random() * 3)
      mainVehicle.value.targetLaneChange = getLaneCenterX(targetLane)
      mainVehicle.value.targetLane = targetLane
    }

    // 平滑移动到目标位置
    if (mainVehicle.value.targetLaneChange) {
      const diff = mainVehicle.value.targetLaneChange - mainVehicle.value.x
      if (Math.abs(diff) > 2) {
        const moveSpeed = 5  // 稍微快一点
        if (diff > 0 && mainVehicle.value.x < rightBound - 10) {
          mainVehicle.value.x += moveSpeed
          mainVehicle.value.tilt = 0.05
        } else if (diff < 0 && mainVehicle.value.x > leftBound + 10) {
          mainVehicle.value.x -= moveSpeed
          mainVehicle.value.tilt = -0.05
        } else {
          mainVehicle.value.tilt = 0
        }
      } else {
        // 变道完成，对齐到车道中心
        mainVehicle.value.x = mainVehicle.value.targetLaneChange
        mainVehicle.value.tilt = 0
        // 更新车道索引
        if (mainVehicle.value.targetLane !== undefined) {
          mainVehicle.value.lane = mainVehicle.value.targetLane
          mainVehicle.value.targetLane = undefined
        }
        mainVehicle.value.targetLaneChange = null
      }
    } else {
      // 没有变道时，强制对齐到当前车道
      const expectedX = getLaneCenterX(mainVehicle.value.lane)
      if (Math.abs(mainVehicle.value.x - expectedX) > 5) {
        mainVehicle.value.x += (expectedX - mainVehicle.value.x) * 0.1
      }
    }

    // 自动加速到目标速度
    const targetSpeed = props.vehicleSpeed || 40
    if (controlledSpeed.value < targetSpeed) {
      controlledSpeed.value = Math.min(controlledSpeed.value + 0.5, targetSpeed)
    } else if (controlledSpeed.value > targetSpeed) {
      controlledSpeed.value = Math.max(controlledSpeed.value - 0.3, targetSpeed)
    }
  } else {
    // 普通模式：用户控制
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

  // 左右移动（变道）- 仅在非演示模式
  if (!props.demoMode) {
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
  }

  // 更新小地图位置
  const canvas = canvasRef.value
  if (canvas) {
    const centerX = canvas.width / 2
    const laneWidth = roadConfig.value.laneWidth
    const leftBound = centerX - laneWidth * 3 + 20
    const rightBound = centerX - 20 - mainVehicle.value.width
    miniMapMainX.value = ((mainVehicle.value.x - leftBound) / (rightBound - leftBound)) * 30 + 35
  }

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
  initTrafficLights()
  initCurveRoad()
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

  mainVehicle.value = {
    x: getLaneCenterX(1), // 中间车道（严格对齐）
    y: canvas.height * 0.7,
    width: 55,  // 稍微减小
    height: 95,  // 稍微减小
    lane: 1,
    speed: controlledSpeed.value,
    color: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    tilt: 0, // 倾斜角度（变道时）
    trail: [],
    headlights: true,
    targetLaneChange: null,  // 演示模式变道目标
    targetLane: 1  // 目标车道
  }

  // 重置统计
  travelDistance.value = 0
  maxSpeed.value = 40
  dodgeCount.value = 0
  controlledSpeed.value = props.vehicleSpeed
}

// 车辆ID计数器
let vehicleIdCounter = 0

// 渐进式初始化车辆（开始只生成少量，逐渐增加）
const initOtherVehicles = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  otherVehicles.value = []
  nearbyVehicles.value = []
  vehicleIdCounter = 0

  // 开始只生成少量车辆（比如3对）
  const initialCount = 6
  const vehicleCount = Math.min(Math.floor(props.vehicleDensity / 15) + 5, 25)
  // 保存总车辆数供后续生成
  maxVehicleCount.value = vehicleCount

  // 记录每个车道最后放置的车辆Y位置
  const laneLastY = new Array(6).fill(-300)

  for (let i = 0; i < initialCount; i++) {
    const isOpposite = i < initialCount / 2
    const lane = isOpposite
      ? Math.floor(Math.random() * 3) + 3
      : Math.floor(Math.random() * 3)

    const laneX = getLaneCenterX(lane)
    const minSpacing = 200
    let y = laneLastY[lane] + minSpacing + Math.random() * 150
    laneLastY[lane] = y

    if (y > canvas.height * 2) {
      y = Math.random() * canvas.height * 2 - canvas.height
    }

    const vehicle = {
      id: vehicleIdCounter++,
      x: laneX,
      y: y,
      width: 48 + Math.random() * 12,
      height: 85 + Math.random() * 15,
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
      passed: false,
      laneChangeCooldown: 0,
      targetX: undefined,
      targetLane: lane
    }

    otherVehicles.value.push(vehicle)
  }
}

// 最大车辆数
const maxVehicleCount = ref(20)

// 渐进式生成新车辆
const spawnVehicleIfNeeded = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  // 如果还没达到最大数量，有概率生成新车
  if (otherVehicles.value.length < maxVehicleCount.value) {
    // 每帧2%的概率生成新车
    if (Math.random() < 0.02) {
      const isOpposite = Math.random() > 0.5
      const lanes = isOpposite ? [3, 4, 5] : [0, 1, 2]
      const lane = lanes[Math.floor(Math.random() * lanes.length)]
      const laneX = getLaneCenterX(lane)

      // 检查该位置是否安全
      let canSpawn = true
      for (const v of otherVehicles.value) {
        if (v.isOpposite === isOpposite) {
          const dy = Math.abs(v.y - (isOpposite ? -200 : canvas.height + 200))
          if (dy < 150) {
            canSpawn = false
            break
          }
        }
      }

      if (canSpawn) {
        const newVehicle = {
          id: vehicleIdCounter++,
          x: laneX,
          y: isOpposite ? -150 : canvas.height + 150,
          width: 48 + Math.random() * 12,
          height: 85 + Math.random() * 15,
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
          passed: false,
          laneChangeCooldown: 30,  // 新车有冷却时间
          targetX: undefined,
          targetLane: lane
        }
        otherVehicles.value.push(newVehicle)
      }
    }
  }
}

// 初始化粒子系统
const initParticles = () => {
  particles.value = []
}

// 初始化红绿灯
const initTrafficLights = () => {
  trafficLights.value = []
  const layout = roadConfig.value.layout
  const canvas = canvasRef.value
  if (!canvas) return
  
  // 十字路口场景：添加红绿灯
  if (layout === 'crossroad') {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // 四个方向的红绿灯
    const positions = [
      { x: centerX - 180, y: centerY - 150, direction: 'ns' }, // 北向
      { x: centerX + 180, y: centerY - 150, direction: 'ns' }, // 北向
      { x: centerX - 180, y: centerY + 150, direction: 'ns' }, // 南向
      { x: centerX + 180, y: centerY + 150, direction: 'ns' }, // 南向
      { x: centerX - 150, y: centerY - 180, direction: 'ew' }, // 西向
      { x: centerX - 150, y: centerY + 180, direction: 'ew' }, // 西向
      { x: centerX + 150, y: centerY - 180, direction: 'ew' }, // 东向
      { x: centerX + 150, y: centerY + 180, direction: 'ew' }  // 东向
    ]
    
    positions.forEach((pos, idx) => {
      trafficLights.value.push({
        id: idx,
        x: pos.x,
        y: pos.y,
        direction: pos.direction,
        state: pos.direction === 'ns' ? 'green' : 'red',
        timer: pos.direction === 'ns' ? 0 : 0,
        poleHeight: 60
      })
    })
  }
  
  // 启动红绿灯循环
  startTrafficLightCycle()
}

// 红绿灯循环
const startTrafficLightCycle = () => {
  const updateLights = () => {
    trafficLights.value.forEach(light => {
      light.timer++
      
      // 每5秒切换一次（绿-黄-红-绿循环）
      const cycle = 300 // 5秒 * 60fps
      const phase = light.timer % cycle
      
      if (light.direction === 'ns') {
        if (phase < 180) light.state = 'green'
        else if (phase < 210) light.state = 'yellow'
        else light.state = 'red'
      } else {
        if (phase < 180) light.state = 'red'
        else if (phase < 210) light.state = 'yellow'
        else light.state = 'green'
      }
    })
    
    if (animationState.value.isRunning) {
      requestAnimationFrame(updateLights)
    }
  }
  updateLights()
}

// 匝道/弯道初始化
const curveOffset = ref(0)
const initCurveRoad = () => {
  curveOffset.value = 0
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
  
  // 根据道路布局选择绘制方式
  const layout = roadConfig.value.layout
  if (layout === 'curve' || layout === 'ramp') {
    drawCurveRoad(context, canvas)
    drawRoadLines(context, canvas, true)
  } else if (layout === 'crossroad') {
    drawCrossroadRoad(context, canvas)
    drawTrafficLights(context, canvas)
    drawRoadLines(context, canvas)
  } else {
    drawRoad(context, canvas)
    drawRoadLines(context, canvas)
  }
  
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

// 绘制匝道/弯道
const drawCurveRoad = (ctx, canvas) => {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const curveRadius = 400 // 弯道半径
  const laneWidth = roadConfig.value.laneWidth
  
  // 更新弯道偏移
  curveOffset.value += controlledSpeed.value * 0.15
  const offset = curveOffset.value % (Math.PI * 2 * curveRadius)
  
  // 绘制弯道主体
  ctx.strokeStyle = '#2a2a35'
  ctx.lineWidth = laneWidth * 3 + 40
  ctx.lineCap = 'round'
  
  // 左弯道
  ctx.beginPath()
  ctx.arc(centerX - curveRadius, centerY, curveRadius, -Math.PI * 0.3, Math.PI * 0.8)
  ctx.stroke()
  
  // 右弯道
  ctx.beginPath()
  ctx.arc(centerX + curveRadius, centerY, curveRadius, Math.PI * 0.2, Math.PI * 1.3)
  ctx.stroke()
  
  // 绘制匝道边缘
  ctx.strokeStyle = '#ff4757'
  ctx.lineWidth = 3
  ctx.setLineDash([20, 15])
  
  // 左边缘
  ctx.beginPath()
  ctx.arc(centerX - curveRadius, centerY, curveRadius - laneWidth * 1.5, -Math.PI * 0.3, Math.PI * 0.8)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(centerX - curveRadius, centerY, curveRadius + laneWidth * 1.5, -Math.PI * 0.3, Math.PI * 0.8)
  ctx.stroke()
  
  // 右边缘
  ctx.beginPath()
  ctx.arc(centerX + curveRadius, centerY, curveRadius - laneWidth * 1.5, Math.PI * 0.2, Math.PI * 1.3)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(centerX + curveRadius, centerY, curveRadius + laneWidth * 1.5, Math.PI * 0.2, Math.PI * 1.3)
  ctx.stroke()
  
  ctx.setLineDash([])
  
  // 匝道标线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([30, 20])
  
  for (let r = curveRadius - laneWidth * 1.5; r <= curveRadius + laneWidth * 1.5; r += laneWidth) {
    ctx.beginPath()
    ctx.arc(centerX - curveRadius, centerY, r, -Math.PI * 0.3, Math.PI * 0.8)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(centerX + curveRadius, centerY, r, Math.PI * 0.2, Math.PI * 1.3)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
  
  // 弯道盲区标记
  drawCurveBlindSpots(ctx, canvas, centerX, centerY, curveRadius)
  
  // 匝道入口/出口标识
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.fillStyle = '#ffa502'
  ctx.textAlign = 'center'
  ctx.fillText('匝道入口', centerX - curveRadius + 100, centerY - curveRadius - 50)
  ctx.fillText('匝道出口', centerX + curveRadius - 100, centerY + curveRadius + 60)
  ctx.fillText('弯道', centerX - curveRadius - 80, centerY + 30)
  ctx.fillText('弯道', centerX + curveRadius + 80, centerY + 30)
}

// 绘制弯道盲区
const drawCurveBlindSpots = (ctx, canvas, centerX, centerY, curveRadius) => {
  // 左弯内侧盲区
  ctx.fillStyle = 'rgba(255, 71, 87, 0.15)'
  ctx.beginPath()
  ctx.arc(centerX - curveRadius + 80, centerY - 50, 100, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.font = '12px Microsoft YaHei'
  ctx.fillStyle = '#ff4757'
  ctx.fillText('内弯盲区', centerX - curveRadius + 80, centerY - 50)
  
  // 右弯内侧盲区
  ctx.fillStyle = 'rgba(255, 71, 87, 0.15)'
  ctx.beginPath()
  ctx.arc(centerX + curveRadius - 80, centerY + 50, 100, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.fillStyle = '#ff4757'
  ctx.fillText('内弯盲区', centerX + curveRadius - 80, centerY + 50)
  
  // 弯道限速提示
  ctx.font = 'bold 16px Microsoft YaHei'
  ctx.fillStyle = '#ffa502'
  ctx.fillText('限速 40km/h', centerX - curveRadius, centerY + curveRadius + 80)
  ctx.fillText('限速 40km/h', centerX + curveRadius, centerY - curveRadius - 80)
}

// 绘制十字路口道路
const drawCrossroadRoad = (ctx, canvas) => {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const roadWidth = roadConfig.value.roadWidth
  const laneWidth = roadConfig.value.laneWidth
  
  // 道路主体（十字形）
  ctx.fillStyle = '#2a2a35'
  
  // 南北向道路
  ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, canvas.height)
  // 东西向道路
  ctx.fillRect(0, centerY - roadWidth / 2, canvas.width, roadWidth)
  
  // 道路边缘 - 南北向
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor(y / 20) % 2 === 0) ? '#ff4757' : '#ffffff'
    ctx.fillRect(centerX - roadWidth / 2, y, 5, 20)
    ctx.fillRect(centerX + roadWidth / 2 - 5, y, 5, 20)
  }
  
  // 道路边缘 - 东西向
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.fillStyle = (Math.floor(x / 20) % 2 === 0) ? '#ff4757' : '#ffffff'
    ctx.fillRect(x, centerY - roadWidth / 2, 20, 5)
    ctx.fillRect(x, centerY + roadWidth / 2 - 5, 20, 5)
  }
  
  // 中心区域 - 交叉口标记
  ctx.fillStyle = '#1a1a25'
  ctx.fillRect(centerX - 10, centerY - 10, 20, 20)
  
  // 停止线
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.setLineDash([])
  
  // 北向停止线
  ctx.beginPath()
  ctx.moveTo(centerX - roadWidth / 2 + 10, centerY - roadWidth / 2 + 30)
  ctx.lineTo(centerX - 30, centerY - roadWidth / 2 + 30)
  ctx.stroke()
  
  // 南向停止线
  ctx.beginPath()
  ctx.moveTo(centerX + 30, centerY + roadWidth / 2 - 30)
  ctx.lineTo(centerX + roadWidth / 2 - 10, centerY + roadWidth / 2 - 30)
  ctx.stroke()
  
  // 西向停止线
  ctx.beginPath()
  ctx.moveTo(centerX - roadWidth / 2 + 30, centerY - 30)
  ctx.lineTo(centerX - roadWidth / 2 + 30, centerY + 30)
  ctx.stroke()
  
  // 东向停止线
  ctx.beginPath()
  ctx.moveTo(centerX + roadWidth / 2 - 30, centerY + 30)
  ctx.lineTo(centerX + roadWidth / 2 - 30, centerY - roadWidth / 2 + 10)
  ctx.stroke()
  
  // 车道线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([30, 20])
  
  // 南北向车道线
  for (let i = 1; i < 3; i++) {
    const x = centerX - (laneWidth * 3) + (i * laneWidth)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, centerY - roadWidth / 2 - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, centerY + roadWidth / 2 + 10)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  
  // 东西向车道线
  for (let i = 1; i < 3; i++) {
    const y = centerY - (laneWidth * 3) + (i * laneWidth)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(centerX - roadWidth / 2 - 10, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(centerX + roadWidth / 2 + 10, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
  
  // 交叉口中心圆环
  ctx.strokeStyle = '#ffd93d'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(centerX, centerY, 30, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.fillStyle = '#ffd93d'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 15, 0, Math.PI * 2)
  ctx.fill()
  
  // 交叉口标签
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.fillStyle = '#ffa502'
  ctx.textAlign = 'center'
  ctx.fillText('十字路口', centerX, centerY + 55)
}

// 绘制红绿灯
const drawTrafficLights = (ctx, canvas) => {
  const layout = roadConfig.value.layout
  if (layout !== 'crossroad') return
  
  trafficLights.value.forEach(light => {
    // 灯杆
    ctx.strokeStyle = '#444444'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(light.x, light.y)
    ctx.lineTo(light.x, light.y + light.poleHeight)
    ctx.stroke()
    
    // 灯箱
    const boxWidth = 20
    const boxHeight = 50
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(light.x - boxWidth / 2, light.y - boxHeight - 10, boxWidth, boxHeight)
    
    // 红灯
    ctx.beginPath()
    ctx.arc(light.x, light.y - 35, 6, 0, Math.PI * 2)
    ctx.fillStyle = light.state === 'red' ? '#ff0000' : '#330000'
    ctx.fill()
    if (light.state === 'red') {
      ctx.shadowColor = '#ff0000'
      ctx.shadowBlur = 15
      ctx.fill()
      ctx.shadowBlur = 0
    }
    
    // 黄灯
    ctx.beginPath()
    ctx.arc(light.x, light.y - 25, 6, 0, Math.PI * 2)
    ctx.fillStyle = light.state === 'yellow' ? '#ffcc00' : '#333300'
    ctx.fill()
    if (light.state === 'yellow') {
      ctx.shadowColor = '#ffcc00'
      ctx.shadowBlur = 15
      ctx.fill()
      ctx.shadowBlur = 0
    }
    
    // 绿灯
    ctx.beginPath()
    ctx.arc(light.x, light.y - 15, 6, 0, Math.PI * 2)
    ctx.fillStyle = light.state === 'green' ? '#00ff00' : '#003300'
    ctx.fill()
    if (light.state === 'green') {
      ctx.shadowColor = '#00ff00'
      ctx.shadowBlur = 15
      ctx.fill()
      ctx.shadowBlur = 0
    }
  })
  
  // 行人红绿灯
  drawPedestrianLights(ctx, canvas)
}

// 绘制行人红绿灯
const drawPedestrianLights = (ctx, canvas) => {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const roadWidth = roadConfig.value.roadWidth
  
  // 四个位置的行人灯
  const positions = [
    { x: centerX - roadWidth / 2 - 30, y: centerY - roadWidth / 2 - 30 },
    { x: centerX + roadWidth / 2 + 30, y: centerY - roadWidth / 2 - 30 },
    { x: centerX - roadWidth / 2 - 30, y: centerY + roadWidth / 2 + 30 },
    { x: centerX + roadWidth / 2 + 30, y: centerY + roadWidth / 2 + 30 }
  ]
  
  positions.forEach((pos, idx) => {
    const isGreen = trafficLights.value[0]?.state === 'red'
    
    // 灯箱
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(pos.x - 8, pos.y - 20, 16, 40)
    
    // 行人图标（简化）
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = isGreen ? '#00ff00' : '#ff0000'
    if (isGreen) {
      ctx.shadowColor = '#00ff00'
      ctx.shadowBlur = 10
    }
    ctx.fillText('↗', pos.x, pos.y)
    ctx.shadowBlur = 0
  })
}

// 绘制道路标线（动态移动）
const drawRoadLines = (ctx, canvas, isCurve = false) => {
  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth
  
  // 匝道/弯道的标线在drawCurveRoad中单独处理
  if (isCurve) return
  
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
  
  const v2xRange = 125
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

  // 渐进式生成新车辆
  spawnVehicleIfNeeded()

  // 更新行驶距离
  travelDistance.value += controlledSpeed.value * 0.01

  // 车辆间避让检测（防穿模）- 强化版
  const vehiclePairs = []
  for (let i = 0; i < otherVehicles.value.length; i++) {
    for (let j = i + 1; j < otherVehicles.value.length; j++) {
      vehiclePairs.push([otherVehicles.value[i], otherVehicles.value[j]])
    }
  }

  // 处理车辆间碰撞/避让
  vehiclePairs.forEach(([v1, v2]) => {
    // 只检测同向车辆间的穿模
    if (v1.isOpposite === v2.isOpposite) {
      const dx = Math.abs(v1.x - v2.x)
      const dy = v1.y - v2.y

      // 前后车距离
      const distance = Math.abs(dy)
      const minDistance = Math.max(v1.height, v2.height) * 0.8
      const widthThreshold = Math.max(v1.width, v2.width) * 0.8

      // ====== 严格防穿模 ======
      // 1. 如果同车道前后距离太近（穿模危险区域），强制减速
      if (dx < widthThreshold && distance < minDistance * 1.5) {
        // 后车必须减速
        if (dy > 0 && !v1.isOpposite) {
          // v1在后，必须比v2慢
          v1.speed = Math.min(v1.speed, v2.speed * 0.7)
          v1.braking = true
        } else if (dy < 0 && !v2.isOpposite) {
          v2.speed = Math.min(v2.speed, v1.speed * 0.7)
          v2.braking = true
        }
      }

      // 2. 即将穿模时，触发强制换道
      if (dx < widthThreshold && distance < minDistance * 2.5) {
        const slowerVehicle = dy > 0 ? v1 : v2
        const fasterVehicle = dy > 0 ? v2 : v1
        if (!slowerVehicle.laneChangeCooldown && slowerVehicle.speed < fasterVehicle.speed * 0.9) {
          // 尝试换道
          const laneChangeDir = slowerVehicle.x < fasterVehicle.x ? -1 : 1
          const newLane = slowerVehicle.lane + laneChangeDir
          const newX = getLaneCenterX(newLane)
          if (newX && newLane >= 0 && newLane <= 5) {
            slowerVehicle.targetX = newX
            slowerVehicle.targetLane = newLane
            slowerVehicle.laneChangeCooldown = 90
          }
        }
      }
    }
  })
  
  // 更新其他车辆位置（GTA风格）
  otherVehicles.value.forEach(vehicle => {
    // 处理换道动画
    if (vehicle.targetX !== undefined) {
      const diff = vehicle.targetX - vehicle.x
      if (Math.abs(diff) > 2) {
        vehicle.x += diff * 0.12  // 变道稍微快一点
      } else {
        vehicle.x = vehicle.targetX
        vehicle.targetX = undefined
        // 变道完成后更新车道索引
        if (vehicle.targetLane !== undefined) {
          vehicle.lane = vehicle.targetLane
          vehicle.targetLane = undefined
        }
      }
    } else {
      // 没有变道时，强制对齐到当前车道中心
      constrainToLane(vehicle)
    }

    // 换道冷却计时
    if (vehicle.laneChangeCooldown > 0) {
      vehicle.laneChangeCooldown--
    }

    const relativeSpeed = vehicle.isOpposite
      ? (controlledSpeed.value + vehicle.speed)
      : (vehicle.speed - controlledSpeed.value)

    vehicle.y += relativeSpeed * 0.08 * speedFactor

    // 处理出界车辆（渐进式：删除而不是重置）
    let shouldRemove = false
    if (vehicle.isOpposite) {
      if (vehicle.y > canvas.height + 200) {
        shouldRemove = true
      }
    } else {
      if (vehicle.y < -200) {
        shouldRemove = true
      }
    }

    // 标记待删除的车辆
    if (shouldRemove) {
      vehicle._shouldRemove = true
    }

    // 每帧都强制约束在车道内（防止漂移）
    if (!vehicle.targetX) {
      constrainToLane(vehicle)
    }

    // 检测危险（距离主车太近）- 同向车辆
    if (main && !vehicle.isOpposite) {
      const dx = Math.abs(vehicle.x - main.x)
      const dy = vehicle.y - main.y

      // 碰撞检测 - 演示模式下不触发碰撞（因为主车会自动避让）
      if (!props.demoMode) {
        if (dx < main.width - 10 && dy > -main.height && dy < vehicle.height) {
          if (dy > -main.height && dy < main.height * 0.5) {
            triggerCollision()
          }
        }
      }

      // 危险警告
      vehicle.isDanger = dx < main.width + 20 && dy > -150 && dy < 150

      // 主动避让：当检测到危险时，尝试减速或换道
      if (vehicle.isDanger && !vehicle.laneChangeCooldown) {
        vehicle.speed = Math.max(vehicle.speed * 0.9, controlledSpeed.value * 0.6)

        const laneChangeDir = vehicle.x < main.x ? 1 : -1
        const newLane = vehicle.lane + laneChangeDir
        const newX = getLaneCenterX(newLane)
        if (newX && newLane >= 0 && newLane <= 5) {
          vehicle.targetX = newX
          vehicle.targetLane = newLane
          vehicle.laneChangeCooldown = 90
        }
      }

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

  // 删除出界的车辆
  otherVehicles.value = otherVehicles.value.filter(v => !v._shouldRemove)
  
  updateMiniMap()
}

// 获取车道中心X坐标（统一公式）
const getLaneCenterX = (laneIndex) => {
  const canvas = canvasRef.value
  if (!canvas) return canvas?.width / 2 || 600

  const centerX = canvas.width / 2
  const laneWidth = roadConfig.value.laneWidth

  // laneIndex: 0=最左同向车道, 1=中间, 2=最右同向车道, 3-5=对向车道
  return centerX - (laneWidth * 3) + (laneIndex * laneWidth) + laneWidth / 2
}

// 获取当前车道索引
const getCurrentLane = (x, centerX, laneWidth) => {
  const relativeX = x - (centerX - laneWidth * 3)
  return Math.max(0, Math.min(5, Math.floor(relativeX / laneWidth)))
}

// 约束车辆X坐标到车道内（类似GTA）
const constrainToLane = (vehicle) => {
  const canvas = canvasRef.value
  if (!canvas || vehicle.lane === undefined) return

  const laneX = getLaneCenterX(vehicle.lane)
  const laneWidth = roadConfig.value.laneWidth
  const halfWidth = vehicle.width / 2

  // 严格约束在车道范围内（留一点余量）
  const minX = laneX - laneWidth / 2 + halfWidth + 5
  const maxX = laneX + laneWidth / 2 - halfWidth - 5

  // 如果偏离车道太远，强制拉回
  if (vehicle.x < minX) {
    vehicle.x = minX
  } else if (vehicle.x > maxX) {
    vehicle.x = maxX
  }
}

// 获取换道后的位置
const getLaneOffset = (currentLane, direction) => {
  const canvas = canvasRef.value
  if (!canvas) return null

  const newLane = currentLane + direction
  if (newLane < 0 || newLane > 5) return null

  return getLaneCenterX(newLane)
}

// 检查目标车道是否安全（用于演示模式自动避让）
const isLaneSafe = (dangerVehicle, mainVehicle, targetLaneX, distanceToDanger) => {
  const safeDistance = 150  // 安全距离

  for (const vehicle of otherVehicles.value) {
    if (vehicle.isOpposite) continue  // 忽略对向车辆

    const dx = Math.abs(vehicle.x - targetLaneX)
    const dy = vehicle.y - mainVehicle.y

    // 检查目标车道是否有车
    if (dx < 60) {  // 同一车道
      // 前方有车
      if (dy > 0 && dy < safeDistance) {
        return false
      }
      // 后方有车太近
      if (dy < 0 && dy > -80) {
        return false
      }
    }
  }
  return true
}

// 触发碰撞
const triggerCollision = () => {
  if (showCollisionAlert.value) return
  showCollisionAlert.value = true
  animationState.value.collisionFrame = 0
  controlledSpeed.value = 0

  // 演示模式下自动重置
  if (props.demoMode) {
    setTimeout(() => {
      resetGame()
    }, 2000)
  }
}

// 重置游戏
const resetGame = () => {
  showCollisionAlert.value = false
  animationState.value.collisionFrame = 0
  initMainVehicle()
  initOtherVehicles()
  containerRef.value?.focus()
}

// 获取随机车道X坐标（统一使用车道中心）
const getRandomLaneX = (isOpposite) => {
  const canvas = canvasRef.value
  if (!canvas) return 0

  // 尝试找到安全的车道
  const lanes = isOpposite ? [3, 4, 5] : [0, 1, 2]

  // 随机尝试几个车道，找一个安全的
  const shuffled = lanes.sort(() => Math.random() - 0.5)

  for (const lane of shuffled) {
    const laneX = getLaneCenterX(lane)

    // 检查该位置是否与其他车辆太近
    let isSafe = true
    for (const v of otherVehicles.value) {
      if (v.isOpposite === isOpposite) {
        const dx = Math.abs(v.x - laneX)
        const dy = Math.abs(v.y - (isOpposite ? -300 : canvas.height + 300))

        // 对于刚出现的车辆，只检查X方向的距离
        if (dx < 80) {  // 同一车道或相邻车道
          isSafe = false
          break
        }
      }
    }

    if (isSafe) {
      return laneX
    }
  }

  // 如果都没找到安全位置，返回第一个车道
  return getLaneCenterX(lanes[0])
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

// 演示模式标识
.demo-mode-badge {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 150;
  animation: demoPulse 2s infinite;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  .demo-icon {
    font-size: 18px;
  }

  span {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
  }
}

@keyframes demoPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.7); }
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
