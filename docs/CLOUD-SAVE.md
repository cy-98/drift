# Drift — 云存档预研

Web 原型以 **本机 localStorage** 为主；跨设备同步可通过以下方式（无需自建服务器）。

## 1. JSON 导出 / 导入（推荐）

Esc → 漫游档案 → **导出 JSON** 或 **复制到剪贴板**，存到网盘、邮件或任意同步文件夹。换设备后 **导入 JSON** 即可。

## 2. 分享链接（URL 片段）

Esc → **生成分享链接**：将当前存档编码进 URL `#save=…`，复制整段链接发给另一台设备的浏览器打开，会提示是否载入。

- 适合小体积存档（通常 &lt; 2KB）
- 链接过长时请改用 JSON 文件

## 3. 后续（Phase 4+）

| 方案 | 说明 |
|------|------|
| Supabase / Firebase | 账号登录 + 服务端 JSON 文档 |
| Steam Cloud | 桌面版 Steamworks 集成 |
| Capacitor 原生 | iCloud / Google Play 备份 API |

当前 
`src/core/progress.js` 与 `exportProgress()` 统一序列化进度、成就、分析与漫游日志。
