# SCNet 客户端 CDP 驱动（示例）

把一台 Windows 上的 **Electron 客户端**（本例：SCNet「计算服务.exe」v4.1.1）当成一个能对话、能回话的“同事”：
本机通过 SSH 隧道连到它的 Chromium 调试端口，用 CDP 往输入框打字、回车、读回复。全程用它**自己的模型额度**（SCNet-Max），不偷登录态、不碰 APIKey。

> 这不是通用库，是“经过实测的一条路”。照抄前先看 **前置条件** 和 **已知限制**，否则很容易在第一步就卡住。

## 实测环境
- 客户端：SCNet 计算服务 v4.1.1（Electron 44.7.0 / Chrome 152），Windows Server
- 本机：Linux（node ≥ 18，sshpass）
- 2026-11-11 实测：单发单收、批量收件、推共享信箱、systemd 常驻 全通。

## 前置条件（缺一不可）
1. Windows 上客户端能启动，且**带调试端口**：`"D:\...\计算服务.exe" --remote-debugging-port=9223 --remote-allow-origins=*`
2. 本机能 SSH 到那台 Windows（OpenSSH Server 已开，22 可达）。
3. 本机装了 `node`（≥18，用内置 fetch/WebSocket）和 `sshpass`（若非免密）。
4. 客户端已登录（它用自己的账号额度）。

## 步骤
```bash
# 1) 目标机带调试口启动客户端（PowerShell）
#    Start-Process -FilePath 'D:\AppData\scnet-client\计算服务.exe' -ArgumentList '--remote-debugging-port=9223','--remote-allow-origins=*'
# 2) 起隧道
./tunnel.sh start                       # = ssh -N -L 9223:127.0.0.1:9223 <user>@<win-host>
curl -s http://127.0.0.1:9223/json/version   # 应返回 Chrome/...  Calculator
# 3) 单发单收
node ask.mjs "回一个字：好" 120          # 期望输出：好
# 4) 批量/自动（常驻）
node bridge.mjs
#    或带推共享信箱：
SCNET_BOARD_SCP='user@board:/path/to/产出/' node bridge.mjs
```

## 验收（三条都对才算通）
| 检查 | 命令 | 期望 |
|---|---|---|
| 客户端调试口在听 | 目标机 `netstat -ano \| findstr 9223` | `127.0.0.1:9223 LISTENING` |
| 隧道通 | `curl -s http://127.0.0.1:9223/json/version` | JSON 里有 `"Browser":"Chrome/..."` |
| 能对话 | `node ask.mjs "回一个字：好" 120` | 输出 `好` |

## 目录
- `ask.mjs` — 单发单收
- `bridge.mjs` — 常驻收件箱：`inbox/xxx.txt` → 发 → `outbox/xxx.reply.md` → 移 `done/`；可推共享信箱
- `tunnel.sh` — 隧道起/停/查
- `run.sh` + `scnet-client-bridge.service.example` — systemd 常驻模板

## 关键 DOM（4.1.1，换版本要复验）
- 输入框：`div.ProseMirror[contenteditable=true]`（tiptap）
- 发送：`button[aria-label="发送消息"]`
- 回复：`.chat-message--response` 内 `.chat-block-markdown`
- 首次有公告弹窗：先点「不再提示」，否则输入会被挡。

## 已知限制 / 坑（务必看）
1. **调试端口只 bind 127.0.0.1**，必须隧道。等于完全控制该客户端，**别在不可信网络/公网暴露**。
2. **Electron 正式包可能忽略 chromium 参数**。本例 4.1.1 实测认 `--remote-debugging-port`；换版本先验 9223 是否 LISTENING，再看 `/json/version`。
3. **单实例**：已有实例在跑时，新启动会把参数转交旧实例，调试口可能没绑。先 `taskkill` 再带参启动。
4. 进程落在 **session 0 也能跑**，不必交互桌面；但客户端本身要能初始化（日志里出现 `runtime ready ... modelId=SCNet-Max` 最稳）。
5. 回复是**流式异步**：要等最后一条 `chat-message--response` 文本稳定再取；超时给足（本仓库默认 120–180s）。
6. **依赖客户端自己的登录态与额度**，别往里塞敏感内容；额度/账号由客户端自己管。
7. 推共享信箱靠 `SCNET_BOARD_SCP`，需本机能 scp 到板子（密码用 `sshpass -f`）。
8. 会话是**客户端里的**：桥只是打字+读屏，别指望它给你结构化 API。

## 排错
| 症状 | 原因 | 解法 |
|---|---|---|
| `curl :9223` 连不上 | 客户端没带调试口 / 被单实例转交 | 先杀进程，再用 `--remote-debugging-port` 启动 |
| `/json/list` 没有 page | 还在加载 / 没窗口 | 等 5–15s；确认客户端已 `runtime ready` |
| 发出去没反应 | 公告弹窗挡输入 | 先点「不再提示」 |
| 回复为空/超时 | 模型慢 / 会话在切换 | 加大 timeout；重试一次 |
| 板上没文件 | `SCNET_BOARD_SCP` 没配或 scp 失败 | 检查末尾 `/`、sshpass 密码文件 |

## 安全
调试端口=完全控制，务必内网、必要时加防火墙/隧道鉴权；不要把 token/密码写进任何文件或板子。
