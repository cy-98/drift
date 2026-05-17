# Drift

第一人称星际漫游：在程序化星野里漂着，远处有一条湖面光带。  
纯 Web（Three.js），本地 `node serve.mjs` 即可玩，无需 build。

**在线试玩：** https://cy-98.github.io/drift/  
**Spec / 概念设计：** https://cy-98.github.io/drift/spec/

## 运行

```bash
node serve.mjs
```

浏览器打开 **http://localhost:5180/**

**长远规划 Spec：** http://localhost:5180/spec/（源码在 `.SPEC/`，Tailwind CDN + 公用 `.SPEC/css/specs.css`）

更新 Spec：`node scripts/generate-spec.mjs`

## 操作

1. 点击 **进入漫游**（或按 **Enter** / 点击画面）锁定鼠标，环顾四周  
2. `WASD` — 平移 · `QE` — 升降  
3. `Shift` — 加速 · `Ctrl` — 减速  
4. 不按键时也会缓慢向前漂游  
5. `Esc` — 设置（灵敏度、速度、减动效、柔光、环境音）  
6. `Tab` — 切换导航目标（屏幕边缘有方向指示点）

## 技术

- Three.js（esm.sh CDN）
- `src/` 模块：`settings` · `world` · `input` · `pois` · `nav` · `audio` · `game`
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
