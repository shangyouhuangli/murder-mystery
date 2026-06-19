# 剧本 JSON 格式规范文档

## 概述

本规范定义了剧本杀平台使用的剧本数据格式。所有剧本文件均采用 JSON 格式，存放于 `/public/scripts/` 目录下。

## 文件结构

每个剧本对应一个独立的 JSON 文件，文件名即为剧本 ID（如 `rainy-night-mansion.json`）。

同时需要在 `index.json` 中注册剧本的基本信息，用于剧本大厅展示。

---

## 完整字段说明

### 1. 基础信息

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 剧本唯一标识符，与文件名一致 |
| `name` | string | ✅ | 剧本名称 |
| `description` | string | ✅ | 剧本简介，显示在剧本大厅 |
| `cover` | string | ❌ | 封面图片路径，相对路径或完整 URL |
| `genres` | string[] | ❌ | 题材标签数组，如 `["推理", "悬疑"]` |
| `playerCount` | number | ❌ | 玩家人数 |
| `difficulty` | string/number | ❌ | 难度：`easy`/`medium`/`hard` 或 1/2/3 |
| `duration` | number | ❌ | 预计游戏时长（分钟） |

### 2. 角色列表 (`characters`)

数组类型，每个角色包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 角色唯一 ID |
| `name` | string | ✅ | 角色名称 |
| `avatar` | string | ❌ | 角色头像，可用 emoji 或图片 URL |
| `gender` | string | ❌ | 性别：`男`/`女`/`其他` |
| `description` | string | ❌ | 角色简介 |

### 3. 分幕内容 (`acts`)

数组类型，按顺序排列，每一幕包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 幕的唯一 ID |
| `title` | string | ✅ | 幕标题 |
| `subtitle` | string | ❌ | 幕副标题 |
| `content` | string | ❌ | 通用剧本内容（HTML 格式），所有角色都能看到 |
| `contents` | object | ❌ | 分角色剧本内容，key 为角色 ID，value 为 HTML 字符串 |
| `locations` | array | ❌ | 本幕可搜证的地点列表 |

#### 地点对象 (`locations` 子项)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 地点 ID，与线索中的地点对应 |
| `name` | string | ✅ | 地点名称 |
| `icon` | string | ❌ | 地点图标，可用 emoji |

### 4. 线索系统 (`clues`)

对象类型，key 为地点 ID，value 为该地点的线索数组。

#### 线索对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 线索唯一 ID |
| `name` | string | ✅ | 线索名称 |
| `description` | string | ✅ | 线索详细描述 |
| `owner` | string | ❌ | 线索所有者：`public`（公开）或角色 ID（专属线索） |

### 5. 投票环节 (`voting`)

对象类型，包含投票问题列表。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `questions` | array | ✅ | 投票问题列表 |

#### 投票问题对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 问题唯一 ID |
| `title` | string | ✅ | 问题标题 |
| `options` | array | ✅ | 选项列表 |

#### 投票选项对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 选项唯一 ID |
| `text` | string | ✅ | 选项文本 |

### 6. 结局复盘

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `truth` | string | ❌ | 案件真相（HTML 格式） |
| `endings` | array | ❌ | 结局列表 |
| `easterEggs` | string | ❌ | 彩蛋内容（HTML 格式） |

#### 结局对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 结局唯一 ID |
| `title` | string | ✅ | 结局标题 |
| `content` | string | ✅ | 结局内容（HTML 格式） |

---

## 完整示例

```json
{
  "id": "example-script",
  "name": "示例剧本",
  "description": "这是一个示例剧本的简介",
  "cover": "",
  "genres": ["推理", "悬疑"],
  "playerCount": 4,
  "difficulty": "medium",
  "duration": 120,
  
  "characters": [
    {
      "id": "char1",
      "name": "角色一",
      "avatar": "👤",
      "gender": "男",
      "description": "角色一的简介"
    },
    {
      "id": "char2",
      "name": "角色二",
      "avatar": "👩",
      "gender": "女",
      "description": "角色二的简介"
    }
  ],
  
  "acts": [
    {
      "id": "act1",
      "title": "第一幕",
      "subtitle": "序幕",
      "content": "<p>这是所有角色都能看到的通用内容</p>",
      "contents": {
        "char1": "<p>角色一的专属剧本内容</p>",
        "char2": "<p>角色二的专属剧本内容</p>"
      },
      "locations": [
        {
          "id": "room1",
          "name": "房间一",
          "icon": "🚪"
        }
      ]
    }
  ],
  
  "clues": {
    "room1": [
      {
        "id": "clue1",
        "name": "公开线索",
        "description": "这是一条所有玩家都能调查的公开线索",
        "owner": "public"
      },
      {
        "id": "clue2",
        "name": "专属线索",
        "description": "这是只有角色一才能看到的专属线索",
        "owner": "char1"
      }
    ]
  },
  
  "voting": {
    "questions": [
      {
        "id": "q1",
        "title": "谁是凶手？",
        "options": [
          { "id": "opt1", "text": "角色一" },
          { "id": "opt2", "text": "角色二" }
        ]
      }
    ]
  },
  
  "truth": "<h3>案件真相</h3><p>这里是完整的案件真相...</p>",
  
  "endings": [
    {
      "id": "ending1",
      "title": "结局一",
      "content": "<p>结局一的详细内容...</p>"
    }
  ],
  
  "easterEggs": "<p>这里是彩蛋内容...</p>"
}
```

---

## 剧本索引文件 (`index.json`)

剧本大厅通过 `index.json` 获取所有剧本的列表。格式如下：

```json
{
  "scripts": [
    {
      "id": "rainy-night-mansion",
      "name": "雨夜山庄谋杀案",
      "description": "剧本简介...",
      "cover": "",
      "genres": ["推理", "悬疑"],
      "playerCount": 4,
      "difficulty": "简单",
      "duration": 90
    }
  ]
}
```

**注意：** 新增剧本后，需要手动更新 `index.json`，或使用构建脚本自动生成。

---

## 注意事项

1. **HTML 内容**：剧本内容、真相、结局等字段支持 HTML 标签，可以使用 `<p>`、`<strong>`、`<br>` 等标签进行排版。

2. **专属线索**：设置 `owner` 为角色 ID 的线索，只有对应角色才能看到和调查。

3. **分幕解锁**：剧本默认从第一幕开始，需要主持人逐幕解锁。玩家无法跳幕阅读。

4. **图片素材**：建议将剧本相关的图片素材放在 `/public/scripts/assets/` 目录下，使用相对路径引用。

5. **字符编码**：JSON 文件请使用 UTF-8 编码，确保中文正常显示。

6. **格式验证**：上传剧本前，建议使用 JSON 校验工具检查格式是否正确。
