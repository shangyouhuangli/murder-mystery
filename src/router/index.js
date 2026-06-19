import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Game from '../views/Game.vue'
import Host from '../views/Host.vue'
import Upload from '../views/Upload.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '剧本大厅' }
  },
  {
    path: '/game/:scriptId',
    name: 'Game',
    component: Game,
    meta: { title: '游戏进行中' }
  },
  {
    path: '/host/:scriptId',
    name: 'Host',
    component: Host,
    meta: { title: '主持人模式' }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: { title: '本地剧本上传' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '剧本杀'} - 线上剧本杀平台`
  next()
})

export default router
