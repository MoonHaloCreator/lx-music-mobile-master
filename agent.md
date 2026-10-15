# LX Music Mobile (音河音乐移动版) - 技术架构分析报告

## 1. 项目概述与定位

`lx-music-mobile` 是一款基于 **React Native** 构建的高性能移动音乐播放器应用（主要面向 Android 平台，兼容 iOS）。项目以简洁、流畅、无广告为核心设计理念，具备高度可扩展的音频播放能力、自研状态流转体系、强大的桌面悬浮歌词，以及基于嵌入式 JavaScript 沙箱（QuickJS）的自定义音源（User API）脚本运行机制。

---

## 2. 核心技术栈与架构选型

| 技术层级 | 选型组件 / 方案 | 版本 / 特征 | 选型考量与作用 |
| :--- | :--- | :--- | :--- |
| **基础底座** | React Native | `0.73.11` | 成熟稳定的跨平台底座，兼具原生渲染能力与快速迭代能力 |
| **语言与类型** | TypeScript | `5.9.3` | 全量强类型约束，提升复杂音频控制逻辑与数据流的可维护性 |
| **JS 执行引擎** | Hermes Engine | 默认开启 | 字节码预编译，显著降低应用冷启动耗时与内存占用 |
| **原生导航** | React Native Navigation (Wix) | `7.39.2` | 原生级视图控制器切换，相较于纯 JS 导航性能更强、动画更顺滑 |
| **音频播放核心** | react-native-track-player | 深度定制版分支 | 底层接入 Android ExoPlayer，支持锁屏控制、通知栏、后台保活与音频焦点管理 |
| **脚本执行沙箱** | QuickJS Android Wrapper | `2.4.0` | 原生 C 级轻量 JS 引擎，用于安全、隔离地执行用户自定义音源脚本 |
| **数据持久化** | AsyncStorage (NextStorage) + RNFS | Room 数据库方案 | 结构化配置走 Room SQLite，歌曲缓存与歌词走本地文件系统 |
| **歌词系统** | lrc-file-parser + 原生悬浮窗 | 自研悬浮窗模块 | 毫秒级歌词同步，支持状态栏/桌面歌词悬浮与手势穿透 |

---

## 3. 系统架构与分层设计

本项目采用**分层解耦、事件驱动**的架构模型，整体分为四层：

```
+-----------------------------------------------------------------------+
|                         1. 表现层 (UI Screens & Components)            |
|   - 首页 (Home: 搜歌/歌单/排行榜/我的列表/设置)                           |
|   - 播放详情页 (PlayDetail: 封面/进度条/双语歌词/播放列表)                 |
|   - 歌单详情页 (SonglistDetail) / 歌曲评论 (Comment)                     |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                    2. 核心业务与控制层 (Core Services)                   |
|   - 播放核心 (Player Core: 播放队列/模式/切歌策略/重试调度)             |
|   - 歌曲管理 (Music/List: 收藏/歌单增删改查/歌单导入导出)                |
|   - 歌词调度 (Lyric Core: 本地与网络歌词获取/时间线对齐/双语合并)       |
|   - 用户源管理 (UserApi: 脚本加载/状态管理/网络请求桥接)                |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                  3. 状态管理与事件总线 (Store & Event Bus)              |
|   - 全局响应式状态 (src/store)                                         |
|   - 高性能事件总线 (src/event: 播放进度、状态变更、列表变更订阅)         |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                 4. 插件桥接与原生能力层 (Plugins & Native Bridges)        |
|   - Audio TrackPlayer (ExoPlayer + Notification + Lockscreen)         |
|   - QuickJS Sandbox (cn.toside.music.mobile.userApi)                  |
|   - Desktop Lyric Overlay (cn.toside.music.mobile.lyric)              |
|   - Native Crypto / Cache / Storage (SQLite & FileSystem)             |
+-----------------------------------------------------------------------+
```

---

## 4. 关键子系统深度剖析

### 4.1 音频播放与后台调度系统 (`src/core/player` & `src/plugins/player`)
- **播放状态机**：维护 `IDLE`、`LOADING`、`PLAYING`、`PAUSED`、`STOPPED` 等精准状态，处理缓冲、加载失败自动重试、音质降级等逻辑。
- **音频焦点与后台保活**：通过原生前台服务（Foreground Service）保持后台播放活性，响应耳机插拔、蓝牙按键与来电打断恢复。
- **播放队列管理**：支持列表循环、单曲循环、随机播放等模式，支持动态插队与临时播放队列。

### 4.2 自定义音源沙箱系统 (User API & QuickJS)
- **设计动机**：实现播放器本体与音乐搜索/播放链接解析的完全解耦。
- **原生沙箱环境**：Android 端通过集成 `QuickJS`（`cn.toside.music.mobile.userApi`），在独立的轻量 JavaScript 上下文中运行用户导入的音源脚本。
- **安全与通信机制**：
  - 宿主与沙箱通过 `message2call` 规范进行消息派发。
  - 沙箱内仅暴露安全的网络请求能力（`request`）与基础加密工具库，无法直接访问系统敏感 API 或文件系统，保障用户隐私安全。

### 4.3 桌面悬浮歌词系统 (`cn.toside.music.mobile.lyric`)
- **原生 Android Window 渲染**：利用 Android `WindowManager` 创建系统级悬浮窗（`TYPE_APPLICATION_OVERLAY`）。
- **性能优化**：歌词时间更新频率极高，通过原生通道直接推送当前播放进度，避免频繁触发 React Native JS 线程的重渲染，确保低功耗与不卡顿。
- **交互控制**：支持锁定/解锁状态、触摸穿透、透明度调节、字体大小与双行歌词切换。

### 4.4 数据同步与持久化 (`src/plugins/sync` & `src/plugins/storage`)
- **多端同步方案**：支持通过局域网 WebSocket 实时同步播放列表，或者基于 WebDAV 协议进行云端备份与恢复。
- **分级缓存机制**：
  - 核心配置与轻量状态：使用基于 Android Room SQLite 的 AsyncStorage。
  - 音频元数据、歌曲缓存与专辑封面：采用基于文件系统的分块流式写入与淘汰算法（LRU）。

### 4.5 主题系统与多语言 (`src/theme` & `src/lang`)
- **编译时 + 运行时结合**：通过 `src/theme/themes/createThemes.js` 预生成色彩规范与样式映射，应用启动时按主题 Token 动态注入颜色变量，支持深色模式与多种预设风格一键切换。
- **全量国际化**：多语言字典覆盖简中、繁中、英文等。

---

## 5. 源码目录结构导览

```
src/
├── app.ts                  # 应用入口与全局初始化调度
├── index.ts                # 原生组件注册入口
├── components/             # 通用 UI 组件（Button, Modal, List, Slider 等）
├── config/                 # 常量定义、全局配置、默认偏好
├── core/                   # 核心业务调度中心
│   ├── init/               # 启动初始化（日志/状态/数据加载）
│   ├── music/              # 音乐播放、链接解析、音质选择
│   ├── player/             # 播放状态机、播放队列管理
│   ├── search/             # 搜索聚合调度
│   ├── songlist.ts         # 歌单业务
│   └── userApi.ts          # 自定义源通信与管理
├── event/                  # 事件发射与订阅中心 (Event Bus)
├── lang/                   # 国际化语言包 (i18n)
├── navigation/             # Wix RNN 路由配置与页面注册
├── plugins/                # 插件层（Storage, Player, Lyric, Sync）
├── resources/              # 图标、图片与内置静态资源
├── screens/                # 页面级组件
│   ├── Home/               # 首页（搜索、排行榜、歌单、我的、设置）
│   ├── PlayDetail/         # 播放详情全屏页（歌词、进度、控制面板）
│   ├── SonglistDetail/     # 歌单详情页
│   └── Comment/            # 歌曲评论展示页
├── store/                  # 全局响应式状态
├── theme/                  # 主题色板、样式生成器与主题 Context
├── types/                  # TypeScript 全局接口与类型声明
└── utils/                  # 原生模块桥接、加解密工具、日志与文件操作工具
```

---

## 6. 二次开发与代码扩展规范

1. **状态流向单一性**：
   - UI 组件仅负责触发 Actions 或 Core 调度函数，禁止在组件内部直接修改核心播放器状态。
   - 监听全局状态变更请优先订阅 `src/event` 对应的事件，或消费 `src/store` 中的状态。

2. **异步操作与错误隔离**：
   - 涉及网络请求与自定义脚本调用的地方，必须做好异常捕获与 Fallback 处理（参考 `src/utils/errorHandle.ts`），防止单个音源错误导致整个播放进程崩溃。

3. **原生依赖添加规范**：
   - 本项目针对 Android 做了大量定制（Kotlin 1.9.24 / Gradle 8.6 / Room / QuickJS），新增原生模块时请务必检查 `package.json` 的 `overrides` 以及 `android/app/build.gradle` 的依赖兼容性。
