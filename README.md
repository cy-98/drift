# Drift

第一人称星际漫游：在程序化星野里漂着，远处有一条湖面光带。  
纯 Web（Three.js），本地 `node serve.mjs` 即可玩，无需 build。

**在线试玩：** https://cy-98.github.io/drift/  
**Spec / 概念设计：** https://cy-98.github.io/drift/spec/

## 运行

```bash
npm install
node serve.mjs
```

浏览器打开 **http://localhost:5180/**

Three.js 由仓库内 **`vendor/three/`** 本地提供（`serve.mjs` 映射为 `/vendor/three/`），**不依赖 esm.sh 等外网 CDN**，可避免代理报错 `ERR_PROXY_CONNECTION_FAILED`。可选：`npm install` 使用 `node_modules/three` 替代。

**长远规划 Spec：** http://localhost:5180/spec/（源码在 `.SPEC/`，Tailwind CDN + 公用 `.SPEC/css/specs.css`）

更新 Spec：`node scripts/generate-spec.mjs`

## 操作

1. 点击 **进入漫游**（或按 **Enter** / 点击画面）锁定鼠标，环顾四周  
2. `WASD` — 平移 · `QE` — 升降  
3. `Shift` — 加速（×5.5；按住 3 秒进入超驰，再 12 秒内爬升至 ×22.5）· `Ctrl` — 减速  
4. 不按键时也会缓慢向前漂游  
5. `Esc` — 设置（灵敏度、速度、减动效、柔光 Bloom、微光收集、环境音、旁白、湖面光带）  
6. `Tab` — 切换导航目标（屏幕边缘有方向指示点）  
7. 靠近金色 **微光** 自动收集（可在设置中关闭）  
8. `P` — 截图模式（**S** 保存 PNG）· 设置内可 **导出/导入/分享** 漫游档案

性能基线见 [docs/PERFORMANCE.md](docs/PERFORMANCE.md)。移动端打包见 [docs/MOBILE.md](docs/MOBILE.md)。云存档见 [docs/CLOUD-SAVE.md](docs/CLOUD-SAVE.md)。单元测试：`npm test`。

## 架构（平台 / 核心分离）

| 层 | 目录 | 职责 |
|----|------|------|
| 核心 | `src/core/` | 游戏循环、设置存储接口、导航逻辑（无 DOM） |
| 平台 | `src/platform/web/` | DOM HUD、输入、localStorage、启动 `bootstrap.js` |
| 系统 | `src/world.js` 等 | Three.js 世界、POI、后处理 |

Web 入口仍为 `src/game.js`（转发到 `platform/web/bootstrap.js`）。迁移桌面/移动时替换 `platform/` 即可。

## 技术

- Three.js（`vendor/three/`，经 import map → `/vendor/three/`）
- `src/core/drift-app.js` + `src/platform/web/*` + `world` / `pois` / `nav` 等
- 三层星粒子（回收 + 闪烁）+ 星云 + 湖面 shader
- 设置持久化（localStorage）
- 无外链美术资源

## 部署

推送到 `master` 后，GitHub Actions 会自动部署到 Pages（`.SPEC` 会复制为 `spec/` 目录发布）。

## 后续方向

- 远处行星 / 空间站 checkpoint  
- 环境音、陀螺仪（手机）  
- Unity 3D 移植（可选）  

## 许可

MIT — 个人学习与修改自用。
