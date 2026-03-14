// =====================================================
// 热力图默认数据 - 模拟城市道路路段风险数据
// 数据覆盖北京市中心区域，包含多种风险等级
// =====================================================

/**
 * 默认路段数据（模拟北京市中心道路网络）
 * geometry: [[lng, lat], ...] 折线坐标
 * risk: 0-1 碰撞风险指数
 */
export const defaultRoadSegments = [
  // ========== 高风险路段 (risk >= 0.75) ==========
  {
    id: 'road_001',
    name: '长安街-西单路口',
    geometry: [[116.373, 39.913], [116.378, 39.913], [116.383, 39.913]],
    speed: 35,
    density: 185,
    risk: 0.92
  },
  {
    id: 'road_002',
    name: '东三环-国贸桥',
    geometry: [[116.460, 39.908], [116.462, 39.913], [116.464, 39.918]],
    speed: 28,
    density: 195,
    risk: 0.88
  },
  {
    id: 'road_003',
    name: '西二环-复兴门',
    geometry: [[116.350, 39.908], [116.352, 39.913], [116.354, 39.918]],
    speed: 32,
    density: 190,
    risk: 0.85
  },
  {
    id: 'road_004',
    name: '东直门-交通枢纽',
    geometry: [[116.434, 39.942], [116.438, 39.944], [116.442, 39.946]],
    speed: 25,
    density: 200,
    risk: 0.82
  },
  {
    id: 'road_005',
    name: '西直门-立交桥',
    geometry: [[116.348, 39.942], [116.352, 39.944], [116.356, 39.946]],
    speed: 30,
    density: 188,
    risk: 0.79
  },
  {
    id: 'road_006',
    name: '崇文门-路口',
    geometry: [[116.416, 39.898], [116.420, 39.900], [116.424, 39.902]],
    speed: 22,
    density: 198,
    risk: 0.86
  },
  {
    id: 'road_007',
    name: '宣武门-商业区',
    geometry: [[116.370, 39.892], [116.374, 39.894], [116.378, 39.896]],
    speed: 28,
    density: 192,
    risk: 0.81
  },
  {
    id: 'road_008',
    name: '朝阳门-路口',
    geometry: [[116.426, 39.930], [116.430, 39.932], [116.434, 39.934]],
    speed: 35,
    density: 180,
    risk: 0.77
  },

  // ========== 中高风险路段 (0.5 <= risk < 0.75) ==========
  {
    id: 'road_009',
    name: '北三环-中路',
    geometry: [[116.380, 39.960], [116.390, 39.962], [116.400, 39.964]],
    speed: 45,
    density: 145,
    risk: 0.72
  },
  {
    id: 'road_010',
    name: '南三环-中路',
    geometry: [[116.380, 39.855], [116.390, 39.857], [116.400, 39.859]],
    speed: 50,
    density: 135,
    risk: 0.68
  },
  {
    id: 'road_011',
    name: '建国门外大街',
    geometry: [[116.448, 39.908], [116.454, 39.910], [116.460, 39.912]],
    speed: 42,
    density: 155,
    risk: 0.65
  },
  {
    id: 'road_012',
    name: '阜成门外大街',
    geometry: [[116.338, 39.932], [116.344, 39.934], [116.350, 39.936]],
    speed: 48,
    density: 140,
    risk: 0.62
  },
  {
    id: 'road_013',
    name: '德胜门-大街',
    geometry: [[116.378, 39.950], [116.384, 39.952], [116.390, 39.954]],
    speed: 38,
    density: 160,
    risk: 0.70
  },
  {
    id: 'road_014',
    name: '安定门-大街',
    geometry: [[116.408, 39.950], [116.414, 39.952], [116.420, 39.954]],
    speed: 40,
    density: 150,
    risk: 0.67
  },
  {
    id: 'road_015',
    name: '广安门-大街',
    geometry: [[116.358, 39.885], [116.364, 39.887], [116.370, 39.889]],
    speed: 44,
    density: 148,
    risk: 0.64
  },
  {
    id: 'road_016',
    name: '广渠门-大街',
    geometry: [[116.430, 39.885], [116.436, 39.887], [116.442, 39.889]],
    speed: 46,
    density: 142,
    risk: 0.61
  },
  {
    id: 'road_017',
    name: '西四-东四',
    geometry: [[116.378, 39.928], [116.390, 39.928], [116.402, 39.928]],
    speed: 35,
    density: 170,
    risk: 0.58
  },
  {
    id: 'road_018',
    name: '前门-大街',
    geometry: [[116.395, 39.900], [116.400, 39.902], [116.405, 39.904]],
    speed: 32,
    density: 175,
    risk: 0.55
  },
  {
    id: 'road_019',
    name: '东四-北大街',
    geometry: [[116.418, 39.932], [116.420, 39.938], [116.422, 39.944]],
    speed: 38,
    density: 158,
    risk: 0.63
  },
  {
    id: 'road_020',
    name: '新街口-南大街',
    geometry: [[116.362, 39.938], [116.366, 39.942], [116.370, 39.946]],
    speed: 36,
    density: 165,
    risk: 0.59
  },

  // ========== 中低风险路段 (0.25 <= risk < 0.5) ==========
  {
    id: 'road_021',
    name: '北四环-中路',
    geometry: [[116.380, 39.978], [116.395, 39.980], [116.410, 39.982]],
    speed: 58,
    density: 95,
    risk: 0.48
  },
  {
    id: 'road_022',
    name: '南四环-中路',
    geometry: [[116.380, 39.835], [116.395, 39.837], [116.410, 39.839]],
    speed: 62,
    density: 88,
    risk: 0.45
  },
  {
    id: 'road_023',
    name: '东四环-中路',
    geometry: [[116.480, 39.880], [116.482, 39.900], [116.484, 39.920]],
    speed: 65,
    density: 82,
    risk: 0.42
  },
  {
    id: 'road_024',
    name: '西四环-中路',
    geometry: [[116.290, 39.880], [116.292, 39.900], [116.294, 39.920]],
    speed: 68,
    density: 78,
    risk: 0.40
  },
  {
    id: 'road_025',
    name: '中关村大街',
    geometry: [[116.310, 39.970], [116.316, 39.978], [116.322, 39.986]],
    speed: 52,
    density: 105,
    risk: 0.46
  },
  {
    id: 'road_026',
    name: '学院路',
    geometry: [[116.340, 39.975], [116.348, 39.983], [116.356, 39.991]],
    speed: 55,
    density: 98,
    risk: 0.44
  },
  {
    id: 'road_027',
    name: '平安大街',
    geometry: [[116.372, 39.936], [116.388, 39.936], [116.404, 39.936]],
    speed: 48,
    density: 110,
    risk: 0.50
  },
  {
    id: 'road_028',
    name: '两广大街',
    geometry: [[116.372, 39.896], [116.388, 39.896], [116.404, 39.896]],
    speed: 50,
    density: 108,
    risk: 0.47
  },
  {
    id: 'road_029',
    name: '朝阳北路',
    geometry: [[116.460, 39.922], [116.472, 39.926], [116.484, 39.930]],
    speed: 56,
    density: 92,
    risk: 0.43
  },
  {
    id: 'road_030',
    name: '莲花桥-路',
    geometry: [[116.328, 39.895], [116.334, 39.898], [116.340, 39.901]],
    speed: 54,
    density: 96,
    risk: 0.41
  },
  {
    id: 'road_031',
    name: '马家堡路',
    geometry: [[116.375, 39.850], [116.378, 39.858], [116.381, 39.866]],
    speed: 58,
    density: 90,
    risk: 0.38
  },
  {
    id: 'road_032',
    name: '望京街',
    geometry: [[116.470, 39.990], [116.478, 39.996], [116.486, 40.002]],
    speed: 52,
    density: 102,
    risk: 0.49
  },
  {
    id: 'road_033',
    name: '三里屯路',
    geometry: [[116.452, 39.930], [116.456, 39.934], [116.460, 39.938]],
    speed: 45,
    density: 115,
    risk: 0.52
  },
  {
    id: 'road_034',
    name: '金融街-主路',
    geometry: [[116.360, 39.916], [116.366, 39.918], [116.372, 39.920]],
    speed: 42,
    density: 125,
    risk: 0.54
  },
  {
    id: 'road_035',
    name: 'CBD核心区',
    geometry: [[116.458, 39.914], [116.462, 39.918], [116.466, 39.922]],
    speed: 40,
    density: 130,
    risk: 0.56
  },

  // ========== 低风险路段 (risk < 0.25) ==========
  {
    id: 'road_036',
    name: '机场高速',
    geometry: [[116.480, 40.030], [116.520, 40.050], [116.560, 40.070]],
    speed: 95,
    density: 35,
    risk: 0.18
  },
  {
    id: 'road_037',
    name: '京承高速-入口',
    geometry: [[116.480, 40.010], [116.500, 40.020], [116.520, 40.030]],
    speed: 88,
    density: 42,
    risk: 0.20
  },
  {
    id: 'road_038',
    name: '京开高速-入口',
    geometry: [[116.370, 39.820], [116.380, 39.805], [116.390, 39.790]],
    speed: 92,
    density: 38,
    risk: 0.17
  },
  {
    id: 'road_039',
    name: '京通快速',
    geometry: [[116.500, 39.910], [116.540, 39.915], [116.580, 39.920]],
    speed: 78,
    density: 52,
    risk: 0.22
  },
  {
    id: 'road_040',
    name: '北五环-东段',
    geometry: [[116.420, 40.020], [116.450, 40.022], [116.480, 40.024]],
    speed: 85,
    density: 45,
    risk: 0.15
  },
  {
    id: 'road_041',
    name: '南五环-西段',
    geometry: [[116.280, 39.790], [116.310, 39.792], [116.340, 39.794]],
    speed: 90,
    density: 40,
    risk: 0.14
  },
  {
    id: 'road_042',
    name: '奥林匹克公园路',
    geometry: [[116.388, 40.002], [116.396, 40.008], [116.404, 40.014]],
    speed: 60,
    density: 65,
    risk: 0.24
  },
  {
    id: 'road_043',
    name: '颐和园路',
    geometry: [[116.275, 39.998], [116.285, 40.004], [116.295, 40.010]],
    speed: 55,
    density: 70,
    risk: 0.23
  },
  {
    id: 'road_044',
    name: '香山路',
    geometry: [[116.210, 40.000], [116.225, 40.005], [116.240, 40.010]],
    speed: 52,
    density: 68,
    risk: 0.19
  },
  {
    id: 'road_045',
    name: '大兴路',
    geometry: [[116.340, 39.760], [116.355, 39.750], [116.370, 39.740]],
    speed: 72,
    density: 55,
    risk: 0.21
  },
  {
    id: 'road_046',
    name: '通州城区-主路',
    geometry: [[116.640, 39.908], [116.658, 39.912], [116.676, 39.916]],
    speed: 58,
    density: 72,
    risk: 0.25
  },
  {
    id: 'road_047',
    name: '亦庄开发区路',
    geometry: [[116.490, 39.800], [116.505, 39.805], [116.520, 39.810]],
    speed: 65,
    density: 58,
    risk: 0.16
  },
  {
    id: 'road_048',
    name: '顺义城区路',
    geometry: [[116.650, 40.130], [116.665, 40.135], [116.680, 40.140]],
    speed: 62,
    density: 62,
    risk: 0.18
  },
  {
    id: 'road_049',
    name: '昌平城区路',
    geometry: [[116.220, 40.210], [116.235, 40.215], [116.250, 40.220]],
    speed: 58,
    density: 66,
    risk: 0.20
  },
  {
    id: 'road_050',
    name: '房山城区路',
    geometry: [[116.130, 39.730], [116.145, 39.735], [116.160, 39.740]],
    speed: 55,
    density: 70,
    risk: 0.22
  },

  // ========== 更多路段填充 ==========
  {
    id: 'road_051',
    name: '国贸桥-辅路',
    geometry: [[116.458, 39.906], [116.462, 39.908], [116.466, 39.910]],
    speed: 38,
    density: 168,
    risk: 0.74
  },
  {
    id: 'road_052',
    name: '燕莎桥-路口',
    geometry: [[116.462, 39.950], [116.466, 39.954], [116.470, 39.958]],
    speed: 42,
    density: 148,
    risk: 0.63
  },
  {
    id: 'road_053',
    name: '三元桥',
    geometry: [[116.458, 39.968], [116.462, 39.972], [116.466, 39.976]],
    speed: 48,
    density: 125,
    risk: 0.51
  },
  {
    id: 'road_054',
    name: '四惠桥',
    geometry: [[116.490, 39.908], [116.494, 39.912], [116.498, 39.916]],
    speed: 55,
    density: 95,
    risk: 0.39
  },
  {
    id: 'road_055',
    name: '双井桥',
    geometry: [[116.448, 39.892], [116.452, 39.896], [116.456, 39.900]],
    speed: 45,
    density: 138,
    risk: 0.57
  },
  {
    id: 'road_056',
    name: '劲松桥',
    geometry: [[116.456, 39.880], [116.460, 39.884], [116.464, 39.888]],
    speed: 50,
    density: 118,
    risk: 0.48
  },
  {
    id: 'road_057',
    name: '潘家园桥',
    geometry: [[116.462, 39.868], [116.466, 39.872], [116.470, 39.876]],
    speed: 52,
    density: 108,
    risk: 0.44
  },
  {
    id: 'road_058',
    name: '分钟寺桥',
    geometry: [[116.470, 39.856], [116.474, 39.860], [116.478, 39.864]],
    speed: 58,
    density: 88,
    risk: 0.35
  },
  {
    id: 'road_059',
    name: '木樨园桥',
    geometry: [[116.402, 39.858], [116.406, 39.862], [116.410, 39.866]],
    speed: 48,
    density: 132,
    risk: 0.53
  },
  {
    id: 'road_060',
    name: '赵公口桥',
    geometry: [[116.420, 39.850], [116.424, 39.854], [116.428, 39.858]],
    speed: 52,
    density: 122,
    risk: 0.49
  }
]

/**
 * 生成模拟路段数据
 * @param {number} count - 路段数量
 */
export const generateMockSegments = (count = 50) => {
  const segments = []
  const baseLng = 116.39
  const baseLat = 39.90
  
  for (let i = 0; i < count; i++) {
    const startLng = baseLng + (Math.random() - 0.5) * 0.15
    const startLat = baseLat + (Math.random() - 0.5) * 0.15
    
    // 使用更真实的风险分布
    const riskRandom = Math.random()
    let risk
    if (riskRandom < 0.3) {
      risk = 0.1 + Math.random() * 0.15 // 低风险
    } else if (riskRandom < 0.6) {
      risk = 0.25 + Math.random() * 0.25 // 中低风险
    } else if (riskRandom < 0.85) {
      risk = 0.5 + Math.random() * 0.25 // 中高风险
    } else {
      risk = 0.75 + Math.random() * 0.25 // 高风险
    }
    
    segments.push({
      id: `road_gen_${String(i + 1).padStart(3, '0')}`,
      name: `模拟路段 ${i + 1}`,
      geometry: [
        [startLng, startLat],
        [startLng + Math.random() * 0.02, startLat + Math.random() * 0.02],
        [startLng + Math.random() * 0.04, startLat + Math.random() * 0.04]
      ],
      speed: Math.floor(25 + Math.random() * 65),
      density: Math.floor(35 + Math.random() * 165),
      risk: risk
    })
  }
  
  return segments
}

/**
 * 获取风险统计信息
 */
export const getRiskStats = (segments) => {
  const stats = {
    total: segments.length,
    low: 0,
    mediumLow: 0,
    mediumHigh: 0,
    high: 0,
    avgRisk: 0
  }
  
  let sum = 0
  segments.forEach(s => {
    sum += s.risk
    if (s.risk < 0.25) stats.low++
    else if (s.risk < 0.5) stats.mediumLow++
    else if (s.risk < 0.75) stats.mediumHigh++
    else stats.high++
  })
  
  stats.avgRisk = segments.length > 0 ? sum / segments.length : 0
  
  return stats
}
