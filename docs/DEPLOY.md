# 部署说明

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可查看效果。

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist` 目录。

---

## 部署到 GitHub Pages

### 方法一：使用 GitHub Actions 自动部署（推荐）

项目已经配置好了 GitHub Actions 工作流，只需推送到 `main` 分支即可自动部署。

#### 步骤：

1. **创建 GitHub 仓库**
   - 在 GitHub 上创建一个新的仓库
   - 可以选择 Public 或 Private

2. **推送代码**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. **启用 GitHub Pages**
   - 进入仓库的 Settings → Pages
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `gh-pages`，目录选择 `/ (root)`
   - 点击 Save

4. **等待部署完成**
   - 推送代码后，GitHub Actions 会自动运行构建和部署
   - 可以在 Actions 标签页查看部署进度
   - 部署完成后，页面会显示在 `https://你的用户名.github.io/仓库名/`

### 方法二：手动部署

如果你不想使用 GitHub Actions，也可以手动构建并部署。

#### 步骤：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **创建 gh-pages 分支**
   ```bash
   # 进入构建产物目录
   cd dist
   
   # 初始化 git 仓库
   git init
   git checkout -b gh-pages
   git add .
   git commit -m "Deploy to GitHub Pages"
   
   # 推送到远程仓库的 gh-pages 分支
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -f origin gh-pages
   ```

3. **配置 GitHub Pages**
   - 进入仓库的 Settings → Pages
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `gh-pages`，目录选择 `/ (root)`

---

## 添加新剧本

### 方法一：放入 public 目录（随项目一起部署）

1. 将剧本 JSON 文件放入 `public/scripts/` 目录
2. 在 `public/scripts/index.json` 中添加剧本的基本信息
3. 重新构建并部署

### 方法二：本地上传（无需重新部署）

玩家可以直接在网站上上传本地的 JSON 剧本文件，无需修改代码或重新部署。

- 进入网站 → 点击"本地剧本" → 上传 JSON 文件
- 上传的剧本保存在浏览器本地存储中，刷新页面后需要重新上传

---

## 常见问题

### Q: 部署后页面空白怎么办？

A: 检查以下几点：
1. 确保 `vite.config.js` 中的 `base` 设置正确（当前设置为 `'./'`，适用于大多数情况）
2. 检查浏览器控制台是否有报错
3. 确认 gh-pages 分支是否有内容

### Q: 剧本加载失败怎么办？

A: 
1. 检查 JSON 文件格式是否正确
2. 确认文件路径是否正确
3. 查看浏览器 Network 面板，确认文件是否成功加载

### Q: 存档会丢失吗？

A: 
- 存档保存在浏览器的 localStorage 中
- 清除浏览器数据或换设备会丢失
- 建议使用导出功能备份存档

### Q: 主持人和玩家怎么同步？

A: 
- 由于是纯静态站点，没有后端服务器，数据无法实时同步
- 主持人解锁幕数后，玩家需要刷新页面才能看到最新内容
- 建议主持人在操作后口头通知玩家刷新

---

## 自定义配置

### 修改网站标题

编辑 `index.html` 中的 `<title>` 标签。

### 修改主题色

在 `src/style.css` 中修改 CSS 变量：
- 主色调：`#e94560`（红色）
- 背景色：深色渐变

### 添加更多功能

项目使用 Vue 3 + Vite 构建，可以根据需要扩展功能：
- 添加音效和背景音乐
- 实现实时聊天功能（需要后端支持）
- 添加更多剧本模板
- 支持更多存档格式
