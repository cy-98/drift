# Drift

第一人称星际漫游：在程序化星野里漂着，远处有一条湖面光带。  
纯 Web（Three.js），本地 `node serve.mjs` 即可玩，无需 build。

## 运行

```bash
node serve.mjs
```

浏览器打开 **http://localhost:5180/**

**长远规划 Spec：** http://localhost:5180/spec/（源码在 `.SPEC/`，Tailwind CDN + 公用 `.SPEC/css/specs.css`）

更新 Spec：`node scripts/generate-spec.mjs`

## 操作

1. **点击画面**锁定鼠标，环顾四周  
2. `WASD` — 平移 · `QE` — 升降  
3. `Shift` — 加速 · `Ctrl` — 减速  
4. 不按键时也会缓慢向前漂游  

## 技术

- Three.js（esm.sh CDN）
- 三层星粒子 + 星云平面 + 湖面 shader
- 无外链美术资源

## 后续方向

- 远处行星 / 空间站 checkpoint  
- 环境音、陀螺仪（手机）  
- Unity 3D 移植（可选）  
- GitHub Pages 部署：`dist` 或静态托管本仓库根目录  

## 许可

MIT — 个人学习与修改自用。
