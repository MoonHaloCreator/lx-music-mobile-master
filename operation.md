# LX Music Mobile (落雪音乐移动版) - Android APK 打包与构建指南

本文档详细介绍了如何从零准备环境并将本项目（`lx-music-mobile`）打包为 Android `.apk` 安装包。

---

## 目录
1. [环境要求与前置准备](#1-环境要求与前置准备)
2. [环境配置与依赖安装](#2-环境配置与依赖安装)
3. [签名密钥 (Keystore) 配置](#3-签名密钥-keystore-配置)
4. [项目打包指令与流程](#4-项目打包指令与流程)
5. [打包产物路径与架构说明](#5-打包产物路径与架构说明)
6. [常见构建问题与排查指南](#6-常见构建问题与排查指南)

---

## 1. 环境要求与前置准备

本项目基于 **React Native 0.73.11**，请确保本地开发环境满足以下版本要求：

| 工具 / 组件 | 推荐 / 要求版本 | 备注 |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS, Linux | 本指南以 Windows / PowerShell 为主 |
| **Node.js** | `>= 18.0.0` (推荐 18.x 或 20.x LTS) | 通过 `node -v` 验证 |
| **npm** | `>= 8.5.2` | 通过 `npm -v` 验证 |
| **JDK (Java)** | **JDK 17** (Temurin / Zulu / OpenJDK 17) | Gradle 8.6+ 适配版本 |
| **Android SDK** | Compile SDK: `36`, Target SDK: `29`, Min SDK: `21` | Android Studio 安装 |
| **Android Build-Tools** | `35.0.0` | 在 SDK Tools 中勾选安装 |
| **Android NDK** | `26.1.10909125` | 必须精确匹配 `android/build.gradle` 中的 ndkVersion |
| **Gradle** | `8.6.1` (由自带的 `gradlew` 自动拉取) | |

### 环境变量检查清单
确保系统环境变量已正确配置：
- `JAVA_HOME`：指向 JDK 17 安装目录（如 `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`）
- `ANDROID_HOME`：指向 Android SDK 目录（如 `C:\Users\<用户名>\AppData\Local\Android\Sdk`）
- `PATH` 中包含：
  - `%JAVA_HOME%\bin`
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\cmdline-tools\latest\bin`

---

## 2. 环境配置与依赖安装

### 步骤 1：安装项目 Node 依赖
在项目根目录运行：
```bash
npm install
```
> **注意**：项目 `package.json` 中配置了部分 GitHub 依赖和 override 规则，请确保网络通畅。

### 步骤 2：生成主题资源（如修改了主题）
```bash
npm run build:theme
```

---

## 3. 签名密钥 (Keystore) 配置

在编译正式版 Release APK 时，需要使用签名证书。本项目支持两种签名配置方式：

### 方式 A：使用 `keystore.properties`（推荐）

#### 1. 生成签名文件（若已有可跳过）
在命令行中执行以下命令（以 Windows cmd/powershell 为例）：
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*按提示输入密码（如 `123456`）、姓名、组织等信息。*

#### 2. 创建配置文件
在 `android/` 目录下创建 `keystore.properties` 文件（此文件已加入 `.gitignore`，不会被提交）：
```properties
storePassword=你的证书密码
keyPassword=你的证书别名密码
keyAlias=my-key-alias
storeFile=app/my-release-key.keystore
```

### 方式 B：使用 Debug 默认签名进行 Release 构建（仅用于本地快速测试）
如果仅在本地测试 Release 性能而无需自定义签名，项目已在 `android/app/build.gradle` 中配置了 fallback：如果未配置 release 签名，可将 `signingConfig signingConfigs.release` 临时指向 `signingConfigs.debug`。

---

## 4. 项目打包指令与流程

### 4.1 打包 Release APK（正式版）

直接使用 package.json 中预置的指令：

```bash
# 执行 Release 构建
npm run pack:android
```
或者手动进入 `android` 目录运行：
```bash
# Windows
cd android
.\gradlew.bat assembleRelease

# macOS / Linux
cd android
./gradlew assembleRelease
```

### 4.2 打包 Debug APK（调试版）

```bash
# 执行 Debug 构建
npm run pack:android:debug
```
或者：
```bash
cd android
.\gradlew.bat assembleDebug
```

### 4.3 仅构建指定 CPU 架构的 APK（加快构建速度）
在调试或测试时，如果只需特定架构（如 `arm64-v8a`），可以通过命令行参数覆盖：
```bash
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### 4.4 清理构建缓存
遇到编译报错或资源未更新时：
```bash
# 清理 Gradle 构建产物
npm run clear
# 或者
cd android && .\gradlew.bat clean
```

---

## 5. 打包产物路径与架构说明

构建完成后，生成的 APK 文件位于：
```
android/app/build/outputs/apk/release/
```

根据 `android/app/build.gradle` 的配置，本项目默认开启了 **ABI 分包 (splits)** 与 **Universal APK**，输出文件名规则如下：

| 文件名示例 | 适用设备 / 架构 | 说明 |
| :--- | :--- | :--- |
| `lx-music-mobile-v1.9.1-arm64-v8a.apk` | 绝大多数现代 64 位 Android 手机 | 体积小，性能最优（推荐大多数用户） |
| `lx-music-mobile-v1.9.1-armeabi-v7a.apk` | 老款 32 位 Android 手机 / 某些车机 | 兼容旧设备 |
| `lx-music-mobile-v1.9.1-x86_64.apk` | 64 位 x86 架构（PC 模拟器、部分平板） | 模拟器常用 |
| `lx-music-mobile-v1.9.1-x86.apk` | 32 位 x86 架构（旧版 PC 模拟器） | 较少使用 |
| `lx-music-mobile-v1.9.1-universal.apk` | **通用全架构包** | 包含所有 CPU 架构库，体积最大，兼容性最广 |

---

## 6. 常见构建问题与排查指南

### Q1: `NDK at ... did not have a source.properties file` 或 NDK 版本不匹配
- **原因**：项目指定了 NDK `26.1.10909125`。
- **解决**：打开 Android Studio -> SDK Manager -> SDK Tools -> 勾选 `Show Package Details` -> 找到 NDK (Side by side) -> 勾选 `26.1.10909125` 并安装。

### Q2: 报错 `Out of Memory` / Java Heap Space
- **原因**：Gradle 守护进程内存不足。
- **解决**：检查 `android/gradle.properties`，确保 `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=2048m`。

### Q3: Hermes 引擎或 JS Bundle 打包失败
- **解决**：
  1. 运行 `npm run sc`（清空 Metro 缓存并启动）；
  2. 单独测试 Bundle 生成命令：
     ```bash
     npm run bundle-android
     ```
  3. 检查是否有 TypeScript 语法错误或未引入的第三方模块。

### Q4: Wix Navigation (`react-native-navigation`) 编译报错
- **解决**：本项目在 `package.json` 的 `overrides` 中锁定了 `lodash` 和 `@typescript-eslint` 相关依赖，且在 `android/build.gradle` 中指定了 Kotlin 版本 `1.9.24`。若报错，请删除 `node_modules` 与 `android/.gradle`，重新执行 `npm install`。

### Q5: 国内网络环境下 Gradle 依赖下载超时
- **解决**：可在 `android/build.gradle` 的 `repositories` 中配置阿里云镜像源：
  ```groovy
  maven { url 'https://maven.aliyun.com/repository/google' }
  maven { url 'https://maven.aliyun.com/repository/public' }
  maven { url 'https://maven.aliyun.com/repository/central' }
  ```
