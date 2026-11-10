# Changelog

## 0.1.0 · 2026-11-10

首个对外版本。

### 功能
- 设置页统一登记多桌面 agent：agent_id / 显示名 / 接入方式 / 端点 / 岗位 / 备注。
- 省事接入：把对端回报的整段文字粘进任意输入框，自动识别填表（只填空字段，不覆盖）。
- 一次性配对码：服务端生成、只存 sha256、5 分钟过期、错码/重放都拒。
- 服务端代打探活（绕开浏览器 CORS），Bearer 从本机 `tokens.json`（600）带、值不回显。
- 诚实探活：`report()` 解析出 `open[]` 才判可达；`doing.started_at` 卡 >10 分钟判「假在线」。
- 共享信箱：本机/远程可配，六目录检测、缺的自建、建完二次验真。

### 文档
- 新增 docs/05：从接入到自动执行的部署实操（外部自建方法记录，明确非插件核心功能、不改变能力边界）。

### 安全
- 所有校验在 Host；客户端校验仅 UX。
- 信任字段（verified/fingerprint/pairing_id）服务端独占，客户端提交即拒。
- 端点 host 限 RFC1918 私有 IP，禁 loopback/link-local/公网/域名，fail-closed。
- POST 强制 JSON + 自定义头 `X-Agent-Access`；路由仅 loopback。

### 已知局限
- 配对码是人事确认，非双向身份凭据。
- 跨站浏览器实测未做。
- 探活是乐观下限，判据依赖对端如实填 `doing.started_at`。
- 远程信箱需 `sshpass` + 密码路径；SSH 首次连接不校验主机指纹。

## [examples] SCNet 客户端 CDP 驱动（2026-11-11）
- 新增 `examples/scnet-client-cdp/`：用 CDP 驱动 Windows 上的 Electron 客户端（SCNet 计算服务），实现“发一句、它回一句”，全程用客户端自己的模型额度。
- 关键：`--remote-debugging-port=9223` + SSH 隧道 + `.ProseMirror` 输入 / `.chat-message--response` 读回复。

## [examples] SCNet 客户端 CDP · 修复“双击没反应”（2026-11-11）
- 新增 `examples/scnet-client-cdp/launch.ps1`：启动前清理占单实例锁的旧实例，带 `--remote-debugging-port` 启动，可一键建桌面快捷方式，并自检端口。
- README 增加 FAQ：双击没反应/端口没监听/发出去不回 的成因与解法。
