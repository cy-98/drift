# Drift — 移动端打包（Capacitor）

Web 原型可直接用 [Capacitor](https://capacitorjs.com/) 包装为 Android / iOS 应用。仓库根目录即静态站点（`index.html`、`src/`、`vendor/`）。

## 前置条件

- Node.js 18+
- Android Studio（Android）或 Xcode（iOS，仅 macOS）
- 本机可运行 `node serve.mjs`，在浏览器确认游戏正常

## 初始化（一次性）

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios --save-dev
npx cap init Drift com.drift.roam --web-dir .
```

若已有 `capacitor.config.json`，可跳过 `cap init`，直接：

```bash
npx cap add android
npx cap add ios
```

## 同步与打开 IDE

每次改完 Web 资源后：

```bash
npx cap sync
npx cap open android   # 或 ios
```

在 Android Studio / Xcode 中构建并安装到设备。

## 注意事项

- **本地 Three.js**：`vendor/three/` 须随项目一并复制；Capacitor 会打包 `webDir` 下文件。
- **Service Worker**：离线 PWA 在原生 WebView 中行为因平台而异；以 `cap sync` 后真机测试为准。
- **触控**：Web 版虚拟摇杆（`touch.js`）已就绪，无需额外原生输入层。
- **存档**：进度保存在 WebView 本地存储；云同步见 Spec Phase 4「云存档」。

## 后续

- 应用图标 / 启动屏：`resources/` + `@capacitor/assets`
- 应用商店元数据、签名与发布流程见 Phase 4 Spec
