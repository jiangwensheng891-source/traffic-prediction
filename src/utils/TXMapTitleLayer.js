/**
 * 腾讯地图瓦片图层插件 for Leaflet
 * 基于 https://github.com/wuxiashuangji/TXMapTitleLayer
 * 支持标准地图、地形图、卫星图
 */

import L from 'leaflet'

// 腾讯地图API Key
const TENCENT_MAP_KEY = 'UJABZ-TUIW7-RVBXS-PAYIX-7YMTH-5KFZQ'

// 腾讯地图类型
const TILE_LAYER_TYPES = {
  'Normal': {
    url: 'https://rt0.map.gtimg.com/tile?color=128|128|128&v=1&x={x}&y={y}&z={z}&key=' + TENCENT_MAP_KEY,
    subdomains: '1234',
    name: '标准地图'
  },
  'Landform': {
    url: 'https://rt1.map.gtimg.com/tile?color=128|128|128&v=1&x={x}&y={y}&z={z}&key=' + TENCENT_MAP_KEY,
    subdomains: '1234',
    name: '地形图'
  },
  'Satellite': {
    url: 'https://p0.map.gtimg.com/sateTiles/{z}/{x}/{y}.jpg',
    subdomains: '1234',
    name: '卫星图'
  },
  'SatelliteLabel': {
    url: 'https://p1.map.gtimg.com/dTiles/{z}/{x}/{y}.png',
    subdomains: '1234',
    name: '卫星地图(带标注)'
  },
  'Dark': {
    url: 'https://rt0.map.gtimg.com/tile?color=128|128|128&v=1&x={x}&y={y}&z={z}&key=' + TENCENT_MAP_KEY,
    subdomains: '1234',
    name: '暗色地图',
    filter: 'brightness(0.6) contrast(1.1) saturate(0.9)'
  },
  'Light': {
    url: 'https://rt0.map.gtimg.com/tile?color=128|128|128&v=1&x={x}&y={y}&z={z}&key=' + TENCENT_MAP_KEY,
    subdomains: '1234',
    name: '亮色地图',
    filter: 'brightness(1.1) contrast(0.9) saturate(1.1)'
  },
  // 实时交通路况图层
  'Traffic': {
    url: 'https://rt0.map.gtimg.com/traffic/{z}/{x}/{y}.png',
    subdomains: '1234',
    name: '实时路况',
    transparent: true,
    opacity: 0.7
  }
}

// 扩展Leaflet的TileLayer
L.TileLayer.TxMapTileLayer = L.TileLayer.extend({
  initialize: function (type, options) {
    const layerConfig = TILE_LAYER_TYPES[type] || TILE_LAYER_TYPES['Normal']

    const tileOptions = {
      maxZoom: 18,
      minZoom: 3,
      subdomains: layerConfig.subdomains,
      attribution: '© Tencent Map',
      tms: false
    }

    L.Util.setOptions(this, L.Util.extend(tileOptions, options))

    this._url = layerConfig.url
    this._type = type
    this._filter = layerConfig.filter
  },

  // 重写createTile方法以应用滤镜
  createTile: function (coords, done) {
    const tile = document.createElement('img')
    tile.alt = ''
    tile.setAttribute('role', 'presentation')

    if (this._filter) {
      tile.style.filter = this._filter
    }

    tile.onload = () => {
      done(null, tile)
    }
    tile.onerror = () => {
      done(null, tile)
    }

    const url = this.getTileUrl(coords)
    tile.src = url

    return tile
  },

  getTileUrl: function (coords) {
    const self = this
    const zoom = coords.z
    const x = coords.x

    // 腾讯地图在高缩放级别(15+)不提供瓦片，限制为14级
    const actualZoom = Math.min(zoom, 14)

    // 腾讯地图使用TMS格式，y坐标需要翻转（仅对非交通图层）
    let y = coords.y
    if (this._type !== 'Traffic') {
      y = (1 << actualZoom) - coords.y - 1
    }

    // 计算腾讯地图的瓦片坐标
    const url = self._url
      .replace('{z}', actualZoom)
      .replace('{x}', x)
      .replace('{y}', y)

    return url
  }
})

// 便捷创建函数
L.tileLayer.txMapTileLayer = function (type, options) {
  return new L.TileLayer.TxMapTileLayer(type, options)
}

// 预设图层创建函数
L.tileLayer.tencent = function (options) {
  return new L.TileLayer.TxMapTileLayer('Normal', options)
}

L.tileLayer.tencentSatellite = function (options) {
  return new L.TileLayer.TxMapTileLayer('Satellite', options)
}

L.tileLayer.tencentLandform = function (options) {
  return new L.TileLayer.TxMapTileLayer('Landform', options)
}

L.tileLayer.tencentDark = function (options) {
  return new L.TileLayer.TxMapTileLayer('Dark', options)
}

// 实时交通路况图层
L.tileLayer.tencentTraffic = function (options) {
  return new L.TileLayer.TxMapTileLayer('Traffic', options)
}

// 导出默认配置
export { TILE_LAYER_TYPES }
export default L.TileLayer.TxMapTileLayer
