# 星系定义文件

每个星系（或原型模板）可用 **YAML / JSON** 描述，供 `galaxies.js` 加载。

## 约定

| 路径 | 用途 |
|------|------|
| `_schema.example.yml` | 字段说明与示例 |
| `archetypes.json` | 运行时加载的四原型盘（与 `*.yml` 同步） |
| `{archetype}.yml` | 四原型默认盘（静湖 / 余烬 / 薄雾 / 空廊） |
| `g_{gx}_{gz}.yml` | 可选：覆盖单个坐标格子的定制星系 |

坐标 `(gx, gz)` 由星区 `(sx, sz)` 推导：`gx = floor(sx / 4)`，`gz = floor(sz / 4)`。  
一格星系 ≈ **4×4 星区**（2880×2880 世界单位）。

## 加载顺序（计划）

1. 查 `g_{gx}_{gz}.yml`（若存在）
2. 否则查 `{archetype}.yml`
3. 否则程序化 fallback（纯函数种子）

物理法则字段 `physics` 与扩展内容 `content` 在 Spec 中已预留，实现节奏见 `.SPEC/phase-2-galaxy.html`。
