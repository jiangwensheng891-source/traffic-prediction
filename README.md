# 基于5G-V2X的智能车联网超视距协同避让可视化系统

## 项目简介

本系统是一个基于 Vue3 开发的前端可视化平台，包含两大核心模块：
1. **V2X超视距可视化** - 展示5G-V2X车联网技术在超视距协同避让场景中的应用价值
2. **城市交通风险热力图** - 通过热力图直观展示城市道路碰撞风险分布

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.21 | 前端框架 |
| Vite | 5.1.6 | 构建工具 |
| Element Plus | 2.6.1 | UI组件库 |
| Pinia | 最新 | 状态管理 |
| Leaflet | 最新 | 地图渲染 |
| Canvas | - | 动画渲染 |
| ECharts | 5.5.0 | 图表可视化 |
| SheetJS | 0.18.5 | Excel解析 |
| SCSS | 1.71.1 | 样式预处理 |

## 快速开始

```bash
cd d:\app.creat\car-leave
npm install
npm run dev
```

访问 **http://localhost:3001** 即可体验系统

## 双视图模式

### 1. V2X超视距可视化

通过Canvas动画渲染车辆行驶、盲区可视化、V2X超视距范围展示：

- **五场景切换**：城市道路、快速路、高速公路、匝道、隧道
- **参数调节**：车速、车辆密度、双预警阈值
- **双阈值预警**：三级预警机制，碰撞动画触发
- **实时指标**：12项核心指标动态更新

### 2. 城市交通风险热力图

基于Leaflet地图渲染城市道路碰撞风险热力图：

- **热力图渲染**：风险值0-1映射为颜色（蓝→绿→黄→红）
- **风险阈值调节**：低/中/高三档 + 自定义阈值
- **时间段过滤**：早高峰、午间、晚高峰、夜间
- **车密度过滤**：0-200 veh/km 范围筛选
- **统计面板**：ECharts风险分布柱状图 + Top-10高风险路段表
- **点击交互**：路段点击弹框显示详情

## 核心功能

### F1 热力图渲染 ✅
- Leaflet瓦片地图 + Canvas路段渲染
- risk∈[0,1] → 颜色映射（绿→黄→橙→红）
- 点击/悬停弹框显示路段详情

### F2 本地Excel上传 ✅
- 支持.xls/.xlsx格式
- SheetJS解析为统一JSON格式
- 字段映射支持中英文表头

### F3 风险阈值调节 ✅
- 低/中/高三档快捷按钮
- 自定义滑块精确调节
- 实时刷新路段颜色

### F4 时间段 & 车密度过滤 ✅
- 顶部时间段选择（全部/早高峰/午间/晚高峰/夜间）
- 左侧密度滑块（0-200 veh/km）
- 不符合条件路段降低透明度

### F5 右侧统计面板 ✅
- ECharts柱状图（风险分布统计）
- Top-10高风险路段表格
- 当前阈值指示

### F6 重置模拟 ✅
- 恢复默认阈值
- 清空过滤条件
- 重新加载内置数据

### F7 API占位 ✅
- 预留RESTful接口结构
- 当前返回mock数据
- 后期可对接真实V2X系统

### F8 响应式布局 ✅
- 适配1920×1080及以上分辨率
- 70%-120%缩放无溢出遮挡

## 数据模型

### RoadSegment（路段数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name | string | 路段名称 |
| geometry | number[][] | 折线坐标 [[lng,lat],...] |
| speed | number | 平均车速 km/h |
| density | number | 车流密度 veh/km |
| risk | number | 碰撞风险指数 (0-1) |

### Excel必填列
id, name, geometry (JSON), speed, density, risk

## 项目结构

```
car-leave/
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 根组件（双视图切换）
│   ├── components/
│   │   ├── ControlPanel.vue    # 控制面板（双模式）
│   │   ├── VisualizationCanvas.vue  # V2X画布
│   │   ├── IndicatorPanel.vue  # V2X指标面板
│   │   ├── MapCanvas.vue       # 热力图地图
│   │   └── StatsPanel.vue      # 热力图统计面板
│   ├── stores/
│   │   └── heatmap.js          # Pinia状态管理
│   ├── config/
│   │   └── scenes.js           # V2X场景配置
│   ├── data/
│   │   ├── simulationData.js   # V2X仿真数据
│   │   └── heatmapData.js      # 热力图路段数据
│   ├── utils/
│   │   ├── dataParser.js       # V2X数据解析
│   │   └── heatmapParser.js    # 热力图数据解析
│   └── styles/
│       ├── variables.scss      # SCSS变量
│       └── global.scss         # 全局样式
├── package.json
├── vite.config.js
└── README.md
```

## 浏览器兼容性

- Chrome >= 90
- Edge >= 90
- Firefox >= 88
- Safari >= 14

## 许可证

MIT License
