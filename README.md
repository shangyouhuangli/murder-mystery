# 🎭 剧本杀平台

一个纯静态的剧本杀在线游玩平台，基于 Vue 3 + Vite 构建，支持部署到 GitHub Pages。

## ✨ 功能特性

- 🎮 **剧本大厅**：浏览、搜索、筛选剧本
- 📖 **分幕阅读**：逐幕解锁剧本，沉浸式阅读体验
- 🔍 **搜证系统**：多地点搜证，支持公开/专属线索
- 🎭 **角色选择**：每个角色独立剧本，随机分配功能
- 🗳️ **投票环节**：支持多问题投票
- 🎬 **结局复盘**：真相、结局、彩蛋完整呈现
- 💾 **存档系统**：自动保存进度，支持导入导出
- 🎤 **主持人模式**：进度控制、线索管理、投票管理
- 📱 **二维码房间**：扫码进入，方便线下聚会使用
- 📁 **本地上传**：支持上传自定义 JSON 剧本
- 🎨 **精美 UI**：深色主题，响应式设计

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 部署到 GitHub Pages

项目已配置 GitHub Actions 自动部署，只需推送到 `main` 分支即可自动部署。

详细部署说明请参考 [部署文档](docs/DEPLOY.md)。

## 📁 项目结构

```
murder-mystery/
├── public/
│   └── scripts/              # 剧本文件目录
│       ├── index.json        # 剧本索引
│       └── rainy-night-mansion.json  # 示例剧本
├── src/
│   ├── views/                # 页面组件
│   │   ├── Home.vue          # 剧本大厅
│   │   ├── Game.vue          # 游戏主页面
│   │   ├── Host.vue          # 主持人模式
│   │   └── Upload.vue        # 本地上传
│   ├── stores/               # 状态管理
│   │   └── game.js           # 游戏状态
│   ├── utils/                # 工具函数
│   │   ├── storage.js        # 本地存储
│   │   └── script.js         # 剧本加载
│   ├── router/               # 路由配置
│   │   └── index.js
│   ├── App.vue               # 根组件
│   ├── main.js               # 入口文件
│   └── style.css             # 全局样式
├── docs/                     # 文档
│   ├── SCRIPT_FORMAT.md      # 剧本格式规范
│   └── DEPLOY.md             # 部署说明
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 配置
└── package.json
```

## 📝 剧本格式

剧本采用 JSON 格式，包含角色、分幕、线索、投票、结局等完整信息。

详细格式规范请参考 [剧本格式文档](docs/SCRIPT_FORMAT.md)。

### 快速创建剧本

1. 下载剧本模板（网站内"本地剧本"页面可下载）
2. 按照格式编写你的剧本内容
3. 上传到网站即可开始游玩

或者将剧本文件放入 `public/scripts/` 目录，随项目一起部署。

## 🎯 使用场景

- 🎉 朋友聚会：线下聚会，每人拿手机玩
- 🏠 线上玩：远程连麦，各自读剧本
- 📚 剧本创作：测试自己写的剧本
- 🎓 教学演示：剧本杀入门教学

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由
- **QRCode.js** - 二维码生成库

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

🎭 享受你的剧本杀之旅吧！
