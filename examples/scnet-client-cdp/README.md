# SCNet 客户端 CDP 驱动（示例）

把一台 Windows 上的 **Electron 客户端**（本例：SCNet「计算服务.exe」v4.1.1）当成一个能对话、能回话的“同事”：
本机通过 SSH 隧道连到它的 Chromium 调试端口，用 CDP 往输入框打字、回车、读回复。全程用它**自己的模型额度**（SCNet-Max），不偷登录态、不碰 APIKey。

## 为什么这样做
- 客户端是 Electron（Chromium 内核），天然带 CDP；带 `--remote-debugging-port` 启动就能像操控浏览器一样操控它。
- 不用管它是否在“会话里醒着”，窗口在跑（哪怕无头 session 0）CDP 就能驱动。
- 不依赖它内部的 dev RPC（正式包是关闭的）。

## 步骤
1. 在目标机（Windows）带调试端口启动客户端：
   ```
   "D:\AppData\scnet-client\计算服务.exe" --remote-debugging-port=9223 --remote-allow-origins=*
   ```
2. 本机起隧道（见 `tunnel.sh start`）：
   ```
   ssh -N -L 9223:127.0.0.1:9223 <user>@<windows-host>
   ```
3. 单发单收：
   ```
   node ask.mjs "回一个字：好" 120
   ```
4. 批量/自动：把提示词丢进 `inbox/xxx.txt`，`bridge.mjs` 自动发给客户端，回复落 `outbox/xxx.reply.md`，处理完移 `done/`。
   - 可加 `SCNET_BOARD_SCP='user@host:/board/产出/'` 把结果推到共享信箱。

## 关键 DOM（SCNet 客户端 4.1.1）
- 输入框：`div.ProseMirror[contenteditable=true]`（tiptap）
- 发送：`button[aria-label="发送消息"]`
- 回复：`.chat-message--response` 里的 `.chat-block-markdown`
- 首次启动有公告弹窗，先点「不再提示」再发。

## 实测（2026-11-11）
- `ask.mjs "回一个字：好"` → `好`（SCNet-Max）
- `ask.mjs "用一句话说明你现在能做什么"` → 返回它的能力清单，模型 SCNet-Max，13.2k toks。

## 注意
- CDP 端口默认只 bind 127.0.0.1，必须隧道。
- Electron 正式包可能忽略部分 chromium 参数；本例 4.1.1 实测认 `--remote-debugging-port`。
- 只在可信内网用；调试端口等于完全控制该客户端。
