# SCNet 客户端 CDP 驱动（示例）

把一台 Windows 上的 **Electron 客户端**（本例：SCNet「计算服务.exe」v4.1.1）当成一个能对话、能回话的“同事”：
本机通过 SSH 隧道连到它的 Chromium 调试端口，用 CDP 往输入框打字、回车、读回复。全程用它**自己的模型额度**（SCNet-Max），不偷登录态、不碰 APIKey。

> 这不是通用库，是“经过实测的一条路”。照抄前先看 **前置条件** 和 **已知限制**，否则很容易在第一步就卡住。

## 实测环境
- **控制端**：Linux（dfy 主机，node ≥ 18，sshpass，systemd）——**这套逻辑跑在 Linux 上**
- **被控端**：Windows Server，SCNet 计算服务 v4.1.1（Electron 44.7.0 / Chrome 152）
- 2026-11-11 实测通过：单发单收、每条任务独立会话、完成判定、批量并发（3 条）、孤儿回收、FILES 回传、回执落板。
- 未实跑：retry/blocked 分支仍未遇到真实超时，代码就绪但不算验证过。

## 环境与平台差异（照抄前必读）

这套是 **Linux 控制端 + Windows 被控端** 的异构链路，90% 的坑不在逻辑，在两边方言不一样：

| 差异 | 控制端（Linux/dfy） | 被控端（Windows） | 怎么办 |
|---|---|---|---|
| 路径分隔符 | `/` | `\`（反斜杠） | 传进 scp 前统一转 `/`；node 里用 `p.replace(/\\/g,'/')` |
| 路径转义 | `"D:\dir"` | `D:\dir` / `"D:\dir"` | bash→ssh→cmd/powershell 三层，能用 `-EncodedCommand` 就别拼引号 |
| 编码 | UTF-8 | cmd 默认 GBK | ssh 输出 `\| iconv -f GBK -t UTF-8`；脚本文件用 UTF-8 但别直接喂 cmd |
| 换行 | `\n` | `\r\n` | 写 .cmd/.ps1 用 CRLF 或走 `-EncodedCommand`（UTF-16LE base64） |
| 引号 | 单引号安全 | cmd 不认单引号 | 路径里带空格/中文时，用 PowerShell `-LiteralPath`，别用 cmd `copy` |
| 环境变量 | `export` | `set` / `$env:` | WMI 起进程不继承当前 shell 的 env，要机器级或 cmd 包一层 |

### 三条硬规则（都踩过）

1. **反斜杠只在 Windows 侧用**：传给 scp/ssh 之前一律转成 `/`，否则 `sshpass scp "host:D:\a\b"` 会解析错。
2. **bash→ssh→PowerShell 三层引号必炸**：要跑复杂命令，走 `powershell -NoProfile -EncodedCommand <base64(UTF-16LE)>`，别拼 `\\\"`。
3. **GBK 不是 UTF-8**：`dir`/`tasklist` 输出里中文全是乱码时，管道接 `iconv -f GBK -t UTF-8`；反过来写 Windows 文件要注意编码。

## 给部署 agent 的硬要求（出错自己跑一遍，自己修）

你不是来“看完文档就交差”的，是来把这套跑通的。遵守：

1. **任何报错，先自己复现一遍**：把原命令原样跑一遍、拿到完整报错（别截断），再动手。
2. **不许猜**：路径、端口、进程名、编码，都先用命令验证（`netstat`/`tasklist`/`Test-Path`），别假设。
3. **修完必须自证**：改完立刻跑验收命令，贴出真实输出（时间戳、状态、文件大小），不许写“应该可以了”。
4. **失败要说卡在哪一跳**：是客户端没起、端口没听、隧道的、还是会话没建、回复没判定完成——写到能让人复现的程度。
5. **不许把未验证写成已验证**：没跑成功就写“未跑通 + 卡点 + 下一步”，这比假绿强一百倍。
6. **能在本机验的当场验**：`curl /json/version`、`node ask.mjs "回一个字：好"`、`netstat | findstr 9223`，跑一条贴一条。

## 前置条件（缺一不可）
1. Windows 上客户端能启动，且**带调试端口**：`"D:\...\计算服务.exe" --remote-debugging-port=9223 --remote-allow-origins=*`
2. 本机能 SSH 到那台 Windows（OpenSSH Server 已开，22 可达）。
3. 本机装了 `node`（≥18，用内置 fetch/WebSocket）和 `sshpass`（若非免密）。
4. 客户端已登录（它用自己的账号额度）。

## 步骤
```powershell
# 1) 目标机：用 launch.ps1 带调试口启动（会先清单实例锁，避免“双击没反应”）
#    powershell -ExecutionPolicy Bypass -File launch.ps1 -CreateShortcut
# 2) 本机起隧道
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
3. **单实例（最容易被骂的一条）**：已有实例在跑时，新启动会把参数转交旧实例、自己退出——所以**用户双击没反应/没窗口**，十有八九是后台已有一个 agent 拉起的实例占着单实例锁。解法：先 `taskkill /im 计算服务.exe`，再用**带调试参数的桌面快捷方式**启动（窗口可见 + 调试口可用，两全）。做一个快捷方式：Target=`...\计算服务.exe`，参数=`--remote-debugging-port=9223 --remote-allow-origins=*`。
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

## 常见问题（FAQ）

### 双击客户端没反应 / 没窗口
- **原因**：后台已有一个实例（比如 agent 在 session 0 拉起的）占着 Electron 单实例锁；双击 = 开第二个，它把参数转交旧实例后自己退出 → 看不到窗口。
- **解法**：`taskkill /f /im 计算服务.exe` 杀干净，再用 `launch.ps1` 或**带调试参数的桌面快捷方式**启动（窗口可见 + 调试口可用）。
- **一劳永逸**：`powershell -ExecutionPolicy Bypass -File launch.ps1 -CreateShortcut`，会在桌面放一个「SCNet (可被澪控制).lnk」。

### 端口没监听
- 客户端版本可能忽略 chromium 参数；先看任务管理器里有没有带 `--remote-debugging-port` 的进程，再看 `netstat -ano | findstr 9223`。换版本要复验。

### 发出去它不回
- 多半是公告弹窗挡住了输入：先点「不再提示」；或模型慢，加大 timeout。

