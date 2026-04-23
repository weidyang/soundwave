# SoundWave

AI 驱动的智能电台桌面应用。

## 功能

- **音乐电台** — 聚合网易云 / QQ音乐，支持心情模式、风格分类、榜单、搜索、本地音乐、歌词显示
- **播客电台** — 聚合喜马拉雅 / 蜻蜓FM，支持分类、热门、搜索
- **AI 助手** — 智能点歌、歌单生成、对话

## 技术栈

Electron + React + TypeScript + Tailwind CSS + Zustand

## 开发

```bash
npm install
npm run dev
```

## 打包

```bash
npm run dist:win   # Windows
npm run dist:mac   # macOS
```

推送 `v*` 标签自动触发 GitHub Actions 打包双平台安装包。
