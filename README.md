# 基于5G-V2X的智能车联网超视距协同避让可视化系统

## 项目简介

本系统是一个基于 Vue3 开发的前端可视化项目，旨在展示 5G-V2X 车联网技术在超视距协同避让场景中的应用价值。通过 Canvas 动画渲染、多场景模拟、实时参数调节、双阈值预警等功能，直观呈现 V2X 技术如何打破单车雷达的感知局限，让车辆被遮挡的盲区路况变得可见。

## 技术栈

- **基础框架**: Vue 3.4 + Vite 5
- **UI组件库**: Element Plus 2.6
- **可视化渲染**: Canvas + ECharts 5.5
- **数据处理**: SheetJS (xlsx)
- **样式开发**: SCSS
- **图标**: @element-plus/icons-vue

## 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 pnpm >= 7.0.0
- 现代浏览器（Chrome、Edge、Firefox 最新2个版本）
- 推荐 resolution: 1920×1080 及以上

## 快速开始

### 1. 安装依赖

```bash
cd d:\app.creat\car-leave
npm install
```

或使用 pnpm:

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可查看系统

### 3. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist` 目录

## 项目结构

```
car-leave/
├── index.html                 # HTML入口文件
├── package.json               # 项目配置
├── vite.config.js             # Vite配置
├── README.md                  # 项目说明
└── src/
    ├── main.js                # 应用入口
    ├── App.vue                # 根组件
    ├── components/            # 组件目录
    │   ├── ControlPanel.vue       # 左侧控制区
    │   ├── VisualizationCanvas.vue # 主可视化画布
    │   └── IndicatorPanel.vue     # 右侧指标面板
    ├── config/                # 配置文件
    │   └── scenes.js              # 场景配置
    ├── data/                  # 数据文件
    │   └── simulationData.js      # 默认仿真数据
    ├── utils/                 # 工具函数
    │   └── dataParser.js          # 数据解析工具
    └── styles/                # 样式文件
        ├── variables.scss         # SCSS变量
        └── global.scss            # 全局样式
```

## 核心功能

### 1. 多场景切换

系统提供 5 个核心场景，一键切换并自动适配参数：

| 场景 | 车速范围 | 密度范围 | 道路布局 | 核心指标 |
|------|----------|----------|----------|----------|
| 城市道路 | 20-60 km/h | 100-300 veh/km | 十字路 | 避让成功率、提前预警时间 |
| 快速路 | 60-90 km/h | 50-200 veh/km | 直线路 | 丢包率、吞吐量 |
| 高速公路 | 90-120 km/h | 50-150 veh/km | 长直线路 | 提前预警时间、无线盲区指标 |
| 匝道 | 30-50 km/h | 50-150 veh/km | 弯道 | 避让成功率、消息时延 |
| 隧道 | 40-80 km/h | 50-200 veh/km | 封闭直线路 | 150米消息接收成功率、信道忙碌率 |

### 2. 参数调节

- **行驶车速**: 根据场景自动适配范围，步长 10 km/h
- **车辆密度**: 根据场景自动适配范围，步长 50 veh/km
- **一级预警阈值**: 0-100%，默认 80%
- **二级预警阈值**: 0-100%，默认 50%

### 3. 双阈值预警

- **正常状态**: 避让成功率 ≥ 一级阈值，车辆正常行驶
- **一级预警**: 二级阈值 ≤ 避让成功率 < 一级阈值，显示红色警告
- **二级预警**: 避让成功率 < 二级阈值，触发碰撞动画

### 4. 超视距可视化

- **主车高亮**: 蓝色发光效果，清晰标识用户视角
- **周边车辆**: 根据密度动态渲染，动画速度与车速同步
- **盲区渲染**: 不同遮挡类型的具象化展示
- **V2X感知范围**: 虚线扇形区域，展示超视距感知能力

### 5. 本地数据上传

支持上传 .xls/.xlsx 格式的仿真数据文件，自动解析并映射字段。

## 仿真数据格式

上传的数据文件需包含以下字段：

| 字段名 | 中文表头 | 说明 |
|--------|----------|------|
| vehicleSpeed | 车速(km/h) | 车辆行驶速度 |
| vehicleDensity | 车辆密度(veh/km) | 道路车辆密度 |
| msgSuccessRate50m | 50米消息接收成功率(%) | 50米距离消息接收成功率 |
| msgSuccessRate150m | 150米消息接收成功率(%) | 150米距离消息接收成功率 |
| packetLossRate150m | 150米丢包率(%) | 150米距离丢包率 |
| adjacentVehicles | 相邻车辆数(辆) | 相邻车辆数量 |
| channelBusyRate | 信道忙碌率(%) | 信道忙碌程度 |
| avgMsgDelay | 平均消息时延(ms) | 消息传输平均时延 |
| throughput | 吞吐量(Mbps) | 数据吞吐量 |
| wirelessBlindSpot | 无线盲区指标 | 无线信号盲区程度 |
| avoidanceSuccessRate | 避让成功率(%) | 紧急避让成功概率 |
| advanceWarningTime | 提前预警时间(s) | 提前预警时间 |

## 浏览器兼容性

- Chrome >= 90
- Edge >= 90
- Firefox >= 88
- Safari >= 14

## 许可证

MIT License
