<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const showBack = computed(() => route.name !== 'Home')

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo" @click="goBack">
          <span class="logo-icon">🎭</span>
          <span class="logo-text">剧本杀</span>
        </div>
        <nav class="nav-links">
          <router-link to="/" class="nav-link">剧本大厅</router-link>
          <router-link to="/upload" class="nav-link">本地剧本</router-link>
        </nav>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 -->
    <footer class="app-footer">
      <p>纯静态剧本杀平台 · 基于 GitHub Pages 部署</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e8e8e8;
}

.app-header {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #a0a0a0;
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.95rem;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #e94560;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.app-footer {
  text-align: center;
  padding: 1.5rem;
  color: #666;
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    padding: 0.75rem 1rem;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.85rem;
  }
  
  .app-main {
    padding: 1rem;
  }
}
</style>
