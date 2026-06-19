/**
 * 剧本加载工具
 * 负责从 /scripts 目录加载剧本列表和具体剧本内容
 */

import { loadData, saveData } from './storage'

// 本地临时剧本存储 key
const TEMP_SCRIPT_KEY = 'temp_script'

// 获取剧本索引列表
export async function getScriptList() {
  try {
    // 尝试加载索引文件
    const response = await fetch('./scripts/index.json')
    if (response.ok) {
      const data = await response.json()
      return data.scripts || []
    }
  } catch (e) {
    console.warn('加载剧本索引失败，使用空列表:', e)
  }
  return []
}

// 加载指定剧本
export async function loadScript(scriptId) {
  try {
    // 先检查是否是临时上传的剧本
    const tempScript = loadData(TEMP_SCRIPT_KEY, null)
    if (tempScript && tempScript.id === scriptId) {
      return tempScript
    }
    
    // 从服务器加载
    const response = await fetch(`./scripts/${scriptId}.json`)
    if (response.ok) {
      const data = await response.json()
      return data
    }
    throw new Error('剧本不存在')
  } catch (e) {
    console.error('加载剧本失败:', e)
    throw e
  }
}

// 保存临时剧本（本地上传）
export function saveTempScript(scriptData) {
  // 生成临时 ID
  if (!scriptData.id) {
    scriptData.id = 'temp_' + Date.now()
  }
  saveData(TEMP_SCRIPT_KEY, scriptData)
  return scriptData
}

// 获取临时剧本
export function getTempScript() {
  return loadData(TEMP_SCRIPT_KEY, null)
}

// 清除临时剧本
export function clearTempScript() {
  saveData(TEMP_SCRIPT_KEY, null)
}

// 验证剧本格式
export function validateScript(scriptData) {
  const errors = []
  
  if (!scriptData.id) errors.push('缺少剧本ID (id)')
  if (!scriptData.name) errors.push('缺少剧本名称 (name)')
  if (!scriptData.characters || !Array.isArray(scriptData.characters)) {
    errors.push('缺少角色列表 (characters)')
  }
  if (!scriptData.acts || !Array.isArray(scriptData.acts)) {
    errors.push('缺少分幕内容 (acts)')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 从文件读取剧本
export function readScriptFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const scriptData = JSON.parse(e.target.result)
        const validation = validateScript(scriptData)
        if (!validation.valid) {
          reject(new Error('剧本格式错误: ' + validation.errors.join('; ')))
          return
        }
        resolve(scriptData)
      } catch (err) {
        reject(new Error('JSON 解析失败: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
