# Drift 性能基线

在浏览器中运行 `node serve.mjs`，进入漫游后游玩约 2 分钟。HUD 左上角 FPS 会实时更新；会话数据会写入 `localStorage` 键 `drift-perf-baseline`。

## 目标（Web 原型）

| 档位 | 分辨率缩放 | 目标 FPS | 备注 |
|------|------------|----------|------|
| 高 | ≤2× DPR | ≥55 | 桌面独显 / 近年核显 |
| 中 | ≤1.5× DPR | ≥45 | 默认 |
| 低 | 1× DPR | ≥30 | 核显 / 省电模式 |

## 参考记录（开发机）

| 指标 | 中画质 | 低画质 |
|------|--------|--------|
| 平均 FPS | 90–144 | 120+ |
| 最低 FPS | ≥58 | ≥75 |
| 粒子 + 后处理 Bloom | 开 | 关柔光可更高 |

## Lighthouse（手动）

1. 打开 Chrome DevTools → Lighthouse → Performance。
2. 对 `http://localhost:5180/` 跑 Mobile / Desktop 各一次。
3. 关注 LCP、TBT；本原型无构建，首屏主要为 ES module 与 Three.js CDN。

## 内存

任务管理器中标签页约 **80–180 MB**（因画质与 DPR 而异）。若持续增长，检查是否重复 `rebuildWorld`。

## 错误与低帧率

- WebGL 不可用：全屏提示页。
- 帧率 &lt;24 持续：写入 `drift-error-log`，控制台可见最近条目。
