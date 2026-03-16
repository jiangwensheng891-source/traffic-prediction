<!-- =====================================================
     车辆模拟行驶训练模式组件
     游戏化驾驶训练功能
     ===================================================== -->

<template>
  <div class="driver-training-container">
    <!-- 游戏画布 -->
    <div ref="gameCanvasRef" class="game-canvas" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
      <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>

      <!-- 演示模式标识 -->
      <div v-if="demoMode" class="demo-mode-badge">
        <span class="demo-icon">🎬</span>
        <span>演示模式</span>
      </div>

      <!-- 游戏HUD -->
      <div class="game-hud">
        <!-- 顶部状态栏 -->
        <div class="hud-top">
          <div class="score-panel">
            <span class="score-label">得分</span>
            <span class="score-value">{{ score }}</span>
          </div>
          <div class="time-panel">
            <span class="time-label">时间</span>
            <span class="time-value">{{ formatTime(gameTime) }}</span>
          </div>
          <div class="level-panel">
            <span class="level-label">等级</span>
            <span class="level-value">{{ currentLevel }}</span>
          </div>
        </div>

        <!-- 底部控制提示（非演示模式） -->
        <div class="hud-bottom">
          <div v-if="!demoMode" class="controls-hint">
            <span>↑ 加速</span>
            <span>↓ 减速</span>
            <span>← → 转向</span>
            <span>空格 刹车</span>
          </div>
          <div v-else class="controls-hint demo-hint">
            <span>🎬 演示模式自动驾驶</span>
          </div>
          <div class="mission-hint">
            <span class="mission-icon">🎯</span>
            <span>{{ currentMission?.description }}</span>
          </div>
        </div>
      </div>

      <!-- 游戏状态覆盖层 -->
      <div v-if="gameState !== 'playing'" class="game-overlay">
        <div v-if="gameState === 'start'" class="overlay-content">
          <h2 class="game-title">🚗 车辆模拟行驶训练</h2>
          <p class="game-desc">通过模拟驾驶训练，掌握V2X安全驾驶技能</p>

          <div class="difficulty-select">
            <h3>选择难度</h3>
            <el-button
              v-for="diff in difficulties"
              :key="diff.id"
              :type="selectedDifficulty === diff.id ? 'primary' : 'default'"
              size="large"
              @click="selectDifficulty(diff.id)"
            >
              {{ diff.name }}
            </el-button>
          </div>

          <div class="start-buttons">
            <el-button type="primary" size="large" @click="startGame" :disabled="!selectedDifficulty">
              开始训练
            </el-button>
            <el-button size="large" @click="handleExit">
              返回
            </el-button>
          </div>
        </div>

        <div v-if="gameState === 'paused'" class="overlay-content">
          <h2>游戏暂停</h2>
          <el-button type="primary" size="large" @click="resumeGame">继续游戏</el-button>
          <el-button size="large" @click="exitGame">退出训练</el-button>
        </div>

        <div v-if="gameState === 'gameover'" class="overlay-content">
          <h2 class="gameover-title">训练结束</h2>
          <div class="final-score">
            <div class="score-item">
              <span class="label">最终得分</span>
              <span class="value">{{ score }}</span>
            </div>
            <div class="score-item">
              <span class="label">行驶距离</span>
              <span class="value">{{ (distance / 1000).toFixed(2) }} km</span>
            </div>
            <div class="score-item">
              <span class="label">最高时速</span>
              <span class="value">{{ maxSpeed }} km/h</span>
            </div>
            <div class="score-item">
              <span class="label">危险预警次数</span>
              <span class="value">{{ warningCount }} 次</span>
            </div>
          </div>
          <div class="result-feedback">
            <span v-if="score >= 1000" class="rating perfect">🏆 完美驾驶！</span>
            <span v-else-if="score >= 500" class="rating good">👍 表现优秀！</span>
            <span v-else-if="score >= 200" class="rating normal">😊 继续加油！</span>
            <span v-else class="rating need-practice">💪 需要更多练习！</span>
          </div>
          <el-button type="primary" size="large" @click="startGame">再来一次</el-button>
          <el-button size="large" @click="handleExit">返回</el-button>
        </div>
      </div>

      <!-- 实时预警提示 -->
      <transition name="warning-slide">
        <div v-if="showWarning" class="realtime-warning" :class="warningType">
          <span class="warning-icon">{{ warningType === 'collision' ? '⚠️' : '🚗' }}</span>
          <span class="warning-text">{{ warningMessage }}</span>
        </div>
      </transition>

      <!-- 速度表 -->
      <div class="speedometer">
        <div class="speed-value">{{ currentSpeed }}</div>
        <div class="speed-unit">km/h</div>
        <div class="speed-bar">
          <div class="speed-fill" :style="{ width: (currentSpeed / maxPossibleSpeed * 100) + '%' }"></div>
        </div>
      </div>

      <!-- V2X信息面板 -->
      <div class="v2x-info-panel">
        <div class="v2x-title">V2X 实时信息</div>
        <div class="v2x-item">
          <span class="label">前车距离</span>
          <span class="value">{{ (frontVehicleDistance / 10).toFixed(1) }} m</span>
        </div>
        <div class="v2x-item">
          <span class="label">通信延迟</span>
          <span class="value">{{ v2xLatency }} ms</span>
        </div>
        <div class="v2x-item">
          <span class="label">避让成功率</span>
          <span class="value" :class="{ danger: avoidanceSuccessRate < 70 }">{{ avoidanceSuccessRate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['exit'])

const props = defineProps({
  demoMode: { type: Boolean, default: false }  // 演示模式
})

// 游戏画布
const canvasRef = ref(null)
const gameCanvasRef = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(700)
let ctx = null
let animationId = null

// 游戏状态
const gameState = ref('start') // start, playing, paused, gameover
const score = ref(0)
const gameTime = ref(0)
const distance = ref(0)
const maxSpeed = ref(0)
const warningCount = ref(0)

// 难度选择
const difficulties = [
  { id: 'easy', name: '🌱 初级 - 车辆较少', trafficDensity: 0.3 },
  { id: 'normal', name: '🚗 中级 - 正常交通', trafficDensity: 0.6 },
  { id: 'hard', name: '🔥 高级 - 拥堵路段', trafficDensity: 0.9 }
]
const selectedDifficulty = ref(null)

// 玩家车辆
const playerCar = ref({
  x: 600,
  y: 600,
  width: 40,
  height: 70,
  speed: 0,
  angle: 0,
  acceleration: 0,
  lane: 2 // 3条车道 0, 1, 2
})

// 道路配置
const roadConfig = {
  laneWidth: 120,
  lanes: 3,
  totalWidth: 360
}

// 交通车辆
const trafficVehicles = ref([])
const maxTrafficVehicles = 8

// 按键状态
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false
}

// 游戏参数
const maxPossibleSpeed = 180
const acceleration = 0.5
const deceleration = 0.3
const brakeForce = 1.2
const turnSpeed = 3
const friction = 0.1

// V2X信息
const frontVehicleDistance = ref(200)
const v2xLatency = ref(15)
const avoidanceSuccessRate = ref(95)

// 预警
const showWarning = ref(false)
const warningType = ref('')
const warningMessage = ref('')
let warningTimeout = null

// 当前速度（计算属性）
const currentSpeed = computed(() => Math.round(playerCar.value.speed * 3.6)) // m/s 转 km/h
const currentLevel = computed(() => {
  if (score.value >= 1000) return 'S'
  if (score.value >= 700) return 'A'
  if (score.value >= 400) return 'B'
  if (score.value >= 200) return 'C'
  return 'D'
})

// 当前任务
const currentMission = computed(() => {
  const missions = [
    { id: 1, description: '保持安全车距，避免追尾', condition: () => distance.value < 500 },
    { id: 2, description: '达到60km/h以上', condition: () => currentSpeed.value >= 60 },
    { id: 3, description: '完成1000米行驶', condition: () => distance.value >= 1000 },
    { id: 4, description: '避免3次以上预警', condition: () => warningCount.value < 3 },
    { id: 5, description: '综合安全驾驶', condition: () => distance.value >= 2000 && warningCount.value < 5 }
  ]
  return missions.find(m => m.condition()) || missions[0]
})

// 选择难度
const selectDifficulty = (diffId) => {
  selectedDifficulty.value = diffId
}

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 开始游戏
const startGame = () => {
  if (!selectedDifficulty.value) return

  // 重置游戏状态
  score.value = 0
  gameTime.value = 0
  distance.value = 0
  maxSpeed.value = 0
  warningCount.value = 0
  gameState.value = 'playing'

  // 重置玩家车辆
  playerCar.value = {
    x: 600,
    y: 550,
    width: 40,
    height: 70,
    speed: 0,
    angle: 0,
    acceleration: 0,
    lane: 1
  }

  // 清空交通车辆
  trafficVehicles.value = []

  // 开始游戏循环
  startGameLoop()
}

// 退出游戏
const exitGame = () => {
  gameState.value = 'start'
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 暂停游戏
const pauseGame = () => {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
  }
}

// 继续游戏
const resumeGame = () => {
  gameState.value = 'playing'
  startGameLoop()
}

// 退出训练
const handleExit = () => {
  exitGame()
  emit('exit')
}

// 游戏主循环
let lastTime = 0
const startGameLoop = () => {
  if (gameState.value !== 'playing') return

  const gameLoop = (timestamp) => {
    if (!lastTime) lastTime = timestamp
    const deltaTime = (timestamp - lastTime) / 1000
    lastTime = timestamp

    if (gameState.value === 'playing') {
      updateGame(deltaTime)
      renderGame()

      // 更新游戏时间
      gameTime.value += deltaTime

      // 生成交通车辆
      if (Math.random() < 0.02) {
        spawnTrafficVehicle()
      }

      // 检查游戏结束条件（时间到了）
      if (gameTime.value >= 120) { // 2分钟
        gameState.value = 'gameover'
      }
    }

    animationId = requestAnimationFrame(gameLoop)
  }

  animationId = requestAnimationFrame(gameLoop)
}

// 更新游戏状态
const updateGame = (deltaTime) => {
  // 处理按键输入
  handleInput(deltaTime)

  // 更新车辆位置
  updatePlayerCar(deltaTime)

  // 更新交通车辆
  updateTrafficVehicles(deltaTime)

  // 检测碰撞风险
  checkCollisionRisk()

  // 更新分数
  updateScore(deltaTime)

  // 更新最大速度
  if (currentSpeed.value > maxSpeed.value) {
    maxSpeed.value = currentSpeed.value
  }
}

// 处理输入
const handleInput = (deltaTime) => {
  const car = playerCar.value

  // 演示模式：自动控制
  if (props.demoMode) {
    // 自动加速到目标速度
    const targetSpeed = 50 / 3.6  // 50 km/h
    if (car.speed < targetSpeed) {
      car.speed += acceleration * deltaTime * 60 * 0.8
    } else if (car.speed > targetSpeed) {
      car.speed -= deceleration * deltaTime * 60
    }

    // 自动变道（检测前方车辆并避让）
    const frontVehicle = trafficVehicles.value.find(v =>
      Math.abs(v.lane - car.lane) < 0.5 && v.y > car.y && v.y - car.y < 150
    )

    if (frontVehicle) {
      // 前方有车，自动变道避让
      const currentLane = car.lane
      const availableLanes = [0, 1, 2].filter(l => l !== currentLane)
      const targetLane = availableLanes[Math.floor(Math.random() * availableLanes.length)]

      if (Math.abs(car.lane - targetLane) > 0.1) {
        car.lane += (targetLane > car.lane ? 0.02 : -0.02)
      }
    } else if (Math.random() < 0.002) {
      // 随机变道
      const targetLane = Math.floor(Math.random() * 3)
      if (Math.abs(car.lane - targetLane) > 0.1) {
        car.lane += (targetLane > car.lane ? 0.015 : -0.015)
      }
    }
  } else {
    // 普通模式：用户控制
    if (keys.up) {
      car.speed += acceleration * deltaTime * 60
    }

    if (keys.down) {
      car.speed -= deceleration * deltaTime * 60
    }

    if (keys.space) {
      car.speed -= brakeForce * deltaTime * 60
    }
  }

  // 限制速度
  car.speed = Math.max(0, Math.min(car.speed, maxPossibleSpeed / 3.6))

  // 转向（只在移动时有效，且非演示模式）
  if (car.speed > 5 && !props.demoMode) {
    if (keys.left) {
      car.lane = Math.max(0, car.lane - 0.02)
    }
    if (keys.right) {
      car.lane = Math.min(2, car.lane + 0.02)
    }
  }

  // 摩擦力
  car.speed -= friction * deltaTime * 60
  if (car.speed < 0) car.speed = 0
}

// 更新玩家车辆
const updatePlayerCar = (deltaTime) => {
  const car = playerCar.value

  // 根据车道计算x坐标
  const targetX = 150 + car.lane * roadConfig.laneWidth + roadConfig.laneWidth / 2
  car.x += (targetX - car.x) * 0.1

  // 移动距离
  distance.value += car.speed * deltaTime * 10
}

// 生成交通车辆
const spawnTrafficVehicle = () => {
  const difficulty = difficulties.find(d => d.id === selectedDifficulty.value)
  const maxVehicles = Math.floor(maxTrafficVehicles * difficulty.trafficDensity)

  if (trafficVehicles.value.length < maxVehicles) {
    const lane = Math.floor(Math.random() * 3)
    const speed = 20 + Math.random() * 40 // 20-60 km/h

    trafficVehicles.value.push({
      x: 150 + lane * roadConfig.laneWidth + roadConfig.laneWidth / 2,
      y: -100,
      width: 40,
      height: 70,
      speed: speed / 3.6,
      lane: lane,
      color: getRandomCarColor()
    })
  }
}

// 更新交通车辆
const updateTrafficVehicles = (deltaTime) => {
  trafficVehicles.value = trafficVehicles.value.filter(vehicle => {
    vehicle.y += vehicle.speed * deltaTime * 60

    // 超出屏幕移除
    return vehicle.y < canvasHeight.value + 100
  })
}

// 检测碰撞风险
const checkCollisionRisk = () => {
  const car = playerCar.value

  // 寻找前方的车辆
  let closestDistance = Infinity
  let closestVehicle = null

  trafficVehicles.value.forEach(vehicle => {
    // 同车道且在前方
    if (Math.abs(vehicle.lane - car.lane) < 0.5 && vehicle.y > car.y) {
      const distance = vehicle.y - car.y - car.height / 2 - vehicle.height / 2
      if (distance < closestDistance) {
        closestDistance = distance
        closestVehicle = vehicle
      }
    }
  })

  frontVehicleDistance.value = closestDistance

  // V2X模拟
  v2xLatency.value = 10 + Math.random() * 20

  // 计算避让成功率
  if (closestDistance < 100) {
    avoidanceSuccessRate.value = Math.max(30, 100 - (100 - closestDistance) * 0.7)
  } else {
    avoidanceSuccessRate.value = Math.min(99, 85 + (closestDistance - 100) * 0.1)
  }

  // 预警逻辑
  if (closestDistance < 50 && closestDistance > 0) {
    showWarningMessage('collision', '前方车辆距离过近！注意避让！')
    warningCount.value++
  } else if (closestDistance < 80 && closestDistance > 50) {
    showWarningMessage('warning', '注意前方车辆，保持车距')
  }
}

// 显示预警
const showWarningMessage = (type, message) => {
  if (showWarning.value) return

  warningType.value = type
  warningMessage.value = message
  showWarning.value = true

  if (warningTimeout) clearTimeout(warningTimeout)
  warningTimeout = setTimeout(() => {
    showWarning.value = false
  }, 2000)
}

// 更新分数
const updateScore = (deltaTime) => {
  // 基于速度和距离加分
  if (currentSpeed.value > 60) {
    score.value += deltaTime * 10
  } else if (currentSpeed.value > 30) {
    score.value += deltaTime * 5
  }

  // 安全驾驶奖励
  if (frontVehicleDistance.value > 100) {
    score.value += deltaTime * 3
  }
}

// 渲染游戏
const renderGame = () => {
  if (!ctx) return

  // 清空画布
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

  // 绘制道路
  drawRoad()

  // 绘制车道线
  drawLaneLines()

  // 绘制交通车辆
  drawTrafficVehicles()

  // 绘制玩家车辆
  drawPlayerCar()
}

// 绘制道路
const drawRoad = () => {
  const roadY = 100
  const roadHeight = canvasHeight.value - 200

  // 道路背景
  ctx.fillStyle = '#2d3436'
  ctx.fillRect(100, roadY, roadConfig.totalWidth, roadHeight)

  // 道路边缘
  ctx.strokeStyle = '#fdcb6e'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(100, roadY)
  ctx.lineTo(100, roadY + roadHeight)
  ctx.moveTo(100 + roadConfig.totalWidth, roadY)
  ctx.lineTo(100 + roadConfig.totalWidth, roadY + roadHeight)
  ctx.stroke()
}

// 绘制车道线
const drawLaneLines = () => {
  const roadY = 100
  const roadHeight = canvasHeight.value - 200

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.setLineDash([30, 20])

  // 车道分隔线
  for (let i = 1; i < roadConfig.lanes; i++) {
    const x = 100 + i * roadConfig.laneWidth
    ctx.beginPath()
    ctx.moveTo(x, roadY)
    ctx.lineTo(x, roadY + roadHeight)
    ctx.stroke()
  }

  ctx.setLineDash([])
}

// 绘制交通车辆
const drawTrafficVehicles = () => {
  trafficVehicles.value.forEach(vehicle => {
    drawCar(vehicle.x, vehicle.y, vehicle.width, vehicle.height, vehicle.color, false)
  })
}

// 绘制玩家车辆
const drawPlayerCar = () => {
  const car = playerCar.value
  drawCar(car.x, car.y, car.width, car.height, '#00d4ff', true)
}

// 绘制车辆
const drawCar = (x, y, width, height, color, isPlayer) => {
  ctx.save()
  ctx.translate(x, y)

  // 车身阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 10

  // 车身
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-width / 2, -height / 2, width, height, 8)
  ctx.fill()

  // 车窗
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(-width / 2 + 5, -height / 2 + 10, width - 10, 20)

  // 尾灯
  ctx.fillStyle = isPlayer ? '#ff4757' : '#ff6b6b'
  ctx.fillRect(-width / 2 + 3, height / 2 - 8, 10, 6)
  ctx.fillRect(width / 2 - 13, height / 2 - 8, 10, 6)

  // 车灯
  ctx.fillStyle = '#feca57'
  ctx.fillRect(-width / 2 + 3, -height / 2 + 2, 8, 4)
  ctx.fillRect(width / 2 - 11, -height / 2 + 2, 8, 4)

  // V2X标识（玩家车辆）
  if (isPlayer) {
    ctx.fillStyle = '#00d4ff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('V2X', 0, 5)
  }

  ctx.restore()
}

// 获取随机车辆颜色
const getRandomCarColor = () => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 键盘事件处理
const handleKeyDown = (e) => {
  if (gameState.value !== 'playing') return

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = true
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.down = true
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = true
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = true
      break
    case ' ':
      keys.space = true
      e.preventDefault()
      break
    case 'Escape':
      pauseGame()
      break
  }
}

const handleKeyUp = (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = false
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.down = false
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = false
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = false
      break
    case ' ':
      keys.space = false
      break
  }
}

// 生命周期
onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
  }
  if (gameCanvasRef.value) {
    gameCanvasRef.value.focus()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (warningTimeout) {
    clearTimeout(warningTimeout)
  }
})
</script>

<style lang="scss" scoped>
.driver-training-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%);
}

.game-canvas {
  position: relative;
  width: 1200px;
  height: 700px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  outline: none;

  canvas {
    display: block;
    background: #1a1a2e;
  }
}

// 演示模式标识
.demo-mode-badge {
  position: absolute;
  top: 80px;
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

.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  .hud-top {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;

    > div {
      background: rgba(10, 14, 39, 0.9);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      padding: 10px 20px;
      backdrop-filter: blur(10px);

      .score-label,
      .time-label,
      .level-label {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 4px;
      }

      .score-value,
      .time-value,
      .level-value {
        font-size: 24px;
        font-weight: 700;
        color: #00d4ff;
      }

      .level-value {
        color: #f39c12;
      }
    }
  }

  .hud-bottom {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .controls-hint {
      display: flex;
      gap: 16px;
      background: rgba(10, 14, 39, 0.9);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      padding: 10px 20px;
      backdrop-filter: blur(10px);

      span {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
      }

      &.demo-hint {
        border-color: rgba(102, 126, 234, 0.5);
        background: rgba(102, 126, 234, 0.2);

        span {
          color: #a5b4fc;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    .mission-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 14, 39, 0.9);
      border: 1px solid rgba(255, 165, 2, 0.5);
      border-radius: 8px;
      padding: 10px 20px;
      backdrop-filter: blur(10px);

      .mission-icon {
        font-size: 20px;
      }

      span {
        color: #ffa502;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 14, 39, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;

  .overlay-content {
    text-align: center;
    max-width: 500px;

    .game-title {
      font-size: 36px;
      color: #00d4ff;
      margin-bottom: 16px;
    }

    .game-desc {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      margin-bottom: 32px;
    }

    .difficulty-select {
      margin-bottom: 32px;

      h3 {
        color: #fff;
        margin-bottom: 16px;
      }

      .el-button {
        margin: 0 8px;
        padding: 12px 24px;
      }
    }

    .start-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;

      .el-button {
        padding: 14px 40px;
        font-size: 16px;
      }
    }

    .gameover-title {
      font-size: 42px;
      color: #ff4757;
      margin-bottom: 24px;
    }

    .final-score {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;

      .score-item {
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 8px;
        padding: 16px;

        .label {
          display: block;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-bottom: 8px;
        }

        .value {
          font-size: 24px;
          font-weight: 700;
          color: #00d4ff;
        }
      }
    }

    .result-feedback {
      margin-bottom: 32px;

      .rating {
        font-size: 24px;
        font-weight: 600;

        &.perfect {
          color: #f1c40f;
        }
        &.good {
          color: #2ecc71;
        }
        &.normal {
          color: #3498db;
        }
        &.need-practice {
          color: #e74c3c;
        }
      }
    }
  }
}

.realtime-warning {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border-radius: 8px;
  z-index: 50;

  &.collision {
    background: rgba(255, 71, 87, 0.9);
    border: 2px solid #ff4757;
    animation: shake 0.5s;
  }

  &.warning {
    background: rgba(255, 165, 2, 0.9);
    border: 2px solid #ffa502;
  }

  .warning-icon {
    font-size: 28px;
  }

  .warning-text {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(-50%); }
  25% { transform: translateX(calc(-50% - 10px)); }
  75% { transform: translateX(calc(-50% + 10px)); }
}

.warning-slide-enter-active,
.warning-slide-leave-active {
  transition: all 0.3s ease;
}

.warning-slide-enter-from,
.warning-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.speedometer {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 16px 24px;
  text-align: center;
  backdrop-filter: blur(10px);

  .speed-value {
    font-size: 48px;
    font-weight: 700;
    color: #00d4ff;
    line-height: 1;
  }

  .speed-unit {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }

  .speed-bar {
    width: 100px;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;

    .speed-fill {
      height: 100%;
      background: linear-gradient(90deg, #2ecc71, #f39c12, #e74c3c);
      transition: width 0.1s;
    }
  }
}

.v2x-info-panel {
  position: absolute;
  top: 100px;
  right: 20px;
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
  min-width: 160px;
  backdrop-filter: blur(10px);

  .v2x-title {
    font-size: 14px;
    font-weight: 600;
    color: #00d4ff;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .v2x-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }

    .value {
      font-size: 14px;
      font-weight: 600;
      color: #fff;

      &.danger {
        color: #ff4757;
      }
    }
  }
}
</style>
