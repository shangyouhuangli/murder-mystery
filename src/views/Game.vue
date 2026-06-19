<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { exportSave, importSave } from '../utils/storage'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const { state, totalActs, currentActData, characters } = gameStore

// 当前视图阶段
const currentView = ref('character-select') // character-select, reading, evidence, voting, ending

// 搜证相关
const selectedLocation = ref(null)

// 投票相关
const selectedVoteOptions = ref({})

// 导入存档
const fileInput = ref(null)

// 初始化游戏
onMounted(async () => {
  const scriptId = route.params.scriptId
  await gameStore.initGame(scriptId)
  
  // 如果已经选择了角色，直接进入阅读
  if (state.currentCharacter) {
    currentView.value = 'reading'
  }
})

// 监听状态变化，自动切换视图
watch(() => state.gameEnded, (ended) => {
  if (ended) {
    currentView.value = 'ending'
  }
})

// 获取当前角色信息
const currentCharacterInfo = computed(() => {
  if (!state.currentCharacter) return null
  return characters.value.find(c => c.id === state.currentCharacter)
})

// 获取当前幕的角色剧本内容
const currentActContent = computed(() => {
  if (!currentActData.value || !state.currentCharacter) return ''
  
  // 查找该角色的剧本内容
  const characterContent = currentActData.value.contents?.[state.currentCharacter]
  if (characterContent) return characterContent
  
  // 如果没有分角色内容，使用通用内容
  return currentActData.value.content || ''
})

// 获取当前幕的搜证地点
const currentActLocations = computed(() => {
  if (!currentActData.value) return []
  return currentActData.value.locations || []
})

// 获取地点的线索
function getLocationClues(locationId) {
  if (!state.script?.clues) return []
  return state.script.clues[locationId] || []
}

// 检查线索是否可见（公开线索或当前角色的专属线索）
function isClueVisible(clue) {
  if (!clue.owner || clue.owner === 'public') return true
  return clue.owner === state.currentCharacter
}

// 检查线索是否已发现
function isClueDiscovered(clueId, locationId) {
  return gameStore.isClueDiscovered(clueId, locationId)
}

// 发现线索
function discoverClue(clueId, locationId) {
  gameStore.discoverClue(clueId, locationId)
}

// 获取当前角色的专属线索列表
const myPrivateClues = computed(() => {
  if (!state.currentCharacter) return []
  return gameStore.getCharacterClues(state.currentCharacter)
})

// 获取投票问题
const votingQuestions = computed(() => {
  return state.script?.voting?.questions || []
})

// 提交投票
function submitVote() {
  for (const questionId in selectedVoteOptions.value) {
    gameStore.submitVote(questionId, selectedVoteOptions.value[questionId])
  }
  alert('投票已提交！等待主持人公布结果。')
}

// 选择角色
function selectCharacter(characterId) {
  gameStore.selectCharacter(characterId)
  currentView.value = 'reading'
}

// 随机角色
function randomCharacter() {
  const char = gameStore.randomCharacter()
  if (char) {
    currentView.value = 'reading'
  }
}

// 切换到搜证
function goToEvidence() {
  currentView.value = 'evidence'
  if (currentActLocations.value.length > 0) {
    selectedLocation.value = currentActLocations.value[0].id
  }
}

// 切换到阅读
function goToReading() {
  currentView.value = 'reading'
}

// 切换到投票
function goToVoting() {
  currentView.value = 'voting'
}

// 下一幕
function nextAct() {
  if (gameStore.nextAct()) {
    selectedLocation.value = null
  }
}

// 上一幕
function prevAct() {
  gameStore.prevAct()
}

// 导出存档
function doExportSave() {
  if (exportSave(state.scriptId)) {
    alert('存档已导出！')
  }
}

// 导入存档
function handleImportSave(event) {
  const file = event.target.files[0]
  if (!file) return
  
  importSave(file).then(saveData => {
    if (confirm('确定要导入此存档吗？当前进度将被覆盖。')) {
      gameStore.restoreFromSave(saveData)
      if (state.currentCharacter) {
        currentView.value = 'reading'
      }
      alert('存档导入成功！')
    }
  }).catch(err => {
    alert('导入失败: ' + err.message)
  })
  
  event.target.value = ''
}

// 重置游戏
function resetGame() {
  if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
    gameStore.resetGame()
    currentView.value = 'character-select'
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 获取真相内容
const truthContent = computed(() => {
  return state.script?.truth || ''
})

// 获取结局内容
const endings = computed(() => {
  return state.script?.endings || []
})
</script>

<template>
  <div class="game-page">
    <!-- 加载状态 -->
    <div v-if="state.loading" class="loading-container">
      <div class="loading"></div>
      <p class="text-muted mt-2">加载剧本中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="state.error" class="error-container">
      <div class="error-icon">❌</div>
      <h3>加载失败</h3>
      <p class="text-muted">{{ state.error }}</p>
      <button class="btn btn-primary mt-3" @click="goHome">返回大厅</button>
    </div>

    <!-- 游戏内容 -->
    <template v-else>
      <!-- 顶部信息栏 -->
      <div class="game-header card">
        <div class="header-left">
          <button class="btn btn-secondary" @click="goHome">← 返回</button>
          <h2 class="script-title">{{ state.script?.name }}</h2>
        </div>
        
        <div class="header-right">
          <div v-if="currentCharacterInfo" class="character-info">
            <span class="character-avatar">{{ currentCharacterInfo.avatar || '👤' }}</span>
            <span class="character-name">{{ currentCharacterInfo.name }}</span>
          </div>
          
          <div class="header-actions">
            <button class="btn btn-secondary" @click="doExportSave" title="导出存档">
              📤 导出
            </button>
            <button class="btn btn-secondary" @click="fileInput?.click()" title="导入存档">
              📥 导入
            </button>
            <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleImportSave" />
            <button class="btn btn-secondary" @click="resetGame" title="重置游戏">
              🔄 重置
            </button>
          </div>
        </div>
      </div>

      <!-- 角色选择阶段 -->
      <div v-if="currentView === 'character-select'" class="character-select-section">
        <div class="section-title">
          <h2>🎭 选择你的角色</h2>
          <p class="text-muted">选择一个角色开始你的剧本杀之旅</p>
        </div>

        <div class="character-grid">
          <div
            v-for="char in characters"
            :key="char.id"
            class="character-card card"
            @click="selectCharacter(char.id)"
          >
            <div class="character-avatar-large">{{ char.avatar || '👤' }}</div>
            <h3 class="char-name">{{ char.name }}</h3>
            <p class="char-desc">{{ char.description }}</p>
            <span v-if="char.gender" class="char-gender">{{ char.gender }}</span>
          </div>
        </div>

        <div class="random-section">
          <button class="btn btn-warning" @click="randomCharacter">
            🎲 随机分配角色
          </button>
        </div>
      </div>

      <!-- 阅读剧本阶段 -->
      <div v-else-if="currentView === 'reading'" class="reading-section">
        <!-- 幕导航 -->
        <div class="act-nav card">
          <div class="act-progress">
            <span class="act-label">第 {{ state.currentAct + 1 }} 幕 / 共 {{ totalActs }} 幕</span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: ((state.currentAct + 1) / totalActs * 100) + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="act-actions">
            <button class="btn btn-secondary" :disabled="state.currentAct === 0" @click="prevAct">
              ← 上一幕
            </button>
            <button 
              class="btn btn-primary" 
              :disabled="state.currentAct >= state.unlockedActs"
              @click="nextAct"
            >
              下一幕 →
            </button>
          </div>
        </div>

        <!-- 幕标题 -->
        <div class="act-title-section">
          <h2 class="act-title">{{ currentActData?.title || `第 ${state.currentAct + 1} 幕` }}</h2>
          <p v-if="currentActData?.subtitle" class="act-subtitle text-muted">{{ currentActData.subtitle }}</p>
        </div>

        <!-- 剧本内容 -->
        <div class="script-content card">
          <div class="content-header">
            <span class="content-label">📖 你的剧本</span>
          </div>
          <div class="content-body" v-html="currentActContent"></div>
        </div>

        <!-- 功能入口 -->
        <div class="feature-entries">
          <button 
            v-if="currentActLocations.length > 0"
            class="btn btn-secondary feature-btn"
            @click="goToEvidence"
          >
            🔍 前往搜证
          </button>
          
          <button 
            v-if="votingQuestions.length > 0 && state.votingOpen"
            class="btn btn-warning feature-btn"
            @click="goToVoting"
          >
            🗳️ 前往投票
          </button>
          
          <button 
            v-if="state.showTruth"
            class="btn btn-success feature-btn"
            @click="currentView = 'ending'"
          >
            🎬 查看结局
          </button>
        </div>
      </div>

      <!-- 搜证阶段 -->
      <div v-else-if="currentView === 'evidence'" class="evidence-section">
        <div class="section-header">
          <h2>🔍 搜证</h2>
          <button class="btn btn-secondary" @click="goToReading">返回阅读</button>
        </div>

        <div class="evidence-layout">
          <!-- 地点列表 -->
          <div class="location-list card">
            <h3 class="list-title">搜证地点</h3>
            <div class="location-items">
              <div
                v-for="loc in currentActLocations"
                :key="loc.id"
                class="location-item"
                :class="{ active: selectedLocation === loc.id }"
                @click="selectedLocation = loc.id"
              >
                <span class="location-icon">{{ loc.icon || '📍' }}</span>
                <span class="location-name">{{ loc.name }}</span>
              </div>
            </div>
          </div>

          <!-- 线索列表 -->
          <div class="clue-area card">
            <h3 class="list-title">
              {{ currentActLocations.find(l => l.id === selectedLocation)?.name || '选择地点查看线索' }}
            </h3>
            
            <div v-if="!selectedLocation" class="empty-clues">
              <p class="text-muted">请从左侧选择一个搜证地点</p>
            </div>
            
            <div v-else class="clue-grid">
              <div
                v-for="clue in getLocationClues(selectedLocation)"
                :key="clue.id"
                class="clue-card"
                :class="{ 
                  discovered: isClueDiscovered(clue.id, selectedLocation),
                  'is-private': clue.owner && clue.owner !== 'public'
                }"
                @click="!isClueDiscovered(clue.id, selectedLocation) && isClueVisible(clue) && discoverClue(clue.id, selectedLocation)"
              >
                <template v-if="isClueDiscovered(clue.id, selectedLocation)">
                  <div class="clue-content">
                    <span class="clue-tag" v-if="clue.owner && clue.owner !== 'public'">专属</span>
                    <h4 class="clue-name">{{ clue.name }}</h4>
                    <p class="clue-desc">{{ clue.description }}</p>
                  </div>
                </template>
                <template v-else>
                  <div class="clue-locked">
                    <span v-if="!isClueVisible(clue)" class="locked-icon">🔒</span>
                    <span v-else class="locked-icon">❓</span>
                    <span class="locked-text">
                      {{ !isClueVisible(clue) ? '他人专属线索' : '点击调查' }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的专属线索 -->
        <div v-if="myPrivateClues.length > 0" class="private-clues card">
          <h3 class="list-title">🔐 我的专属线索</h3>
          <div class="private-clue-list">
            <div v-for="clue in myPrivateClues" :key="clue.id" class="private-clue-item">
              <span class="clue-name">{{ clue.name }}</span>
              <span class="clue-location text-muted">
                来自: {{ currentActLocations.find(l => l.id === clue.locationId)?.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 投票阶段 -->
      <div v-else-if="currentView === 'voting'" class="voting-section">
        <div class="section-header">
          <h2>🗳️ 投票</h2>
          <button class="btn btn-secondary" @click="goToReading">返回阅读</button>
        </div>

        <div v-if="!state.votingOpen" class="voting-closed card">
          <div class="closed-icon">⏳</div>
          <h3>投票尚未开启</h3>
          <p class="text-muted">请等待主持人开启投票</p>
        </div>

        <div v-else class="voting-questions">
          <div v-for="question in votingQuestions" :key="question.id" class="question-card card">
            <h3 class="question-title">{{ question.title }}</h3>
            <div class="question-options">
              <label
                v-for="option in question.options"
                :key="option.id"
                class="option-item"
                :class="{ selected: selectedVoteOptions[question.id] === option.id }"
              >
                <input
                  type="radio"
                  :name="question.id"
                  :value="option.id"
                  v-model="selectedVoteOptions[question.id]"
                />
                <span class="option-text">{{ option.text }}</span>
              </label>
            </div>
          </div>

          <div class="voting-actions">
            <button class="btn btn-primary" @click="submitVote">
              提交投票
            </button>
          </div>
        </div>
      </div>

      <!-- 结局复盘阶段 -->
      <div v-else-if="currentView === 'ending'" class="ending-section">
        <div class="section-header">
          <h2>🎬 真相与结局</h2>
          <button class="btn btn-secondary" @click="goToReading">返回阅读</button>
        </div>

        <!-- 真相 -->
        <div class="truth-section card">
          <h3 class="section-title">📜 案件真相</h3>
          <div class="truth-content" v-html="truthContent"></div>
        </div>

        <!-- 结局 -->
        <div v-if="endings.length > 0" class="endings-section">
          <h3 class="section-title">🎭 结局</h3>
          <div class="ending-list">
            <div v-for="ending in endings" :key="ending.id" class="ending-card card">
              <h4 class="ending-title">{{ ending.title }}</h4>
              <div class="ending-content" v-html="ending.content"></div>
            </div>
          </div>
        </div>

        <!-- 彩蛋 -->
        <div v-if="state.script?.easterEggs" class="easter-eggs card">
          <h3 class="section-title">🥚 彩蛋</h3>
          <div class="easter-content" v-html="state.script.easterEggs"></div>
        </div>

        <!-- 统计 -->
        <div class="game-stats card">
          <h3 class="section-title">📊 游戏统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ totalActs }}</span>
              <span class="stat-label">总幕数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ characters.length }}</span>
              <span class="stat-label">角色数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ state.duration || '未知' }}</span>
              <span class="stat-label">游戏时长</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.game-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* 游戏头部 */
.game-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.script-title {
  margin: 0;
  font-size: 1.2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.character-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(233, 69, 96, 0.1);
  border-radius: 20px;
}

.character-avatar {
  font-size: 1.2rem;
}

.character-name {
  font-weight: 500;
  color: #ff6b6b;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.header-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* 角色选择 */
.character-select-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-title {
  text-align: center;
}

.section-title h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.character-card {
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.character-avatar-large {
  font-size: 4rem;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.char-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.char-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.char-gender {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.random-section {
  text-align: center;
}

/* 阅读阶段 */
.reading-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.act-nav {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.act-progress {
  flex: 1;
  min-width: 200px;
}

.act-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  display: block;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.act-actions {
  display: flex;
  gap: 0.75rem;
}

.act-title-section {
  text-align: center;
}

.act-title {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.act-subtitle {
  font-size: 1rem;
}

.script-content {
  padding: 2rem;
}

.content-header {
  margin-bottom: 1rem;
}

.content-label {
  font-size: 0.9rem;
  color: #e94560;
  font-weight: 500;
}

.content-body {
  line-height: 1.8;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.content-body :deep(p) {
  margin-bottom: 1rem;
}

.feature-entries {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-btn {
  min-width: 150px;
}

/* 搜证阶段 */
.evidence-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.evidence-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1.5rem;
}

.location-list,
.clue-area {
  padding: 1.5rem;
}

.list-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.location-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.location-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.location-item.active {
  background: rgba(233, 69, 96, 0.2);
  border-left: 3px solid #e94560;
}

.location-icon {
  font-size: 1.2rem;
}

.empty-clues {
  text-align: center;
  padding: 3rem;
}

.clue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.clue-card {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.clue-card:hover:not(.discovered) {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.clue-card.discovered {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  cursor: default;
  aspect-ratio: auto;
  padding: 1rem;
}

.clue-card.is-private.discovered {
  border-color: rgba(253, 203, 110, 0.5);
  background: rgba(253, 203, 110, 0.1);
}

.clue-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}

.locked-icon {
  font-size: 2rem;
}

.locked-text {
  font-size: 0.85rem;
}

.clue-content {
  width: 100%;
}

.clue-tag {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  background: rgba(253, 203, 110, 0.3);
  color: #fdcb6e;
  border-radius: 10px;
  margin-bottom: 0.5rem;
}

.clue-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.clue-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin: 0;
}

/* 专属线索 */
.private-clues {
  padding: 1.5rem;
}

.private-clue-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.private-clue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(253, 203, 110, 0.1);
  border-radius: 8px;
}

/* 投票阶段 */
.voting-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.voting-closed {
  padding: 4rem;
  text-align: center;
}

.closed-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.voting-questions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  padding: 1.5rem;
}

.question-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.option-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.option-item.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.option-item input[type="radio"] {
  accent-color: #e94560;
}

.option-text {
  flex: 1;
}

.voting-actions {
  text-align: center;
}

.voting-actions .btn {
  min-width: 200px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* 结局阶段 */
.ending-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.truth-section,
.endings-section,
.easter-eggs,
.game-stats {
  padding: 2rem;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.truth-content {
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
}

.ending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ending-card {
  padding: 1.5rem;
}

.ending-title {
  font-size: 1.1rem;
  color: #e94560;
  margin-bottom: 0.75rem;
}

.ending-content {
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}

.easter-content {
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #e94560;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 响应式 */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    flex-wrap: wrap;
  }
  
  .header-right {
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .evidence-layout {
    grid-template-columns: 1fr;
  }
  
  .location-list {
    order: 2;
  }
  
  .clue-area {
    order: 1;
  }
  
  .location-items {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .location-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .character-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .clue-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .act-nav {
    flex-direction: column;
  }
  
  .act-actions {
    width: 100%;
  }
  
  .act-actions .btn {
    flex: 1;
  }
}
</style>
