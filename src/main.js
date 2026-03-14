// =====================================================
// 主入口文件 - 5G-V2X车联网可视化系统
// =====================================================

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import './styles/global.scss'

// 创建Vue应用实例
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用Element Plus
app.use(ElementPlus, {
  size: 'default',
  zIndex: 3000
})

// 挂载应用
app.mount('#app')
