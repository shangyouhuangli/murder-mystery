/**
 * 本地存储工具 - 基于 localStorage 实现存档系统
 */

const STORAGE_PREFIX = 'murder_mystery_'

// 获取存储键名
function getKey(key) {
  return STORAGE_PREFIX + key
}

// 保存数据
export function saveData(key, data) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(data))
    return true
  } catch (e) {
    console.error('保存数据失败:', e)
    return false
  }
}

// 读取数据
export function loadData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(getKey(key))
    return data ? JSON.parse(data) : defaultValue
  } catch (e) {
    console.error('读取数据失败:', e)
    return defaultValue
  }
}

// 删除数据
export function removeData(key) {
  try {
    localStorage.removeItem(getKey(key))
    return true
  } catch (e) {
    console.error('删除数据失败:', e)
    return false
  }
}

// 游戏存档相关
const SAVE_KEY = 'game_saves'

// 获取所有存档
export function getAllSaves() {
  return loadData(SAVE_KEY, {})
}

// 获取指定剧本的存档
export function getSave(scriptId) {
  const saves = getAllSaves()
  return saves[scriptId] || null
}

// 保存游戏进度
export function saveGame(scriptId, gameData) {
  const saves = getAllSaves()
  saves[scriptId] = {
    ...gameData,
    savedAt: new Date().toISOString()
  }
  return saveData(SAVE_KEY, saves)
}

// 删除存档
export function deleteSave(scriptId) {
  const saves = getAllSaves()
  delete saves[scriptId]
  return saveData(SAVE_KEY, saves)
}

// 导出存档为 JSON 文件
export function exportSave(scriptId) {
  const save = getSave(scriptId)
  if (!save) return null
  
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `save_${scriptId}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

// 导入存档文件
export function importSave(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target.result)
        resolve(saveData)
      } catch (err) {
        reject(new Error('存档文件格式错误'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

// 主持人房间数据
const HOST_ROOM_KEY = 'host_room'

export function getHostRoom() {
  return loadData(HOST_ROOM_KEY, null)
}

export function saveHostRoom(roomData) {
  return saveData(HOST_ROOM_KEY, roomData)
}

export function clearHostRoom() {
  return removeData(HOST_ROOM_KEY)
}
