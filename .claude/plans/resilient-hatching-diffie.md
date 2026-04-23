# Claude AI Radio - UI 高级重构方案

## Context

当前 UI 功能完整但视觉层次扁平：两个 card 样式完全相同、播控区没有卡片包裹、没有进度条、没有专辑封面展示、状态栏是调试文本、没有入场动画。用户要求"显得高级一些"。

## 设计方向：毛玻璃深空风 (Glassmorphism + Deep Space)

保留现有"琥珀+赛博蓝+深色"配色，叠加毛玻璃质感、光晕层次、微动效。

---

## 改动清单

### 1. globals.css - 设计系统升级
**文件**: `src/renderer/styles/globals.css`
- 加强背景渐变：顶部琥珀光晕 8%、右下赛博蓝 5%（当前 2-3% 太淡）
- 新增 `.glass` 类：`backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]`
- 新增 `.glass-amber` / `.glass-cyan` 变体带对应色调
- 新增动画：`@keyframes slide-up`、`@keyframes fade-in`（面板入场用）
- 进度条样式 `.progress-bar` 和 `.progress-thumb`
- 当前播放封面 `.cover-art` 带呼吸光晕

### 2. AppLayout.tsx - 整体布局重构
**文件**: `src/renderer/components/layout/AppLayout.tsx`
- 顶部区域：ChannelIndicator + Visualizer 用 `.glass` 卡片
- 中间内容区：用 `.glass` 卡片，加 `shadow-2xl`
- **底部播控区包进单独 `.glass-amber` 卡片**（当前裸露在背景上）
- 频道切换 + AI 按钮也包进底部卡片
- 整体间距改为 `gap-3`，底部播控卡片用 `p-3`

### 3. PlaybackControls.tsx - 大幅增强
**文件**: `src/renderer/components/radio/PlaybackControls.tsx`
- 新增：**当前播放信息条**（封面缩略图 + 歌名 + 歌手），放在控制按钮上方
- 新增：**进度条**（可拖拽 seek bar），显示当前时间/总时长
- 跳过按钮加 `hover:scale-110` 微缩放
- 播放按钮加 `active:scale-95` 按压反馈
- 需要接收 audioRef 来读取 currentTime/duration（从 MusicPlayer 提升状态或用 store）

### 4. Visualizer.tsx - 增加动态响应
**文件**: `src/renderer/components/radio/Visualizer.tsx`
- 高度从 56px 提升到 72px
- 增加底部倒影效果（半透明镜像）
- 中心频段加更亮的发光
- 柱体顶部加"浮动点"（peak hold）

### 5. ChannelSelector.tsx - 精致化
**文件**: `src/renderer/components/channel/ChannelSelector.tsx`
- 频道按钮改为 `.glass` 风格，active 带底部发光条
- 图标增大到 18px，文字与图标竖排（icon 在上，文字在下）
- 设置按钮视觉分隔：前面加一个竖线分隔符

### 6. ChannelIndicator.tsx - 修复 + 美化
**文件**: `src/renderer/components/channel/ChannelIndicator.tsx`
- 修复 `Math.random()` 静态高度 bug → 改用 CSS animation 不同 delay
- 加入频道图标（从 store 获取 icon）
- ON AIR 文字加发光 badge 效果

### 7. StatusBar.tsx - 从调试变消费级
**文件**: `src/renderer/components/layout/StatusBar.tsx`
- 去掉"缓冲: N段 / 总计: N段"调试文本
- 改为：左侧显示连接状态图标，右侧显示当前音频质量/来源
- 整体更简洁，一行即可

### 8. TitleBar.tsx - 微调
**文件**: `src/renderer/components/layout/TitleBar.tsx`
- 关闭按钮 hover 改为圆角 `rounded-md`
- 背景改用 `.glass` 效果

### 9. SettingsPanel.tsx - 入场动画
**文件**: `src/renderer/components/settings/SettingsPanel.tsx`
- 面板加 `animate-slide-in-right` 入场
- 修复 TTS section 图标（Palette → Volume2）

### 10. MusicPlayer.tsx 歌曲列表美化
**文件**: `src/renderer/components/music/MusicPlayer.tsx`
- Now Playing 区域：封面图放大到 48px，加圆角阴影
- 歌曲行 hover 时左边出现竖条高亮
- 激活行的背景用渐变而非纯色

---

## 验证
- `npx electron-vite build` 无报错
- `npm run dev` 运行后检查：
  - 背景有明显光晕层次
  - 底部播控有卡片包裹 + 进度条
  - 频道切换有动感
  - 设置面板有滑入动画
