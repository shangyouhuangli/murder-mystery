<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getScriptList } from '../utils/script'
import { getSave } from '../utils/storage'

const router = useRouter()

// 剧本列表
const scripts = ref([])
const loading = ref(true)
const searchKeyword = ref('')
const selectedGenre = ref('all')
const selectedPlayerCount = ref('all')

// 所有题材
const allGenres = computed(() => {
  const genres = new Set()
  scripts.value.forEach(s => {
    if (s.genres) {
      s.genres.forEach(g => genres.add(g))
    }
  })
  return Array.from(genres)
})

// 人数选项
const playerCountOptions = [
  { value: 'all', label: '全部人数' },
  { value: '3', label: '3人' },
  { value: '4', label: '4人' },
  { value: '5', label: '5人' },
  { value: '6', label: '6人' },
  { value: '7+', label: '7人以上' }
]

// 筛选后的剧本列表
const filteredScripts = computed(() => {
  return scripts.value.filter(script => {
    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      const matchName = script.name?.toLowerCase().includes(keyword)
      const matchDesc = script.description?.toLowerCase().includes(keyword)
      if (!matchName && !matchDesc) return false
    }
    
    // 题材筛选
    if (selectedGenre.value !== 'all') {
      if (!script.genres?.includes(selectedGenre.value)) return false
    }
    
    // 人数筛选
    if (selectedPlayerCount.value !== 'all') {
      const count = script.playerCount || script.characters?.length || 0
      if (selectedPlayerCount.value === '7+') {
        if (count < 7) return false
      } else {
        if (count !== parseInt(selectedPlayerCount.value)) return false
      }
    }
    
    return true
  })
})

// 检查是否有存档
function hasSave(scriptId) {
  return !!getSave(scriptId)
}

// 获取难度显示
function getDifficultyText(difficulty) {
  const map = {
    1: '简单',
    2: '中等',
    3: '困难',
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || '中等'
}

// 获取时长显示
function getDurationText(duration) {
  if (!duration) return '未知'
  if (typeof duration === 'number') {
    return `${duration} 分钟`
  }
  return duration
}

// 开始游戏
function startGame(scriptId) {
  router.push(`/game/${scriptId}`)
}

// 主持人模式
function startHost(scriptId) {
  router.push(`/host/${scriptId}`)
}

// 加载剧本列表
onMounted(async () => {
  try {
    loading.value = true
    scripts.value = await getScriptList()
  } catch (e) {
    console.error('加载剧本列表失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">🎭 剧本大厅</h1>
      <p class="page-subtitle">选择一个剧本，开启你的推理之旅</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar card">
      <div class="filter-item">
        <span class="filter-label">🔍 搜索</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="input"
          placeholder="输入剧本名称或关键词..."
        />
      </div>
      
      <div class="filter-item">
        <span class="filter-label">🎬 题材</span>
        <select v-model="selectedGenre" class="input">
          <option value="all">全部题材</option>
          <option v-for="genre in allGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>
      </div>
      
      <div class="filter-item">
        <span class="filter-label">👥 人数</span>
        <select v-model="selectedPlayerCount" class="input">
          <option v-for="opt in playerCountOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- 剧本列表 -->
    <div v-if="loading" class="loading-container">
      <div class="loading"></div>
      <p class="text-muted mt-2">加载剧本中...</p>
    </div>

    <div v-else-if="filteredScripts.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p class="empty-text">没有找到符合条件的剧本</p>
      <p class="text-muted">试试调整筛选条件，或者上传你自己的剧本</p>
      <router-link to="/upload" class="btn btn-primary mt-3">
        上传本地剧本
      </router-link>
    </div>

    <div v-else class="script-grid">
      <div
        v-for="script in filteredScripts"
        :key="script.id"
        class="script-card card"
      >
        <!-- 封面 -->
        <div class="script-cover">
          <img v-if="script.cover" :src="script.cover" :alt="script.name" />
          <div v-else class="cover-placeholder">
            <span class="cover-icon">🎭</span>
          </div>
          
          <!-- 存档标记 -->
          <div v-if="hasSave(script.id)" class="save-badge">
            ⏱️ 有存档
          </div>
        </div>

        <!-- 剧本信息 -->
        <div class="script-info">
          <h3 class="script-name">{{ script.name }}</h3>
          
          <div class="script-tags">
            <span v-for="genre in script.genres" :key="genre" class="tag">
              {{ genre }}
            </span>
          </div>

          <div class="script-meta">
            <span class="meta-item">
              👥 {{ script.playerCount || script.characters?.length || '?' }}人
            </span>
            <span class="meta-item">
              ⏱️ {{ getDurationText(script.duration) }}
            </span>
            <span class="meta-item">
              ⭐ {{ getDifficultyText(script.difficulty) }}
            </span>
          </div>

          <p class="script-desc">{{ script.description }}</p>

          <div class="script-actions">
            <button class="btn btn-primary" @click="startGame(script.id)">
              开始游戏
            </button>
            <button class="btn btn-secondary" @click="startHost(script.id)">
              主持人
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传入口 -->
    <div class="upload-section card">
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <div>
          <h3>有自己的剧本？</h3>
          <p class="text-muted">上传本地 JSON 剧本文件，立即开始游玩</p>
        </div>
        <router-link to="/upload" class="btn btn-secondary">
          上传剧本
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
}

/* 筛选栏 */
.filter-bar {
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

/* 剧本网格 */
.script-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.script-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.script-cover {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #2d3436, #636e72);
  overflow: hidden;
}

.script-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.save-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 184, 148, 0.9);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.script-info {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.script-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.script-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.script-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.script-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.script-actions .btn {
  flex: 1;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
}

/* 上传区域 */
.upload-section {
  padding: 2rem;
}

.upload-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.upload-icon {
  font-size: 3rem;
}

.upload-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.upload-content p {
  margin: 0;
  font-size: 0.9rem;
}

.upload-content .btn {
  margin-left: auto;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-item {
    min-width: 100%;
  }
  
  .script-grid {
    grid-template-columns: 1fr;
  }
  
  .upload-content {
    flex-direction: column;
    text-align: center;
  }
  
  .upload-content .btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>
