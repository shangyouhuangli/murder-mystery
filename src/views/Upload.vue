<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { readScriptFile, saveTempScript, validateScript } from '../utils/script'

const router = useRouter()

const fileInput = ref(null)
const isDragging = ref(false)
const error = ref('')
const previewScript = ref(null)

// 处理文件选择
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理拖拽
function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理文件
async function processFile(file) {
  error.value = ''
  previewScript.value = null
  
  if (!file.name.endsWith('.json')) {
    error.value = '请上传 JSON 格式的剧本文件'
    return
  }
  
  try {
    const scriptData = await readScriptFile(file)
    
    // 验证格式
    const validation = validateScript(scriptData)
    if (!validation.valid) {
      error.value = '剧本格式错误：' + validation.errors.join('；')
      return
    }
    
    previewScript.value = scriptData
  } catch (e) {
    error.value = '读取文件失败：' + e.message
  }
}

// 开始游戏
function startGame() {
  if (!previewScript.value) return
  
  const savedScript = saveTempScript(previewScript.value)
  router.push(`/game/${savedScript.id}`)
}

// 主持人模式
function startHost() {
  if (!previewScript.value) return
  
  const savedScript = saveTempScript(previewScript.value)
  router.push(`/host/${savedScript.id}`)
}

// 重新选择
function resetSelection() {
  previewScript.value = null
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 下载模板
function downloadTemplate() {
  const template = {
    id: "your-script-id",
    name: "剧本名称",
    description: "剧本简介",
    cover: "",
    genres: ["推理", "悬疑"],
    playerCount: 4,
    difficulty: "medium",
    duration: 120,
    characters: [
      {
        id: "char1",
        name: "角色一",
        avatar: "👤",
        gender: "男",
        description: "角色简介"
      }
    ],
    acts: [
      {
        id: "act1",
        title: "第一幕",
        subtitle: "序幕",
        content: "通用剧本内容（如果没有分角色内容则显示这个）",
        contents: {
          "char1": "<p>角色一的专属剧本内容</p>"
        },
        locations: [
          {
            id: "loc1",
            name: "地点一",
            icon: "🏠"
          }
        ]
      }
    ],
    clues: {
      "loc1": [
        {
          id: "clue1",
          name: "线索名称",
          description: "线索描述",
          owner: "public"
        }
      ]
    },
    voting: {
      questions: [
        {
          id: "q1",
          title: "投票问题",
          options: [
            { id: "opt1", text: "选项一" },
            { id: "opt2", text: "选项二" }
          ]
        }
      ]
    },
    truth: "<p>案件真相内容</p>",
    endings: [
      {
        id: "ending1",
        title: "结局标题",
        content: "<p>结局内容</p>"
      }
    ],
    easterEggs: "<p>彩蛋内容</p>"
  }
  
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'script-template.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="upload-page">
    <div class="page-header">
      <h1 class="page-title">📁 本地剧本上传</h1>
      <p class="page-subtitle">上传你的 JSON 剧本文件，立即开始游玩</p>
    </div>

    <!-- 上传区域 -->
    <div v-if="!previewScript" class="upload-section">
      <div
        class="upload-zone card"
        :class="{ dragging: isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="fileInput?.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />
        
        <div class="upload-icon">📤</div>
        <h3 class="upload-title">点击或拖拽上传剧本文件</h3>
        <p class="upload-hint text-muted">支持 .json 格式的剧本文件</p>
        
        <button class="btn btn-primary mt-3" @click.stop="fileInput?.click()">
          选择文件
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-box">
        <span class="error-icon">❌</span>
        <span class="error-text">{{ error }}</span>
      </div>

      <!-- 模板下载 -->
      <div class="template-section card">
        <div class="template-content">
          <div class="template-icon">📋</div>
          <div>
            <h3>需要剧本模板？</h3>
            <p class="text-muted">下载标准的剧本 JSON 模板，按照格式编写你自己的剧本</p>
          </div>
          <button class="btn btn-secondary" @click="downloadTemplate">
            下载模板
          </button>
        </div>
      </div>

      <!-- 格式说明 -->
      <div class="format-info card">
        <h3 class="info-title">📖 剧本格式说明</h3>
        <div class="info-content">
          <p>剧本文件采用 JSON 格式，包含以下主要字段：</p>
          <ul class="field-list">
            <li><strong>基础信息</strong>：id、name、description、genres、playerCount、difficulty、duration</li>
            <li><strong>角色列表</strong>：characters 数组，每个角色有 id、name、avatar、description</li>
            <li><strong>分幕内容</strong>：acts 数组，每幕包含标题、内容、搜证地点</li>
            <li><strong>线索系统</strong>：clues 对象，按地点分组，支持公开/专属线索</li>
            <li><strong>投票环节</strong>：voting 对象，包含投票问题和选项</li>
            <li><strong>结局复盘</strong>：truth（真相）、endings（结局列表）、easterEggs（彩蛋）</li>
          </ul>
          <p class="text-muted">
            详细的格式规范请参考项目文档中的《剧本 JSON 格式规范》。
          </p>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-else class="preview-section">
      <div class="preview-header card">
        <div class="preview-title">
          <span class="check-icon">✅</span>
          <h2>剧本验证通过</h2>
        </div>
        <button class="btn btn-secondary" @click="resetSelection">
          重新选择
        </button>
      </div>

      <!-- 剧本信息预览 -->
      <div class="script-preview card">
        <div class="preview-cover">
          <span class="cover-icon">🎭</span>
        </div>
        
        <div class="preview-info">
          <h3 class="script-name">{{ previewScript.name }}</h3>
          
          <div class="script-tags">
            <span v-for="genre in previewScript.genres" :key="genre" class="tag">
              {{ genre }}
            </span>
          </div>

          <div class="script-meta">
            <span class="meta-item">👥 {{ previewScript.playerCount || previewScript.characters?.length }} 人</span>
            <span class="meta-item">⏱️ {{ previewScript.duration || '未知' }} 分钟</span>
            <span class="meta-item">⭐ {{ previewScript.difficulty || '中等' }}</span>
          </div>

          <p class="script-desc">{{ previewScript.description }}</p>

          <div class="script-stats">
            <div class="stat-item">
              <span class="stat-value">{{ previewScript.characters?.length || 0 }}</span>
              <span class="stat-label">角色</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ previewScript.acts?.length || 0 }}</span>
              <span class="stat-label">分幕</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ previewScript.voting?.questions?.length || 0 }}</span>
              <span class="stat-label">投票问题</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色列表 -->
      <div class="characters-preview card">
        <h3 class="section-title">👥 角色列表</h3>
        <div class="char-grid">
          <div v-for="char in previewScript.characters" :key="char.id" class="char-item">
            <span class="char-avatar">{{ char.avatar || '👤' }}</span>
            <span class="char-name">{{ char.name }}</span>
          </div>
        </div>
      </div>

      <!-- 开始按钮 -->
      <div class="start-actions">
        <button class="btn btn-primary btn-large" @click="startGame">
          🎮 开始游戏
        </button>
        <button class="btn btn-secondary btn-large" @click="startHost">
          🎤 主持人模式
        </button>
      </div>

      <p class="notice text-muted">
        💡 提示：本地上传的剧本仅保存在你的浏览器中，不会上传到服务器。
        刷新页面后需要重新上传。
      </p>
    </div>
  </div>
</template>

<style scoped>
.upload-page {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  text-align: center;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

/* 上传区域 */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-zone {
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.05);
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.upload-title {
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
}

.upload-hint {
  font-size: 0.9rem;
  margin: 0;
}

/* 错误提示 */
.error-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(233, 69, 96, 0.1);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
}

.error-icon {
  font-size: 1.2rem;
}

/* 模板区域 */
.template-section {
  padding: 1.5rem;
}

.template-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.template-icon {
  font-size: 3rem;
}

.template-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.template-content p {
  margin: 0;
  font-size: 0.9rem;
}

.template-content .btn {
  margin-left: auto;
}

/* 格式说明 */
.format-info {
  padding: 1.5rem;
}

.info-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.info-content p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.field-list {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.8;
}

.field-list li {
  margin-bottom: 0.25rem;
}

/* 预览区域 */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.preview-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.check-icon {
  font-size: 1.5rem;
}

.preview-title h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #00b894;
}

/* 剧本预览 */
.script-preview {
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
}

.preview-cover {
  width: 150px;
  height: 200px;
  background: linear-gradient(135deg, #2d3436, #636e72);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.preview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.script-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.script-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.script-desc {
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
}

.script-stats {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #e94560;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 角色预览 */
.characters-preview {
  padding: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.char-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.char-avatar {
  font-size: 2rem;
}

.char-name {
  font-size: 0.9rem;
  text-align: center;
}

/* 开始按钮 */
.start-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  min-width: 180px;
}

.notice {
  text-align: center;
  font-size: 0.9rem;
}

/* 响应式 */
@media (max-width: 600px) {
  .script-preview {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .preview-cover {
    width: 120px;
    height: 160px;
  }
  
  .script-tags,
  .script-meta,
  .script-stats {
    justify-content: center;
  }
  
  .template-content {
    flex-direction: column;
    text-align: center;
  }
  
  .template-content .btn {
    margin-left: 0;
    width: 100%;
  }
  
  .start-actions {
    flex-direction: column;
  }
  
  .btn-large {
    width: 100%;
  }
}
</style>
