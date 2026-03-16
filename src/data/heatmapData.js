// =====================================================
// 热力图默认数据 - 珠海金湾区城市道路路段风险数据
// 数据覆盖珠海市金湾区，包含多种风险等级和道路类型
// =====================================================

/**
 * 珠海金湾区路段数据
 * geometry: [[lng, lat], ...] 折线坐标
 * risk: 0-1 碰撞风险指数
 * roadType: 道路类型 (expressway-高速, urban-城市道路, ramp-匝道, ring-快速路)
 */
export const defaultRoadSegments = [
  // ========== 高风险路段 (risk >= 0.75) ==========
  // 机场路-金湾段（高速入口附近）
  {
    id: 'road_001',
    name: '机场路-金湾立交段',
    geometry: [[113.3856, 22.1389], [113.3825, 22.1402], [113.3794, 22.1415]],
    speed: 35,
    density: 185,
    risk: 0.92,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.85,
      noon: 0.75,
      evening: 0.92,
      night: 0.68
    }
  },
  // 珠海大道东段（城区主干道）
  {
    id: 'road_002',
    name: '珠海大道-金海岸段',
    geometry: [[113.3615, 22.1428], [113.3689, 22.1456], [113.3763, 22.1484]],
    speed: 28,
    density: 195,
    risk: 0.88,
    roadType: 'urban',
    timeSlots: {
      morning: 0.78,
      noon: 0.65,
      evening: 0.88,
      night: 0.55
    }
  },
  // 金海大桥连接段
  {
    id: 'road_003',
    name: '金海大桥-互通段',
    geometry: [[113.3845, 22.1289], [113.3880, 22.1312], [113.3915, 22.1335]],
    speed: 32,
    density: 190,
    risk: 0.85,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.72,
      noon: 0.58,
      evening: 0.85,
      night: 0.45
    }
  },
  // 机场东路
  {
    id: 'road_004',
    name: '机场东路-候机楼段',
    geometry: [[113.3728, 22.1356], [113.3765, 22.1348], [113.3802, 22.1340]],
    speed: 25,
    density: 200,
    risk: 0.82,
    roadType: 'urban',
    timeSlots: {
      morning: 0.68,
      noon: 0.72,
      evening: 0.82,
      night: 0.52
    }
  },
  // 湖心路交叉口
  {
    id: 'road_005',
    name: '湖心路-金湾段',
    geometry: [[113.3567, 22.1389], [113.3534, 22.1412], [113.3501, 22.1435]],
    speed: 30,
    density: 188,
    risk: 0.79,
    roadType: 'ramp',
    timeSlots: {
      morning: 0.75,
      noon: 0.62,
      evening: 0.79,
      night: 0.48
    }
  },
  // 红旗路
  {
    id: 'road_006',
    name: '红旗路-广安路段',
    geometry: [[113.3698, 22.1256], [113.3735, 22.1234], [113.3772, 22.1212]],
    speed: 22,
    density: 198,
    risk: 0.86,
    roadType: 'urban',
    timeSlots: {
      morning: 0.82,
      noon: 0.70,
      evening: 0.86,
      night: 0.58
    }
  },
  // 藤山一路
  {
    id: 'road_007',
    name: '藤山一路-商业区',
    geometry: [[113.3589, 22.1189], [113.3625, 22.1202], [113.3661, 22.1215]],
    speed: 28,
    density: 192,
    risk: 0.81,
    roadType: 'urban',
    timeSlots: {
      morning: 0.68,
      noon: 0.75,
      evening: 0.81,
      night: 0.52
    }
  },
  // 金湾互通
  {
    id: 'road_008',
    name: '金湾互通-匝道',
    geometry: [[113.3912, 22.1456], [113.3945, 22.1432], [113.3978, 22.1408]],
    speed: 35,
    density: 180,
    risk: 0.77,
    roadType: 'ramp',
    timeSlots: {
      morning: 0.70,
      noon: 0.55,
      evening: 0.77,
      night: 0.42
    }
  },

  // ========== 中高风险路段 (0.5 <= risk < 0.75) ==========
  // 珠海大道西段
  {
    id: 'road_009',
    name: '珠海大道-斗门段',
    geometry: [[113.3615, 22.1512], [113.3534, 22.1545], [113.3453, 22.1578]],
    speed: 45,
    density: 145,
    risk: 0.72,
    roadType: 'ring',
    timeSlots: {
      morning: 0.62,
      noon: 0.48,
      evening: 0.72,
      night: 0.35
    }
  },
  // 平沙路
  {
    id: 'road_010',
    name: '平沙路-南水段',
    geometry: [[113.3567, 22.1089], [113.3489, 22.1023], [113.3411, 22.0957]],
    speed: 50,
    density: 135,
    risk: 0.68,
    roadType: 'urban',
    timeSlots: {
      morning: 0.55,
      noon: 0.42,
      evening: 0.68,
      night: 0.32
    }
  },
  // 高栏港高速入口
  {
    id: 'road_011',
    name: '高栏港高速-入口段',
    geometry: [[113.4012, 22.1356], [113.4068, 22.1389], [113.4124, 22.1422]],
    speed: 42,
    density: 155,
    risk: 0.65,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.58,
      noon: 0.45,
      evening: 0.65,
      night: 0.38
    }
  },
  // 机场高速
  {
    id: 'road_012',
    name: '机场高速-金湾出口',
    geometry: [[113.3689, 22.1512], [113.3745, 22.1545], [113.3801, 22.1578]],
    speed: 48,
    density: 140,
    risk: 0.62,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.52,
      noon: 0.40,
      evening: 0.62,
      night: 0.30
    }
  },
  // 金海岸大道
  {
    id: 'road_013',
    name: '金海岸大道-东西段',
    geometry: [[113.3689, 22.1289], [113.3756, 22.1312], [113.3823, 22.1335]],
    speed: 38,
    density: 160,
    risk: 0.70,
    roadType: 'urban',
    timeSlots: {
      morning: 0.60,
      noon: 0.52,
      evening: 0.70,
      night: 0.42
    }
  },
  // 虹晖路
  {
    id: 'road_014',
    name: '虹晖路-工业区',
    geometry: [[113.3456, 22.1356], [113.3423, 22.1389], [113.3390, 22.1422]],
    speed: 40,
    density: 150,
    risk: 0.67,
    roadType: 'urban',
    timeSlots: {
      morning: 0.58,
      noon: 0.48,
      evening: 0.67,
      night: 0.38
    }
  },
  // 珠峰大道
  {
    id: 'road_015',
    name: '珠峰大道-乾务段',
    geometry: [[113.3234, 22.1189], [113.3189, 22.1223], [113.3144, 22.1257]],
    speed: 44,
    density: 148,
    risk: 0.64,
    roadType: 'ring',
    timeSlots: {
      morning: 0.52,
      noon: 0.42,
      evening: 0.64,
      night: 0.32
    }
  },
  // 中兴路
  {
    id: 'road_016',
    name: '中兴路-三灶段',
    geometry: [[113.3567, 22.1089], [113.3612, 22.1056], [113.3657, 22.1023]],
    speed: 46,
    density: 142,
    risk: 0.61,
    roadType: 'urban',
    timeSlots: {
      morning: 0.50,
      noon: 0.45,
      evening: 0.61,
      night: 0.35
    }
  },
  // 映月路
  {
    id: 'road_017',
    name: '映月路-小林段',
    geometry: [[113.3712, 22.1123], [113.3768, 22.1156], [113.3824, 22.1189]],
    speed: 35,
    density: 170,
    risk: 0.58,
    roadType: 'urban',
    timeSlots: {
      morning: 0.55,
      noon: 0.48,
      evening: 0.58,
      night: 0.40
    }
  },
  // 双湖路
  {
    id: 'road_018',
    name: '双湖路-奥体中心',
    geometry: [[113.3895, 22.1356], [113.3945, 22.1323], [113.3995, 22.1290]],
    speed: 32,
    density: 175,
    risk: 0.55,
    roadType: 'urban',
    timeSlots: {
      morning: 0.48,
      noon: 0.52,
      evening: 0.55,
      night: 0.38
    }
  },
  // 创业路
  {
    id: 'road_019',
    name: '创业路-科技园',
    geometry: [[113.3567, 22.1456], [113.3523, 22.1489], [113.3479, 22.1522]],
    speed: 38,
    density: 158,
    risk: 0.63,
    roadType: 'urban',
    timeSlots: {
      morning: 0.58,
      noon: 0.52,
      evening: 0.63,
      night: 0.42
    }
  },
  // 金鑫路
  {
    id: 'road_020',
    name: '金鑫路-产业园',
    geometry: [[113.3689, 22.1523], [113.3734, 22.1556], [113.3779, 22.1589]],
    speed: 36,
    density: 165,
    risk: 0.59,
    roadType: 'urban',
    timeSlots: {
      morning: 0.52,
      noon: 0.48,
      evening: 0.59,
      night: 0.35
    }
  },

  // ========== 中低风险路段 (0.25 <= risk < 0.5) ==========
  // 珠海大道西延段
  {
    id: 'road_021',
    name: '珠海大道-平沙段',
    geometry: [[113.3456, 22.1656], [113.3334, 22.1701], [113.3212, 22.1746]],
    speed: 58,
    density: 95,
    risk: 0.48,
    roadType: 'ring',
    timeSlots: {
      morning: 0.38,
      noon: 0.30,
      evening: 0.48,
      night: 0.25
    }
  },
  // 高栏港大道
  {
    id: 'road_022',
    name: '高栏港大道-南水段',
    geometry: [[113.4023, 22.1089], [113.3956, 22.1023], [113.3889, 22.0957]],
    speed: 62,
    density: 88,
    risk: 0.45,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.35,
      noon: 0.28,
      evening: 0.45,
      night: 0.22
    }
  },
  // 机场北路
  {
    id: 'road_023',
    name: '机场北路-工业区',
    geometry: [[113.3923, 22.1512], [113.3989, 22.1545], [113.4055, 22.1578]],
    speed: 65,
    density: 82,
    risk: 0.42,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.32,
      noon: 0.28,
      evening: 0.42,
      night: 0.20
    }
  },
  // 港务路
  {
    id: 'road_024',
    name: '港务路-码头段',
    geometry: [[113.4156, 22.1089], [113.4223, 22.1123], [113.4290, 22.1157]],
    speed: 68,
    density: 78,
    risk: 0.40,
    roadType: 'urban',
    timeSlots: {
      morning: 0.30,
      noon: 0.35,
      evening: 0.40,
      night: 0.25
    }
  },
  // 临港路
  {
    id: 'road_025',
    name: '临港路-石化区',
    geometry: [[113.4089, 22.1189], [113.4034, 22.1156], [113.3979, 22.1123]],
    speed: 52,
    density: 105,
    risk: 0.46,
    roadType: 'urban',
    timeSlots: {
      morning: 0.42,
      noon: 0.38,
      evening: 0.46,
      night: 0.30
    }
  },
  // 大道物流园路
  {
    id: 'road_026',
    name: '物流园路-配送中心',
    geometry: [[113.3823, 22.1589], [113.3778, 22.1556], [113.3733, 22.1523]],
    speed: 55,
    density: 98,
    risk: 0.44,
    roadType: 'urban',
    timeSlots: {
      morning: 0.40,
      noon: 0.35,
      evening: 0.44,
      night: 0.28
    }
  },
  // 金粮路
  {
    id: 'road_027',
    name: '金粮路-农业园',
    geometry: [[113.3256, 22.1089], [113.3301, 22.1123], [113.3346, 22.1157]],
    speed: 48,
    density: 110,
    risk: 0.50,
    roadType: 'urban',
    timeSlots: {
      morning: 0.45,
      noon: 0.40,
      evening: 0.50,
      night: 0.32
    }
  },
  // 顺发路
  {
    id: 'road_028',
    name: '顺发路-红旗镇',
    geometry: [[113.3423, 22.1189], [113.3468, 22.1223], [113.3513, 22.1257]],
    speed: 50,
    density: 108,
    risk: 0.47,
    roadType: 'urban',
    timeSlots: {
      morning: 0.42,
      noon: 0.38,
      evening: 0.47,
      night: 0.30
    }
  },
  // 广安路
  {
    id: 'road_029',
    name: '广安路-市政段',
    geometry: [[113.3589, 22.1289], [113.3545, 22.1256], [113.3501, 22.1223]],
    speed: 56,
    density: 92,
    risk: 0.43,
    roadType: 'urban',
    timeSlots: {
      morning: 0.38,
      noon: 0.32,
      evening: 0.43,
      night: 0.25
    }
  },
  // 东成路
  {
    id: 'road_030',
    name: '东成路-三灶镇',
    geometry: [[113.3723, 22.1023], [113.3778, 22.1056], [113.3833, 22.1089]],
    speed: 54,
    density: 96,
    risk: 0.41,
    roadType: 'urban',
    timeSlots: {
      morning: 0.35,
      noon: 0.32,
      evening: 0.41,
      night: 0.28
    }
  },
  // 鱼林路
  {
    id: 'road_031',
    name: '鱼林路-工业区',
    geometry: [[113.3895, 22.1189], [113.3945, 22.1156], [113.3995, 22.1123]],
    speed: 58,
    density: 90,
    risk: 0.38,
    roadType: 'urban',
    timeSlots: {
      morning: 0.32,
      noon: 0.30,
      evening: 0.38,
      night: 0.22
    }
  },
  // 矿山路
  {
    id: 'road_032',
    name: '矿山路-旧工业区',
    geometry: [[113.3156, 22.1256], [113.3201, 22.1290], [113.3246, 22.1324]],
    speed: 52,
    density: 102,
    risk: 0.49,
    roadType: 'urban',
    timeSlots: {
      morning: 0.42,
      noon: 0.38,
      evening: 0.49,
      night: 0.32
    }
  },
  // 丽鑫路
  {
    id: 'road_033',
    name: '丽鑫路-商业区',
    geometry: [[113.3656, 22.1356], [113.3701, 22.1390], [113.3746, 22.1424]],
    speed: 45,
    density: 115,
    risk: 0.52,
    roadType: 'urban',
    timeSlots: {
      morning: 0.45,
      noon: 0.48,
      evening: 0.52,
      night: 0.35
    }
  },
  // 金铭路
  {
    id: 'road_034',
    name: '金铭路-研发园',
    geometry: [[113.3789, 22.1456], [113.3834, 22.1490], [113.3879, 22.1524]],
    speed: 42,
    density: 125,
    risk: 0.54,
    roadType: 'urban',
    timeSlots: {
      morning: 0.48,
      noon: 0.45,
      evening: 0.54,
      night: 0.38
    }
  },
  // 联邦制药路
  {
    id: 'road_035',
    name: '联邦制药-厂区路',
    geometry: [[113.3956, 22.1289], [113.4001, 22.1323], [113.4046, 22.1357]],
    speed: 40,
    density: 130,
    risk: 0.56,
    roadType: 'urban',
    timeSlots: {
      morning: 0.50,
      noon: 0.42,
      evening: 0.56,
      night: 0.35
    }
  },

  // ========== 低风险路段 (risk < 0.25) ==========
  // 机场高速
  {
    id: 'road_036',
    name: '机场高速-珠海段',
    geometry: [[113.3612, 22.1689], [113.3425, 22.1756], [113.3238, 22.1823]],
    speed: 95,
    density: 35,
    risk: 0.18,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.15,
      noon: 0.12,
      evening: 0.18,
      night: 0.08
    }
  },
  // 高栏港高速
  {
    id: 'road_037',
    name: '高栏港高速-主路',
    geometry: [[113.4156, 22.1356], [113.4325, 22.1423], [113.4494, 22.1490]],
    speed: 88,
    density: 42,
    risk: 0.20,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.18,
      noon: 0.15,
      evening: 0.20,
      night: 0.10
    }
  },
  // 江珠高速
  {
    id: 'road_038',
    name: '江珠高速-斗门段',
    geometry: [[113.3056, 22.1089], [113.2923, 22.1156], [113.2790, 22.1223]],
    speed: 92,
    density: 38,
    risk: 0.17,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.14,
      noon: 0.12,
      evening: 0.17,
      night: 0.08
    }
  },
  // 金海东路
  {
    id: 'road_039',
    name: '金海东路-海岸线',
    geometry: [[113.4023, 22.1512], [113.4189, 22.1556], [113.4355, 22.1600]],
    speed: 78,
    density: 52,
    risk: 0.22,
    roadType: 'ring',
    timeSlots: {
      morning: 0.18,
      noon: 0.15,
      evening: 0.22,
      night: 0.12
    }
  },
  // 珠海西站路
  {
    id: 'road_040',
    name: '珠海西站-铁路段',
    geometry: [[113.3256, 22.1656], [113.3189, 22.1723], [113.3122, 22.1790]],
    speed: 85,
    density: 45,
    risk: 0.15,
    roadType: 'ring',
    timeSlots: {
      morning: 0.12,
      noon: 0.10,
      evening: 0.15,
      night: 0.06
    }
  },
  // 富山工业园路
  {
    id: 'road_041',
    name: '富山工业园-主干道',
    geometry: [[113.2989, 22.1089], [113.2856, 22.1023], [113.2723, 22.0957]],
    speed: 90,
    density: 40,
    risk: 0.14,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.12,
      noon: 0.10,
      evening: 0.14,
      night: 0.06
    }
  },
  // 乾务工业园路
  {
    id: 'road_042',
    name: '乾务工业园-路段',
    geometry: [[113.3156, 22.1289], [113.3223, 22.1356], [113.3290, 22.1423]],
    speed: 60,
    density: 65,
    risk: 0.24,
    roadType: 'urban',
    timeSlots: {
      morning: 0.20,
      noon: 0.18,
      evening: 0.24,
      night: 0.14
    }
  },
  // 斗门糖厂路
  {
    id: 'road_043',
    name: '斗门糖厂-旧址路',
    geometry: [[113.3023, 22.2089], [113.3089, 22.2156], [113.3155, 22.2223]],
    speed: 55,
    density: 70,
    risk: 0.23,
    roadType: 'urban',
    timeSlots: {
      morning: 0.18,
      noon: 0.20,
      evening: 0.23,
      night: 0.15
    }
  },
  // 鹤港高速
  {
    id: 'road_044',
    name: '鹤港高速-鹤洲段',
    geometry: [[113.4356, 22.1189], [113.4523, 22.1256], [113.4690, 22.1323]],
    speed: 52,
    density: 68,
    risk: 0.19,
    roadType: 'expressway',
    timeSlots: {
      morning: 0.15,
      noon: 0.14,
      evening: 0.19,
      night: 0.10
    }
  },
  // 小林路
  {
    id: 'road_045',
    name: '小林路-小林村',
    geometry: [[113.3823, 22.0956], [113.3756, 22.0889], [113.3689, 22.0822]],
    speed: 72,
    density: 55,
    risk: 0.21,
    roadType: 'urban',
    timeSlots: {
      morning: 0.18,
      noon: 0.15,
      evening: 0.21,
      night: 0.12
    }
  },
  // 莲塘路
  {
    id: 'road_046',
    name: '莲塘路-莲洲镇',
    geometry: [[113.2823, 22.1856], [113.2756, 22.1923], [113.2689, 22.1990]],
    speed: 58,
    density: 72,
    risk: 0.25,
    roadType: 'urban',
    timeSlots: {
      morning: 0.22,
      noon: 0.20,
      evening: 0.25,
      night: 0.15
    }
  },
  // 装备制造园路
  {
    id: 'road_047',
    name: '装备制造园-园区路',
    geometry: [[113.4023, 22.1256], [113.4089, 22.1323], [113.4155, 22.1390]],
    speed: 65,
    density: 58,
    risk: 0.16,
    roadType: 'urban',
    timeSlots: {
      morning: 0.14,
      noon: 0.12,
      evening: 0.16,
      night: 0.08
    }
  },
  // 白蕉路
  {
    id: 'road_048',
    name: '白蕉路-白蕉镇',
    geometry: [[113.3423, 22.0689], [113.3356, 22.0756], [113.3289, 22.0823]],
    speed: 62,
    density: 62,
    risk: 0.18,
    roadType: 'urban',
    timeSlots: {
      morning: 0.15,
      noon: 0.14,
      evening: 0.18,
      night: 0.10
    }
  },
  // 六乡路
  {
    id: 'road_049',
    name: '六乡路-六乡镇',
    geometry: [[113.2923, 22.1589], [113.2856, 22.1656], [113.2789, 22.1723]],
    speed: 58,
    density: 66,
    risk: 0.20,
    roadType: 'urban',
    timeSlots: {
      morning: 0.17,
      noon: 0.16,
      evening: 0.20,
      night: 0.12
    }
  },
  // 八甲路
  {
    id: 'road_050',
    name: '八甲路-八甲村',
    geometry: [[113.3623, 22.0589], [113.3689, 22.0656], [113.3755, 22.0723]],
    speed: 55,
    density: 70,
    risk: 0.22,
    roadType: 'urban',
    timeSlots: {
      morning: 0.18,
      noon: 0.20,
      evening: 0.22,
      night: 0.14
    }
  },

  // ========== 更多路段填充 ==========
  // 金湾互通匝道
  {
    id: 'road_051',
    name: '金湾互通-西向匝道',
    geometry: [[113.3956, 22.1489], [113.3990, 22.1512], [113.4024, 22.1535]],
    speed: 38,
    density: 168,
    risk: 0.74,
    roadType: 'ramp',
    timeSlots: {
      morning: 0.65,
      noon: 0.52,
      evening: 0.74,
      night: 0.42
    }
  },
  // 机场候机楼路
  {
    id: 'road_052',
    name: '机场候机楼-送客路',
    geometry: [[113.3756, 22.1389], [113.3790, 22.1412], [113.3824, 22.1435]],
    speed: 42,
    density: 148,
    risk: 0.63,
    roadType: 'urban',
    timeSlots: {
      morning: 0.55,
      noon: 0.48,
      evening: 0.63,
      night: 0.38
    }
  },
  // 金湾高尔夫球场路
  {
    id: 'road_053',
    name: '金湾高尔夫-俱乐部路',
    geometry: [[113.3556, 22.1589], [113.3523, 22.1623], [113.3490, 22.1657]],
    speed: 48,
    density: 125,
    risk: 0.51,
    roadType: 'urban',
    timeSlots: {
      morning: 0.42,
      noon: 0.45,
      evening: 0.51,
      night: 0.32
    }
  },
  // 金海岸市场路
  {
    id: 'road_054',
    name: '金海岸市场-商业街',
    geometry: [[113.3689, 22.1323], [113.3723, 22.1356], [113.3757, 22.1389]],
    speed: 55,
    density: 95,
    risk: 0.39,
    roadType: 'urban',
    timeSlots: {
      morning: 0.35,
      noon: 0.38,
      evening: 0.39,
      night: 0.25
    }
  },
  // 珠海科技学院路
  {
    id: 'road_055',
    name: '珠海科技学院-校门路',
    geometry: [[113.3856, 22.1089], [113.3890, 22.1123], [113.3924, 22.1157]],
    speed: 45,
    density: 138,
    risk: 0.57,
    roadType: 'urban',
    timeSlots: {
      morning: 0.48,
      noon: 0.52,
      evening: 0.57,
      night: 0.35
    }
  },
  // 广东科学技术学院路
  {
    id: 'road_056',
    name: '广东科学技术学院-路段',
    geometry: [[113.3756, 22.1189], [113.3790, 22.1156], [113.3824, 22.1123]],
    speed: 50,
    density: 118,
    risk: 0.48,
    roadType: 'urban',
    timeSlots: {
      morning: 0.42,
      noon: 0.45,
      evening: 0.48,
      night: 0.30
    }
  },
  // 遵义医学院路
  {
    id: 'road_057',
    name: '遵义医学院珠海校区-路段',
    geometry: [[113.3623, 22.1456], [113.3657, 22.1423], [113.3691, 22.1390]],
    speed: 52,
    density: 108,
    risk: 0.44,
    roadType: 'urban',
    timeSlots: {
      morning: 0.38,
      noon: 0.40,
      evening: 0.44,
      night: 0.28
    }
  },
  // 金湾体育中心路
  {
    id: 'road_058',
    name: '金湾体育中心-场馆路',
    geometry: [[113.3923, 22.1289], [113.3957, 22.1323], [113.3991, 22.1357]],
    speed: 58,
    density: 88,
    risk: 0.35,
    roadType: 'urban',
    timeSlots: {
      morning: 0.28,
      noon: 0.32,
      evening: 0.35,
      night: 0.22
    }
  },
  // 金湾图书馆路
  {
    id: 'road_059',
    name: '金湾图书馆-广场路',
    geometry: [[113.3789, 22.1389], [113.3823, 22.1356], [113.3857, 22.1323]],
    speed: 48,
    density: 132,
    risk: 0.53,
    roadType: 'urban',
    timeSlots: {
      morning: 0.45,
      noon: 0.48,
      evening: 0.53,
      night: 0.35
    }
  },
  // 金湾华发商都路
  {
    id: 'road_060',
    name: '金湾华发商都-购物路',
    geometry: [[113.3723, 22.1256], [113.3757, 22.1289], [113.3791, 22.1322]],
    speed: 52,
    density: 122,
    risk: 0.49,
    roadType: 'urban',
    timeSlots: {
      morning: 0.40,
      noon: 0.45,
      evening: 0.49,
      night: 0.32
    }
  }
]

/**
 * 道路类型配置
 */
export const roadTypeConfig = {
  expressway: {
    name: '高速公路',
    icon: '🛣️',
    color: '#3498db',
    description: '高速路段，车速快，通行效率高'
  },
  urban: {
    name: '城市道路',
    icon: '🏙️',
    color: '#2ecc71',
    description: '城区主干道，车流量大'
  },
  ramp: {
    name: '匝道',
    icon: '🔄',
    color: '#f39c12',
    description: '互通匝道，进出口交汇处'
  },
  ring: {
    name: '快速路',
    icon: '🔗',
    color: '#9b59b6',
    description: '城市快速路，连接各区域'
  }
}

/**
 * 时段配置
 */
export const timeSlotConfig = {
  morning: {
    name: '早高峰',
    time: '07:00-09:00',
    color: '#ff6b6b'
  },
  noon: {
    name: '平峰',
    time: '11:00-14:00',
    color: '#4ecdc4'
  },
  evening: {
    name: '晚高峰',
    time: '17:00-19:00',
    color: '#ffa502'
  },
  night: {
    name: '夜间',
    time: '21:00-23:00',
    color: '#a55eea'
  }
}

/**
 * 生成模拟路段数据（珠海金湾区）
 * @param {number} count - 路段数量
 */
export const generateMockSegments = (count = 50) => {
  const segments = []
  const baseLng = 113.37
  const baseLat = 22.13

  const roadTypes = ['expressway', 'urban', 'ramp', 'ring']

  for (let i = 0; i < count; i++) {
    const startLng = baseLng + (Math.random() - 0.5) * 0.15
    const startLat = baseLat + (Math.random() - 0.5) * 0.15

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
      name: `金湾路段 ${i + 1}`,
      geometry: [
        [startLng, startLat],
        [startLng + Math.random() * 0.02, startLat + Math.random() * 0.02],
        [startLng + Math.random() * 0.04, startLat + Math.random() * 0.04]
      ],
      speed: Math.floor(25 + Math.random() * 65),
      density: Math.floor(35 + Math.random() * 165),
      risk: risk,
      roadType: roadTypes[Math.floor(Math.random() * roadTypes.length)],
      timeSlots: {
        morning: risk * (0.8 + Math.random() * 0.4),
        noon: risk * (0.6 + Math.random() * 0.3),
        evening: risk,
        night: risk * (0.5 + Math.random() * 0.3)
      }
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

/**
 * 获取按时段分类的风险统计
 */
export const getTimeSlotStats = (segments) => {
  const slots = ['morning', 'noon', 'evening', 'night']
  const stats = {}

  slots.forEach(slot => {
    const slotRisks = segments
      .filter(s => s.timeSlots && s.timeSlots[slot])
      .map(s => s.timeSlots[slot])

    if (slotRisks.length > 0) {
      stats[slot] = {
        avgRisk: slotRisks.reduce((a, b) => a + b, 0) / slotRisks.length,
        count: slotRisks.length
      }
    }
  })

  return stats
}

/**
 * 风险预测（基于历史数据的简单预测）
 * @param {number} currentRisk - 当前风险值
 * @param {number} hoursAhead - 预测小时数
 */
export const predictRisk = (currentRisk, hoursAhead = 1) => {
  // 简单的时间序列预测模型
  // 假设晚高峰风险最高，白天逐渐降低
  const hour = new Date().getHours()

  // 基础波动因子
  const fluctuation = Math.sin(hour / 24 * Math.PI * 2) * 0.1

  // 预测衰减/增长因子
  const trendFactor = hoursAhead > 0.5 ? 0.05 * hoursAhead : 0

  // 预测风险值
  const predictedRisk = Math.min(1, Math.max(0,
    currentRisk + fluctuation + trendFactor
  ))

  return {
    current: currentRisk,
    predicted: predictedRisk,
    trend: predictedRisk > currentRisk ? 'increasing' : predictedRisk < currentRisk ? 'decreasing' : 'stable',
    confidence: Math.max(0.5, 1 - hoursAhead * 0.1)
  }
}

/**
 * 获取路段改造建议
 * @param {object} segment - 路段数据
 */
export const getImprovementSuggestions = (segment) => {
  const suggestions = []

  if (segment.risk >= 0.75) {
    suggestions.push({
      category: 'speed',
      title: '限速调整',
      content: '建议在该路段实施动态限速，根据实时交通流量调整最高时速，可降低碰撞风险15-20%'
    })
    suggestions.push({
      category: 'engineering',
      title: '工程改造',
      content: '建议增设紧急停车带、加速车道、减速车道，优化出入口间距'
    })
    suggestions.push({
      category: 'policy',
      title: '管理政策',
      content: '建议实施错峰出行政策，增加公共交通投入，引导车辆分流'
    })
  } else if (segment.risk >= 0.5) {
    suggestions.push({
      category: 'speed',
      title: '限速调整',
      content: '建议保持当前限速值，加强超速监控设施'
    })
    suggestions.push({
      category: 'engineering',
      title: '工程改造',
      content: '建议优化交通信号配时，改善路口渠化设计'
    })
    suggestions.push({
      category: 'policy',
      title: '管理政策',
      content: '建议加强交通疏导，增加高峰期执勤人员'
    })
  } else {
    suggestions.push({
      category: 'maintenance',
      title: '日常维护',
      content: '风险等级较低，建议保持常规维护和监控'
    })
  }

  return suggestions
}
