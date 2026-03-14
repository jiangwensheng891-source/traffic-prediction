// =====================================================
// 场景配置文件 - 5G-V2X车联网可视化系统
// 定义5个核心场景的参数范围、道路布局、盲区类型、核心指标
// =====================================================

export const sceneConfigs = {
  // 城市道路场景
  city: {
    id: 'city',
    name: '城市道路',
    description: '城市十字路口场景，建筑物和前车遮挡',
    speedRange: [20, 60],      // 车速范围 km/h
    densityRange: [100, 300],  // 车辆密度范围 veh/km
    roadLayout: 'crossroad',   // 道路布局：十字路
    blindSpots: ['building', 'frontVehicle'], // 盲区类型
    coreIndicators: ['avoidanceSuccessRate', 'advanceWarningTime'], // 核心指标
    roadConfig: {
      lanes: 4,
      laneWidth: 3.5,
      hasCrossroad: true,
      buildingHeight: 30,
      curveRadius: 0
    }
  },
  
  // 快速路场景
  expressway: {
    id: 'expressway',
    name: '快速路',
    description: '城市快速路场景，路口和前车遮挡',
    speedRange: [60, 90],
    densityRange: [50, 200],
    roadLayout: 'straight',
    blindSpots: ['intersection', 'frontVehicle'],
    coreIndicators: ['packetLossRate150m', 'throughput'],
    roadConfig: {
      lanes: 6,
      laneWidth: 3.75,
      hasCrossroad: false,
      buildingHeight: 0,
      curveRadius: 0
    }
  },
  
  // 高速公路场景
  highway: {
    id: 'highway',
    name: '高速公路',
    description: '高速公路长直线场景，大型车辆遮挡',
    speedRange: [90, 120],
    densityRange: [50, 150],
    roadLayout: 'longStraight',
    blindSpots: ['heavyVehicle', 'frontVehicle'],
    coreIndicators: ['advanceWarningTime', 'wirelessBlindSpot'],
    roadConfig: {
      lanes: 4,
      laneWidth: 3.75,
      hasCrossroad: false,
      buildingHeight: 0,
      curveRadius: 0
    }
  },
  
  // 匝道场景
  ramp: {
    id: 'ramp',
    name: '匝道',
    description: '匝道弯道场景，弯道和匝道口遮挡',
    speedRange: [30, 50],
    densityRange: [50, 150],
    roadLayout: 'curve',
    blindSpots: ['curve', 'rampEntrance'],
    coreIndicators: ['avoidanceSuccessRate', 'avgMsgDelay'],
    roadConfig: {
      lanes: 2,
      laneWidth: 3.5,
      hasCrossroad: false,
      buildingHeight: 0,
      curveRadius: 100
    }
  },
  
  // 隧道场景
  tunnel: {
    id: 'tunnel',
    name: '隧道',
    description: '隧道封闭场景，隧道内遮挡和信号衰减',
    speedRange: [40, 80],
    densityRange: [50, 200],
    roadLayout: 'tunnel',
    blindSpots: ['tunnel', 'signalAttenuation'],
    coreIndicators: ['msgSuccessRate150m', 'channelBusyRate'],
    roadConfig: {
      lanes: 4,
      laneWidth: 3.75,
      hasCrossroad: false,
      buildingHeight: 0,
      curveRadius: 0,
      tunnelLength: 500
    }
  }
}

// 场景列表（用于渲染按钮组）
export const sceneList = Object.keys(sceneConfigs).map(key => ({
  id: key,
  name: sceneConfigs[key].name
}))
