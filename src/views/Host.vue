<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const { state, totalActs, currentActData, characters } = gameStore

// 二维码 canvas 引用
const qrCanvas = ref(null)

// 房间信息
const roomId = ref('')
const roomUrl = ref('')

// 当前选中的面板
const activePanel = ref('progress') // progress, clues, voting, players

// 初始化
onMounted(async () => {
  const scriptId = route.params.scriptId
  await gameStore.initGame(scriptId)
  
  // 生成房间 ID
  roomId.value = 'ROOM_' + Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // 生成房间 URL（玩家端）
  const baseUrl = window.location.origin + window.location.pathname
  roomUrl.value = `${baseUrl}#/game/${scriptId}?room=${roomId.value}`
  
  // 生成二维码
  generateQRCode()
})

// 生成二维码
async function generateQRCode() {
  if (!qrCanvas.value || !roomUrl.value) return
  
  try {
    await QRCode.toCanvas(qrCanvas.value, roomUrl.value, {
      width: 200,
      margin: 2,
      color: {
        dark: '#e94560',
        light: '#ffffff'
      }
    })
  } catch (e) {
    console.error('生成二维码失败:', e)
  }
}

// 复制房间链接
function copyRoomUrl() {
  navigator.clipboard.writeText(roomUrl.value).then(() => {
    alert('房间链接已复制到剪贴板！')
  }).catch(() => {
    // 降级方案
    const input = document.createElement('input')
    input.value = roomUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    alert('房间链接已复制！')
  })
}

// 解锁下一幕
function unlockNextAct() {
  if (gameStore.unlockNextAct()) {
    alert(`已解锁第 ${state.unlockedActs + 1} 幕！`)
  } else {
    alert('已经是最后一幕了')
  }
}

// 跳转到指定幕
function jumpToAct(index) {
  if (confirm(`确定要解锁到第 ${index + 1} 幕吗？`)) {
    gameStore.unlockToAct(index)
  }
}

// 开启投票
function openVoting() {
  gameStore.openVoting()
  alert('投票已开启！玩家可以开始投票了')
}

// 关闭投票
function closeVoting() {
  gameStore.closeVoting()
  alert('投票已关闭')
}

// 公布投票结果
function showVoteResults() {
  // 这里可以展示投票统计
  const questions = state.script?.voting?.questions || []
  let resultText = '投票结果：\n\n'
  
  questions.forEach(q => {
    const stats = gameStore.getVoteStats(q.id)
    if (stats) {
      resultText += `【${q.title}】\n`
      for (const optId in stats) {
        resultText += `  ${stats[optId].text}: ${stats[optId].count} 票\n`
      }
      resultText += '\n'
    }
  })
  
  alert(resultText)
}

// 结束游戏
function endGame() {
  if (confirm('确定要结束游戏并公布真相吗？')) {
    gameStore.endGame()
    alert('游戏已结束，真相已公布！')
  }
}

// 重置游戏
function resetGame() {
  if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
    gameStore.resetGame()
    activePanel.value = 'progress'
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 获取投票问题
const votingQuestions = computed(() => {
  return state.script?.voting?.questions || []
})

// 获取所有搜证地点
const allLocations = computed(() => {
  if (!state.script?.clues) return []
  return Object.keys(state.script.clues).map(locId => {
    // 尝试从各幕中查找地点名称
    let name = locId
    let icon = '📍'
    state.script.acts?.forEach(act => {
      const loc = act.locations?.find(l => l.id === locId)
      if (loc) {
        name = loc.name
        icon = loc.icon || '📍'
      }
    })
    return { id: locId, name, icon }
  })
})

// 公开发布线索（将专属线索变为公开）
function revealClue(clueId, locationId) {
  // 这里简化处理，实际可以通过修改线索的 owner 来实现
  alert(`线索已公开：${clueId}`)
}
</script>

<template>
  <div class="host-page">
    <!-- 加载状态 -->
    <div v-if="state.loading" class="loading-container">
      <div class="loading"></div>
      <p class="text-muted mt-2">加载中...</p>
    </div>

    <template v-else>
      <!-- 顶部信息栏 -->
      <div class="host-header card">
        <div class="header-left">
          <button class="btn btn-secondary" @click="goHome">← 返回</button>
          <div>
            <h2 class="script-title">🎤 主持人模式</h2>
            <p class="script-name text-muted">{{ state.script?.name }}</p>
          </div>
        </div>
        
        <div class="header-right">
          <span class="room-badge">房间号: {{ roomId }}</span>
          <button class="btn btn-secondary" @click="resetGame">🔄 重置</button>
        </div>
      </div>

      <div class="host-layout">
        <!-- 左侧：房间信息 & 二维码 -->
        <div class="room-panel card">
          <h3 class="panel-title">📱 玩家入口</h3>
          
          <div class="qr-code-container">
            <canvas ref="qrCanvas"></canvas>
          </div>
          
          <p class="qr-hint">玩家扫码进入游戏</p>
          
          <div class="room-url-section">
            <p class="url-label">房间链接：</p>
            <div class="url-input-wrapper">
              <input type="text" class="input url-input" :value="roomUrl" readonly />
              <button class="btn btn-primary copy-btn" @click="copyRoomUrl">
                复制
              </button>
            </div>
          </div>
          
          <div class="player-count">
            <span class="count-icon">👥</span>
            <span>当前玩家: {{ characters.length }} 个角色</span>
          </div>
        </div>

        <!-- 右侧：控制面板 -->
        <div class="control-panel">
          <!-- 面板切换标签 -->
          <div class="panel-tabs card">
            <button 
              class="tab-btn" 
              :class="{ active: activePanel === 'progress' }"
              @click="activePanel = 'progress'"
            >
              📖 进度控制
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activePanel === 'clues' }"
              @click="activePanel = 'clues'"
            >
              🔍 线索管理
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activePanel === 'voting' }"
              @click="activePanel = 'voting'"
            >
              🗳️ 投票管理
            </button>
          </div>

          <!-- 进度控制面板 -->
          <div v-if="activePanel === 'progress'" class="panel-content card">
            <h3 class="panel-title">📖 游戏进度</h3>
            
            <div class="progress-info">
              <div class="info-item">
                <span class="info-label">当前幕数</span>
                <span class="info-value">{{ state.unlockedActs + 1 }} / {{ totalActs }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">游戏状态</span>
                <span class="info-value" :class="state.gameEnded ? 'text-success' : 'text-primary'">
                  {{ state.gameEnded ? '已结束' : '进行中' }}
                </span>
              </div>
            </div>

            <!-- 幕列表 -->
            <div class="act-list">
              <h4 class="list-subtitle">幕进度</h4>
              <div class="act-items">
                <div
                  v-for="(act, index) in state.script?.acts"
                  :key="index"
                  class="act-item"
                  :class="{ 
                    unlocked: index <= state.unlockedActs,
                    current: index === state.currentAct
                  }"
                  @click="jumpToAct(index)"
                >
                  <span class="act-number">{{ index + 1 }}</span>
                  <span class="act-name">{{ act.title || `第${index + 1}幕` }}</span>
                  <span v-if="index <= state.unlockedActs" class="act-status">✓</span>
                </div>
              </div>
            </div>

            <!-- 控制按钮 -->
            <div class="control-buttons">
              <button 
                class="btn btn-primary w-full" 
                :disabled="state.unlockedActs >= totalActs - 1"
                @click="unlockNextAct"
              >
                🔓 解锁下一幕
              </button>
              
              <button 
                class="btn btn-success w-full" 
                :disabled="state.gameEnded"
                @click="endGame"
              >
                🎬 结束游戏 & 公布真相
              </button>
            </div>
          </div>

          <!-- 线索管理面板 -->
          <div v-if="activePanel === 'clues'" class="panel-content card">
            <h3 class="panel-title">🔍 线索管理</h3>
            
            <div class="locations-list">
              <div v-for="loc in allLocations" :key="loc.id" class="location-section">
                <h4 class="location-title">
                  <span class="loc-icon">{{ loc.icon }}</span>
                  {{ loc.name }}
                </h4>
                <div class="clue-list">
                  <div 
                    v-for="clue in state.script?.clues?.[loc.id]" 
                    :key="clue.id"
                    class="clue-item"
                    :class="{ 'is-private': clue.owner && clue.owner !== 'public' }"
                  >
                    <div class="clue-info">
                      <span class="clue-name">{{ clue.name }}</span>
                      <span v-if="clue.owner && clue.owner !== 'public'" class="clue-owner">
                        专属: {{ characters.find(c => c.id === clue.owner)?.name || clue.owner }}
                      </span>
                    </div>
                    <button 
                      v-if="clue.owner && clue.owner !== 'public'"
                      class="btn btn-secondary btn-sm"
                      @click="revealClue(clue.id, loc.id)"
                    >
                      公开
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <p class="text-muted tip">
              💡 提示：点击"公开"可将专属线索变为公开线索，所有玩家都能看到
            </p>
          </div>

          <!-- 投票管理面板 -->
          <div v-if="activePanel === 'voting'" class="panel-content card">
            <h3 class="panel-title">🗳️ 投票管理</h3>
            
            <div class="voting-status">
              <span class="status-label">投票状态：</span>
              <span class="status-value" :class="state.votingOpen ? 'text-success' : 'text-muted'">
                {{ state.votingOpen ? '🔓 已开启' : '🔒 已关闭' }}
              </span>
            </div>

            <div class="voting-questions">
              <div v-for="question in votingQuestions" :key="question.id" class="question-item">
                <h4 class="question-title">{{ question.title }}</h4>
                <div class="option-list">
                  <div v-for="option in question.options" :key="option.id" class="option-item">
                    <span class="option-text">{{ option.text }}</span>
                    <span class="option-count">
                      {{ gameStore.getVoteStats(question.id)?.[option.id]?.count || 0 }} 票
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="voting-controls">
              <button 
                class="btn btn-success" 
                :disabled="state.votingOpen"
                @click="openVoting"
              >
                🔓 开启投票
              </button>
              <button 
                class="btn btn-warning" 
                :disabled="!state.votingOpen"
                @click="closeVoting"
              >
                🔒 关闭投票
              </button>
              <button class="btn btn-primary" @click="showVoteResults">
                📊 查看结果
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 说明提示 -->
      <div class="host-tips card">
        <h3 class="tips-title">📋 主持人使用说明</h3>
        <div class="tips-content">
          <div class="tip-item">
            <span class="tip-icon">1️⃣</span>
            <p>让玩家扫描二维码或复制链接进入游戏，选择各自的角色</p>
          </div>
          <div class="tip-item">
            <span class="tip-icon">2️⃣</span>
            <p>在"进度控制"面板中逐幕解锁剧本内容，控制游戏节奏</p>
          </div>
          <div class="tip-item">
            <span class="tip-icon">3️⃣</span>
            <p>在"线索管理"面板中可以查看所有线索，必要时公开专属线索</p>
          </div>
          <div class="tip-item">
            <span class="tip-icon">4️⃣</span>
            <p>在"投票管理"面板中开启/关闭投票，查看投票统计结果</p>
          </div>
          <div class="tip-item">
            <span class="tip-icon">5️⃣</span>
            <p>游戏结束后点击"结束游戏"，玩家即可查看真相和结局</p>
          </div>
        </div>
        
        <div class="notice-box">
          <strong>⚠️ 注意：</strong>
          由于纯静态站点限制，主持人与玩家的数据同步需要手动操作。
          主持人解锁幕数后，玩家需要刷新页面或重新进入才能看到最新内容。
          建议主持人在操作后口头通知玩家。
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.host-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

/* 顶部栏 */
.host-header {
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

.script-name {
  margin: 0;
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.room-badge {
  padding: 0.5rem 1rem;
  background: rgba(0, 184, 148, 0.2);
  color: #00b894;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
}

/* 主布局 */
.host-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* 房间面板 */
.room-panel {
  padding: 1.5rem;
  text-align: center;
  position: sticky;
  top: 100px;
}

.panel-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qr-code-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.qr-code-container canvas {
  max-width: 100%;
  height: auto;
}

.qr-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.room-url-section {
  text-align: left;
  margin-bottom: 1rem;
}

.url-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  display: block;
}

.url-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
  font-size: 0.8rem;
  padding: 0.5rem;
}

.copy-btn {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

.player-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
}

.count-icon {
  font-size: 1.2rem;
}

/* 控制面板 */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-tabs {
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.tab-btn.active {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  font-weight: 500;
}

.panel-content {
  padding: 1.5rem;
}

/* 进度控制 */
.progress-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
}

.info-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 1.3rem;
  font-weight: 600;
}

.list-subtitle {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

.act-list {
  margin-bottom: 1.5rem;
}

.act-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.act-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.act-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.act-item.unlocked {
  border-color: rgba(0, 184, 148, 0.3);
  background: rgba(0, 184, 148, 0.1);
}

.act-item.current {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.act-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 600;
}

.act-item.unlocked .act-number {
  background: rgba(0, 184, 148, 0.3);
  color: #00b894;
}

.act-item.current .act-number {
  background: #e94560;
  color: white;
}

.act-name {
  flex: 1;
  font-size: 0.95rem;
}

.act-status {
  color: #00b894;
  font-weight: bold;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.w-full {
  width: 100%;
}

/* 线索管理 */
.locations-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.location-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.location-title {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loc-icon {
  font-size: 1.2rem;
}

.clue-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.clue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.clue-item.is-private {
  border-left: 3px solid #fdcb6e;
}

.clue-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.clue-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.clue-owner {
  font-size: 0.75rem;
  color: #fdcb6e;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.tip {
  margin-top: 1rem;
  font-size: 0.85rem;
  padding: 0.75rem;
  background: rgba(253, 203, 110, 0.1);
  border-radius: 6px;
}

/* 投票管理 */
.voting-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.status-label {
  color: rgba(255, 255, 255, 0.7);
}

.status-value {
  font-weight: 500;
}

.voting-questions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.question-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.question-title {
  font-size: 0.95rem;
  margin: 0 0 0.75rem 0;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.9rem;
}

.option-count {
  color: #e94560;
  font-weight: 500;
}

.voting-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.voting-controls .btn {
  flex: 1;
  min-width: 120px;
}

/* 使用说明 */
.host-tips {
  padding: 1.5rem;
}

.tips-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tip-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.tip-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.tip-item p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.notice-box {
  padding: 1rem;
  background: rgba(253, 203, 110, 0.1);
  border: 1px solid rgba(253, 203, 110, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

.notice-box strong {
  color: #fdcb6e;
}

/* 响应式 */
@media (max-width: 900px) {
  .host-layout {
    grid-template-columns: 1fr;
  }
  
  .room-panel {
    position: static;
  }
}

@media (max-width: 600px) {
  .panel-tabs {
    flex-direction: column;
  }
  
  .progress-info {
    grid-template-columns: 1fr;
  }
  
  .voting-controls {
    flex-direction: column;
  }
  
  .voting-controls .btn {
    width: 100%;
  }
}
</style>
