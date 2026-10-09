<div align="center">

# 音河 MeloRiver

**因何而听，汇流成河。**

把世界装进音盒，让旋律汇成银河。

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.73.11-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-Apache--2.0-green)

[简介](#-简介) · [Spotify 交互重构](#-spotify-现代交互体验) · [核心功能](#-核心功能) · [技术架构](#-技术架构) · [快速开始与打包](#-快速开始与打包) · [工程文档](#-工程文档索引)

</div>

---

## 📖 简介

**音河（MeloRiver）** 是一款基于 **React Native** 与 **TypeScript** 打造的跨平台沉浸式音乐播放器。项目在保障底层强大音频调度、用户自定义音源（User API）与本地数据安全的同时，全面重构为接近 **Spotify** 的现代暗黑美学与手势交互流。

名字取自“音河”：

- **音盒**：收藏每一段声音与记忆
- **因何**：每一次聆听，都有理由
- **银河**：让海量音乐汇成你的宇宙
- **姻合**：因音乐而同频，让人与人相遇

> *因何而听，汇流成河。*  
> *把世界装进音盒，让旋律汇成银河。*

---

## 🎨 Spotify 现代交互体验

本项目已全面对齐 **Spotify** 核心 UI/UX 范式：

1. **纯正暗黑美学 (Pure Dark Aesthetic)**：
   - 全局锁定炭黑底色（`#121212`）、高对比度卡片灰（`#181818` / `#282828`）与 Spotify 品牌绿（`#1ed760`）。
2. **悬浮 Mini Player 胶囊 (Floating Pill)**：
   - 悬浮于底部导航栏上方，集成圆角专辑封面、双行跑马灯文本、实时绿心收藏（`Love`）、播放/暂停/切歌，底部贴合 2px 极简白色进度微线，点击整条平滑推入全屏播放页。
3. **经典 3-Tab 底部导航**：
   - **Home (首页)**：顶部根据时间动态呈现问候语（`Good morning / afternoon / evening`），搭配 **2x3 常用胶囊入口 (`RecentlyPlayed`)**、为你推荐水平轮播流（`FeaturedPlaylists`）与热门歌手圆形头像流（`PopularArtists`）。
   - **Search (探索搜索)**：常驻搜索栏与实时联想，集成 **21 色分类大磁贴网格 (`Browse All`)**，点击一键按曲风探索。
   - **Your Library (音乐库)**：结构化分类胶囊（`All`, `Playlists`, `Downloaded`），整合收藏歌单与下载专区。

---

## 🚀 核心功能

### 1. 音乐发现与聚合搜索
- **全源聚合搜索**：支持单曲、歌手、专辑与歌单的多源搜索与实时联想；
- **曲风探索**：流行 (Pop)、摇滚 (Rock)、说唱 (Hip-Hop)、电音 (EDM)、助眠 (Chill)、二次元 (ACG) 等 21 种分类大磁贴；
- **热门榜单与精选**：在线榜单与推荐歌单流式浏览。

### 2. 极致音频与播放控制
- **高性能音频内核**：基于定制版 `react-native-track-player` + Android ExoPlayer 原生底层；
- **后台保活与锁屏控制**：支持前台服务保活、系统通知栏控件、锁屏控制器与蓝牙/耳机焦点管理；
- **丰富播放模式**：列表循环、单曲循环、随机播放，支持临时插队与播放队列管理。

### 3. 开放音源与安全沙箱 (User API)
- **嵌入式 QuickJS 沙箱**：Android 原生集成 `QuickJS` C 级轻量引擎；
- **脚本隔离与权限控制**：用户自定义脚本仅在独立隔离上下文中执行，保障系统与隐私安全。

### 4. 歌单与本地管理
- **歌单管理**：支持自建歌单、批量添加/移动/删除歌曲、歌单重命名与排序；
- **数据备份与同步**：支持本地歌单导入导出、WebDAV 云端备份与局域网多端同步；
- **本地音乐与离线缓存**：支持本地音频文件扫描播放与离线缓存。

---

## 🛠️ 快速开始与打包

### 环境准备
- **Node.js**：`>= 18.0.0`
- **JDK**：`JDK 17`
- **Android SDK / NDK**：CompileSDK `36`, NDK `26.1.10909125`, Build-Tools `35.0.0`

### 常用指令

```bash
# 1. 安装项目依赖
npm install

# 2. 编译生成 Spotify 主题资源
npm run build:theme

# 3. 启动 Metro 本地开发服务
npm run start

# 4. 运行 Android 调试版
npm run dev

# 5. 打包 Release APK
npm run pack:android
```

---

## 📚 工程文档索引

项目维护了完备的工程与技术文档，供开发者与 AI 协作参考：

- 📦 **[operation.md](./operation.md)**：Android APK 完整打包指南、签名配置与编译排错；
- 🔬 **[agent.md](./agent.md)**：项目深度技术架构分析、原生模块与沙箱设计报告；
- 🎨 **[design.md](./design.md)**：Spotify 现代风格重构设计指南、开源借鉴方案与 Design Tokens 规范；
- 📝 **[log.md](./log.md)**：项目开发与变更日志（强制协作规范，跨会话上下文记录）。

---

## 📄 开源许可证

本项目基于 [Apache-2.0 License](./LICENSE) 协议开源发布。
