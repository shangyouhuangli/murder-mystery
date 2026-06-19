/**
 * 游戏状态管理
 * 使用 Vue 3 的 reactive 实现简单的状态管理
 */

import { reactive, computed } from 'vue'
import { getSave, saveGame } from '../utils/storage'
import { loadScript } from '../utils/script'

// 游戏状态
const state = reactive({
  // 剧本数据
  script: null,
  scriptId: null,
  
  // 当前选中的角色
  currentCharacter: null,
  
  // 当前幕数（从 0 开始）
  currentAct: 0,
  
  // 已解锁的幕数
  unlockedActs: 0,
  
  // 已发现的线索
  discoveredClues: {},
  
  // 投票结果
  votes: {},
  
  // 投票是否开启
  votingOpen: false,
  
  // 游戏是否结束
  gameEnded: false,
  
  // 是否显示真相
  showTruth: false,
  
  // 加载状态
  loading: false,
  error: null
})

// 计算属性
const totalActs = computed(() => state.script?.acts?.length || 0)
const currentActData = computed(() => state.script?.acts?.[state.currentAct] || null)
const characters = computed(() => state.script?.characters || [])

// 初始化游戏
async function initGame(scriptId, characterId = null) {
  state.loading = true
  state.error = null
  
  try {
    // 加载剧本
    const script = await loadScript(scriptId)
    state.script = script
    state.scriptId = scriptId
    
    // 尝试加载存档
    const savedGame = getSave(scriptId)
    if (savedGame) {
      state.currentCharacter = savedGame.currentCharacter || characterId
      state.currentAct = savedGame.currentAct || 0
      state.unlockedActs = savedGame.unlockedActs || 0
      state.discoveredClues = savedGame.discoveredClues || {}
      state.votes = savedGame.votes || {}
      state.votingOpen = savedGame.votingOpen || false
      state.gameEnded = savedGame.gameEnded || false
      state.showTruth = savedGame.showTruth || false
    } else {
      state.currentCharacter = characterId
      state.currentAct = 0
      state.unlockedActs = 0
      state.discoveredClues = {}
      state.votes = {}
      state.votingOpen = false
      state.gameEnded = false
      state.showTruth = false
    }
    
    // 自动保存
    autoSave()
    
  } catch (e) {
    state.error = e.message
    console.error('初始化游戏失败:', e)
  } finally {
    state.loading = false
  }
}

// 选择角色
function selectCharacter(characterId) {
  state.currentCharacter = characterId
  autoSave()
}

// 随机分配角色
function randomCharacter() {
  if (!state.script?.characters?.length) return null
  const randomIndex = Math.floor(Math.random() * state.script.characters.length)
  const character = state.script.characters[randomIndex]
  state.currentCharacter = character.id
  autoSave()
  return character
}

// 进入下一幕
function nextAct() {
  if (state.currentAct < state.unlockedActs && state.currentAct < totalActs.value - 1) {
    state.currentAct++
    autoSave()
    return true
  }
  return false
}

// 返回上一幕
function prevAct() {
  if (state.currentAct > 0) {
    state.currentAct--
    autoSave()
    return true
  }
  return false
}

// 解锁下一幕（主持人功能）
function unlockNextAct() {
  if (state.unlockedActs < totalActs.value - 1) {
    state.unlockedActs++
    autoSave()
    return true
  }
  return false
}

// 解锁到指定幕
function unlockToAct(actIndex) {
  if (actIndex >= 0 && actIndex < totalActs.value) {
    state.unlockedActs = actIndex
    autoSave()
    return true
  }
  return false
}

// 发现线索
function discoverClue(clueId, locationId) {
  if (!state.discoveredClues[locationId]) {
    state.discoveredClues[locationId] = []
  }
  if (!state.discoveredClues[locationId].includes(clueId)) {
    state.discoveredClues[locationId].push(clueId)
    autoSave()
  }
}

// 检查线索是否已发现
function isClueDiscovered(clueId, locationId) {
  return state.discoveredClues[locationId]?.includes(clueId) || false
}

// 获取当前角色的专属线索
function getCharacterClues(characterId) {
  const clues = []
  // 遍历所有地点的线索
  if (state.script?.clues) {
    for (const locationId in state.script.clues) {
      const locationClues = state.script.clues[locationId]
      locationClues.forEach(clue => {
        if (clue.owner === characterId && isClueDiscovered(clue.id, locationId)) {
          clues.push({ ...clue, locationId })
        }
      })
    }
  }
  return clues
}

// 提交投票
function submitVote(questionId, optionId) {
  if (!state.votingOpen) return false
  if (!state.votes[questionId]) {
    state.votes[questionId] = {}
  }
  state.votes[questionId][state.currentCharacter] = optionId
  autoSave()
  return true
}

// 获取投票统计
function getVoteStats(questionId) {
  const question = state.script?.voting?.questions?.find(q => q.id === questionId)
  if (!question) return null
  
  const votes = state.votes[questionId] || {}
  const stats = {}
  
  question.options.forEach(option => {
    stats[option.id] = {
      text: option.text,
      count: 0
    }
  })
  
  for (const charId in votes) {
    const optionId = votes[charId]
    if (stats[optionId]) {
      stats[optionId].count++
    }
  }
  
  return stats
}

// 开启投票
function openVoting() {
  state.votingOpen = true
  autoSave()
}

// 关闭投票
function closeVoting() {
  state.votingOpen = false
  autoSave()
}

// 结束游戏
function endGame() {
  state.gameEnded = true
  state.showTruth = true
  autoSave()
}

// 显示真相
function revealTruth() {
  state.showTruth = true
  autoSave()
}

// 自动保存
function autoSave() {
  if (!state.scriptId) return
  
  const saveData = {
    currentCharacter: state.currentCharacter,
    currentAct: state.currentAct,
    unlockedActs: state.unlockedActs,
    discoveredClues: state.discoveredClues,
    votes: state.votes,
    votingOpen: state.votingOpen,
    gameEnded: state.gameEnded,
    showTruth: state.showTruth
  }
  
  saveGame(state.scriptId, saveData)
}

// 重置游戏
function resetGame() {
  state.currentCharacter = null
  state.currentAct = 0
  state.unlockedActs = 0
  state.discoveredClues = {}
  state.votes = {}
  state.votingOpen = false
  state.gameEnded = false
  state.showTruth = false
  autoSave()
}

// 从存档恢复
function restoreFromSave(saveData) {
  if (saveData.currentCharacter !== undefined) state.currentCharacter = saveData.currentCharacter
  if (saveData.currentAct !== undefined) state.currentAct = saveData.currentAct
  if (saveData.unlockedActs !== undefined) state.unlockedActs = saveData.unlockedActs
  if (saveData.discoveredClues) state.discoveredClues = saveData.discoveredClues
  if (saveData.votes) state.votes = saveData.votes
  if (saveData.votingOpen !== undefined) state.votingOpen = saveData.votingOpen
  if (saveData.gameEnded !== undefined) state.gameEnded = saveData.gameEnded
  if (saveData.showTruth !== undefined) state.showTruth = saveData.showTruth
  autoSave()
}

export const useGameStore = () => ({
  state,
  totalActs,
  currentActData,
  characters,
  initGame,
  selectCharacter,
  randomCharacter,
  nextAct,
  prevAct,
  unlockNextAct,
  unlockToAct,
  discoverClue,
  isClueDiscovered,
  getCharacterClues,
  submitVote,
  getVoteStats,
  openVoting,
  closeVoting,
  endGame,
  revealTruth,
  resetGame,
  restoreFromSave,
  autoSave
})
