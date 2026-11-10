/**
 * @local/dsh-agent-team — Host 侧 HTTP 路由、校验与探活。
 *
 * 安全加固后的三条不变式：
 *  1. save() 裸写盘 → 强校 agent_id / transport / role / endpoint，端点限私有网段。
 *  2. 客户端校验拦不住任意本地 POST → 所有校验放在 Host；强制 JSON Content-Type + 自定义头 X-Agent-Access。
     不用 Origin 白名单：GUI 可从多个地址访问（127.0.0.1 / 局域网 IP / trusted-host 域名），硬编码会误伤合法同源请求。
     自定义头会触发跨站 preflight，而本路由不回 CORS 头 → 跨站发不出；同源请求不受影响。
 *  3. verified 由客户端写、配对码从未比对 → 信任字段服务端独占，配对码 issue/confirm 走服务端 hash 比对。
 *
 * 边界与能力约定：
 * - 只接受 loopback 请求（GUI 经 dsh 的 trusted-host 反代进来，到本路由的 peer 恒为回环）；
 *   不注册 timer/interval/cron，不自动派活、不自动回信。
 * - 只在 dsh 主机读写自己的状态文件；不重启宿主、不改动被管理的 agent 机器。
 * - registry.json / pairs.json / tokens.json 都是可重建的本地状态，删除即重置。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

const DIR = path.join(os.homedir(), '.dsh', 'agent-access');
const FILE = path.join(DIR, 'registry.json');
const PAIRS = path.join(DIR, 'pairs.json');
const PAIR_TTL_MS = 300000;
const MAILBOX = path.join(DIR, 'mailbox.json');
const TOKENS = path.join(DIR, 'tokens.json');
const ENV_FILE = path.join(DIR, 'mailbox.env');
// 共享信箱必需的六个目录：名字是固定白名单，绝不接受用户自定义目录名（防任意 mkdir）
const REQUIRED_DIRS = ['消息', '回执', '状态', '附件', '任务', '产出'];
const DEFAULT_MAILBOX = { kind: 'local', host: '', base: '' };
const HOST_RE = /^([A-Za-z0-9_-]{1,32})@(\d{1,3}(?:\.\d{1,3}){3})$/;
const BASE_RE = /^\/[\/A-Za-z0-9_\-\u4e00-\u9fa5]{1,180}$/;

const DEFAULT_ROLES = [
  { id: 'dispatcher', label: '协调', allowed_task_kinds: [], note: '不对外派，只拆解 / 派活 / 催办 / 收口' },
  { id: 'adjudicator', label: '判官', allowed_task_kinds: ['adjudicate', 'review'], note: '只出参谋意见、无否决权；禁 execute / signed_action' },
  { id: 'reviewer', label: '复核', allowed_task_kinds: ['review', 'adjudicate'], note: '对抗性复核、前提校验' },
  { id: 'executor', label: '执行', allowed_task_kinds: ['execute', 'signed_action'], note: '回执必须验签；对外发送类额外要人类确认' },
  { id: 'runner', label: '跑腿 · MCP', allowed_task_kinds: ['runner', 'probe'], note: 'dispatch 必须挂 verify 句柄（run 只入队）' },
];
const ROLE_IDS = new Set(DEFAULT_ROLES.map((r) => r.id));
const TRANSPORTS = new Set(['mcp-http', 'file-board', 'webhook', 'manual']);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;
const TRUSTED_FIELDS = ['verified', 'verified_at', 'fingerprint', 'pairing_id'];

export const name = 'agent-access';
export const inject = ['webServer'];

function load() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    const agents = Array.isArray(j.agents) ? j.agents : [];
    const roles = Array.isArray(j.roles) && j.roles.length ? j.roles : DEFAULT_ROLES;
    return { agents, roles };
  } catch {
    return { agents: [], roles: DEFAULT_ROLES };
  }
}
function loadPairs() {
  try { const j = JSON.parse(fs.readFileSync(PAIRS, 'utf8')); return Array.isArray(j) ? j : []; }
  catch { return []; }
}
function atomicWrite(file, obj) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = file + '.tmp-' + process.pid + '-' + Date.now();
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

// ---- 校验：全部在 Host，客户端校验只是 UX，不作数 ----
function isPrivateHost(host) {
  if (!host || /[^\w.:-]/.test(host)) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.startsWith('127.')) return false;
  if (host.startsWith('169.254.') || host.toLowerCase() === 'metadata.google.internal') return false;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) {
    // 允许局域网主机名？不放：无法判定解析结果，fail-closed。
    return false;
  }
  const o = m.slice(1).map(Number);
  if (o.some((x) => x < 0 || x > 255)) return false;
  if (o[0] === 10) return true;
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
  if (o[0] === 192 && o[1] === 168) return true;
  return false;
}
function loadTokens() {
  try { const j = JSON.parse(fs.readFileSync(TOKENS, 'utf8')); return (j && typeof j === 'object') ? j : {}; }
  catch { return {}; }
}
function saveTokens(t) {
  atomicWrite(TOKENS, t);
  try { fs.chmodSync(TOKENS, 0o600); } catch (e) {}
}
function hasToken(agentId) { return Object.prototype.hasOwnProperty.call(loadTokens(), agentId); }

function loadMailbox() {
  try { const j = JSON.parse(fs.readFileSync(MAILBOX, 'utf8')); return { kind: (j.kind === 'local' ? 'local' : 'remote'), host: String(j.host || DEFAULT_MAILBOX.host), base: String(j.base || DEFAULT_MAILBOX.base) }; }
  catch { return Object.assign({}, DEFAULT_MAILBOX); }
}
function mailboxDisplay(cfg) {
  return cfg.kind === 'local' ? ('本机 ' + cfg.base) : (cfg.host + ':' + cfg.base);
}
function validateMailbox(m) {
  if (!m || typeof m !== 'object') return '配置不是对象';
  const kind = m.kind === 'local' ? 'local' : 'remote';
  if (kind === 'remote') {
    const hm = String(m.host || '').match(HOST_RE);
    if (!hm) return '主机格式须为 user@内网IP（如 user@192.168.1.100）';
    if (!isPrivateHost(hm[2])) return '主机只允许内网私有 IP';
  }
  const base = String(m.base || '');
  if (!BASE_RE.test(base) || base.includes('..') || base.includes("'")) return '根路径非法（只允许绝对路径，含中文/字母数字/_-/，不含空格引号与 ..）';
  return null;
}
function sshPassFromEnv() {
  try {
    const txt = fs.readFileSync(ENV_FILE, 'utf8');
    const m = txt.match(/^LAN_SSH_PASS\s*=\s*(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  } catch { return null; }
}
async function sshRun(cfgOrHost, remoteCmd) {
  const cfg = typeof cfgOrHost === 'object' ? cfgOrHost : { kind: 'remote', host: cfgOrHost };
  if (cfg.kind === 'local') {
    const { stdout } = await execFileAsync('bash', ['-lc', remoteCmd], { timeout: 20000, maxBuffer: 1024 * 1024 });
    return String(stdout || '');
  }
  const pass = sshPassFromEnv();
  if (!pass) throw new Error('读不到 LAN_SSH_PASS（凭据文件缺失）');
  const { stdout } = await execFileAsync('sshpass', [
    '-e', 'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
    '-o', 'ConnectTimeout=8', '-o', 'LogLevel=ERROR', cfg.host, remoteCmd,
  ], { env: Object.assign({}, process.env, { SSHPASS: pass }), timeout: 20000, maxBuffer: 1024 * 1024 });
  return String(stdout || '');
}
// 服务端代打探活：绕开浏览器 CORS，Bearer 从 tokens.json（600）取，值不回显
async function probeAgentServer(agent) {
  if (!agent || agent.transport !== 'mcp-http' || !agent.endpoint) return { state: 'manual' };
  const ve = validateEndpoint(agent.transport, agent.endpoint);
  if (ve) return { state: 'manual', error: ve };
  const tokens = loadTokens();
  const token = tokens[agent.agent_id];
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  let r;
  try {
    r = await fetch(agent.endpoint, {
      method: 'POST',
      signal: ctl.signal,
      headers: Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'report', arguments: { limit: 20 } } }),
    });
  } catch (e) { clearTimeout(timer); return { state: 'down', error: String(e && e.message || e) }; }
  clearTimeout(timer);
  if (r.status === 401 || r.status === 403) return { state: 'auth', http: r.status };
  let b = null;
  try { b = await r.json(); } catch (e) { return { state: r.ok ? 'fake_online' : 'down', http: r.status }; }
  // 有的实现 200 但 body 是 {"error": "unauthorized"}
  if (b && b.error && /unauthor|forbidden|invalid token/i.test(String(b.error))) return { state: 'auth' };
  if (!r.ok) return { state: 'fake_online', http: r.status };
  let payload = null;
  try { payload = JSON.parse(b.result.content[0].text); } catch (e) { return { state: 'fake_online', http: r.status }; }
  if (!payload || !Array.isArray(payload.open)) return { state: 'fake_online', http: r.status };
  // 兼容新旧字段：open[] 项 status/started_at/queued_at；不同实现用 id/title 或 task_id/task
  const open = Array.isArray(payload.open) ? payload.open : [];
  const doing = open.filter((t) => t && t.status === 'doing');
  let age = null;
  if (doing.length) {
    const d = doing[doing.length - 1];
    const ts = d.started_at || d.queued_at || '';
    const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (m) age = (Date.now() - new Date(m[1], m[2]-1, m[3], m[4], m[5], m[6]).getTime()) / 60000;
  }
  if (age !== null && age > 10) return { state: 'fake_online' };
  return { state: 'online' };
}

// 远端命令只拼「经强校的 base」+「固定白名单目录名」，目录名不来自用户输入
function mkRemoteList(base) { return "ls -1 '" + base + "' 2>/dev/null || true"; }
function mkRemoteEnsure(base, missing) {
  return "mkdir -p -- " + ["'" + base + "'"].concat(missing.map((d) => "'" + base + '/' + d + "'")).join(' ');
}

function validateEndpoint(transport, endpoint) {
  if (!endpoint) return null; // 端点可空（人工接入）
  if (typeof endpoint !== 'string' || endpoint.length > 512) return '端点长度或类型不合法';
  if (transport === 'file-board') {
    // 文件板是路径，不参与 HTTP 探活；只挡控制字符与超长
    if (/[\x00-\x1f]/.test(endpoint)) return '板子路径含控制字符';
    return null;
  }
  let u;
  try { u = new URL(endpoint); } catch { return '端点不是合法 URL'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return '只允许 http/https';
  if (!isPrivateHost(u.hostname)) return '端点 host 只允许内网私有 IP（禁 loopback / link-local / 公网 / 域名）';
  const port = u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return '端口超出 1-65535';
  return null;
}
function validateAgent(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return 'agent 不是对象';
  if (typeof a.agent_id !== 'string' || !ID_RE.test(a.agent_id)) return 'agent_id 非法（只允许字母数字下划线连字符，首字符字母数字，≤32）';
  if (!TRANSPORTS.has(a.transport)) return 'transport 非法';
  if (a.role !== '' && !ROLE_IDS.has(a.role)) return 'role 非法';
  for (const k of TRUSTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(a, k)) return '信任字段 ' + k + ' 由服务端独占，客户端不得提交';
  }
  for (const k of ['display_name', 'note']) if (typeof a[k] === 'string' && a[k].length > 300) return k + ' 过长';
  if (a.capabilities !== undefined && (!Array.isArray(a.capabilities) || a.capabilities.length > 32)) return 'capabilities 非法';
  return validateEndpoint(a.transport, a.endpoint);
}

// 信任字段由服务端按现有记录重建；改了身份/端点一律撤销 verified（§4.1）
function normalizeIncoming(a, existing) {
  const out = {
    agent_id: a.agent_id, display_name: a.display_name || '', transport: a.transport,
    endpoint: a.endpoint || '', role: a.role || '', capabilities: Array.isArray(a.capabilities) ? a.capabilities : [],
    note: a.note || '',
  };
  const sameEntity = existing && existing.agent_id === out.agent_id && existing.transport === out.transport && existing.endpoint === out.endpoint;
  if (sameEntity && existing.verified) {
    out.verified = true; out.verified_at = existing.verified_at || '';
    out.fingerprint = existing.fingerprint || ''; out.pairing_id = existing.pairing_id || '';
  } else {
    out.verified = false; out.verified_at = ''; out.fingerprint = ''; out.pairing_id = '';
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > 1_000_000) { reject(new Error('body too large')); req.destroy(); return; } chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function base32(buf) { let bits = 0, value = 0, out = ''; for (let i = 0; i < buf.length; i++) { value = (value << 8) | buf[i]; bits += 8; while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]; return out; }
function displayCode(code) { return [code.slice(0, 5), code.slice(5, 10), code.slice(10, 15), code.slice(15, 20), code.slice(20)].join('-'); }

export function apply(ctx) {
  const webServer = ctx.get('webServer');
  if (!webServer) throw new Error('agent-access: 需要 webServer 服务');
  const off = webServer.register({
    kind: 'prefix',
    path: '/agent-access',
    handler: async (req, res) => {
      const ip = (req.socket && req.socket.remoteAddress) || '';
      const local = ip === '' || ip.includes('127.0.0.1') || ip.includes('::1');
      if (!local) { json(res, 403, { ok: false, error: 'loopback only' }); return; }
      // CSRF：强制 JSON（simple request 发不出 application/json）+ 自定义头（跨站会触发 preflight，本路由不回 CORS 头）
      // 不校验 Origin：GUI 可能从 127.0.0.1 / 局域网 IP / trusted-host 域名任一地址打开，都是合法同源。
      if (req.method === 'POST') {
        const ct = String((req.headers && req.headers['content-type']) || '');
        if (!ct.toLowerCase().includes('application/json')) { json(res, 415, { ok: false, error: 'application/json required' }); return; }
        if (String((req.headers && req.headers['x-agent-access']) || '') !== '1') { json(res, 403, { ok: false, error: 'x-agent-access required' }); return; }
      }
      const p = (req.url || '').replace(/\?.*$/, '');
      try {
        if (req.method === 'GET' && p === '/agent-access/registry') { json(res, 200, load()); return; }

        // ---- 探活（服务端代打）与凭据（600，不回显）----
        if (req.method === 'POST' && p === '/agent-access/probe') {
          const d = JSON.parse(await readBody(req) || '{}');
          const agent = (load().agents || []).find((x) => x.agent_id === String(d.agent_id || ''));
          if (!agent) { json(res, 404, { ok: false, error: 'agent 不存在' }); return; }
          json(res, 200, Object.assign({ ok: true }, await probeAgentServer(agent)));
          return;
        }
        if (req.method === 'GET' && p === '/agent-access/tokens') {
          const t = loadTokens();
          json(res, 200, { ok: true, has: Object.fromEntries(Object.keys(t).map((k) => [k, true])) });
          return;
        }
        if (req.method === 'POST' && p === '/agent-access/tokens') {
          const d = JSON.parse(await readBody(req) || '{}');
          const id = String(d.agent_id || '');
          if (!ID_RE.test(id)) { json(res, 400, { ok: false, error: 'agent_id 非法' }); return; }
          const agent = (load().agents || []).find((x) => x.agent_id === id);
          if (!agent) { json(res, 404, { ok: false, error: 'agent 不存在，先登记' }); return; }
          const t = loadTokens();
          const tok = String(d.token || '');
          if (!tok) { delete t[id]; saveTokens(t); json(res, 200, { ok: true, has: false }); return; }
          if (tok.length > 256 || /[\r\n]/.test(tok)) { json(res, 400, { ok: false, error: 'token 非法' }); return; }
          t[id] = tok; saveTokens(t);
          json(res, 200, { ok: true, has: true });
          return;
        }

        // ---- 共享信箱：地址可配 / 目录检测 / 缺了自建 ----
        if (req.method === 'GET' && p === '/agent-access/mailbox') {
          const cfg = loadMailbox();
          let dirs = REQUIRED_DIRS.map((name) => ({ name, exists: false }));
          let error = null;
          if (!cfg.base) {
            json(res, 200, { ok: true, config: cfg, full: '(未配置)', dirs, configured: false });
            return;
          }
          try {
            const out = await sshRun(cfg, mkRemoteList(cfg.base));
            const present = new Set(out.split('\n').map((x) => x.trim()).filter(Boolean));
            dirs = REQUIRED_DIRS.map((name) => ({ name, exists: present.has(name) }));
          } catch (e) { error = String(e && e.message || e); }
          json(res, 200, { ok: true, config: cfg, full: mailboxDisplay(cfg), dirs, error, probedAt: new Date().toISOString() });
          return;
        }
        if (req.method === 'POST' && p === '/agent-access/mailbox') {
          const d = JSON.parse(await readBody(req) || '{}');
          const err = validateMailbox(d);
          if (err) { json(res, 400, { ok: false, error: err }); return; }
          const cfg = { kind: (d.kind === 'local' ? 'local' : 'remote'),
                        host: String(d.host || '').trim(), base: String(d.base || '').trim() };
          atomicWrite(MAILBOX, cfg);
          json(res, 200, { ok: true, config: cfg, full: mailboxDisplay(cfg) });
          return;
        }
        if (req.method === 'POST' && p === '/agent-access/mailbox/ensure') {
          const cfg = loadMailbox();
          const err = validateMailbox(cfg);
          if (err) { json(res, 400, { ok: false, error: err }); return; }
          let present = new Set();
          try {
            const out = await sshRun(cfg, mkRemoteList(cfg.base));
            present = new Set(out.split('\n').map((x) => x.trim()).filter(Boolean));
          } catch (e) { json(res, 500, { ok: false, error: '检测失败：' + String(e && e.message || e) }); return; }
          const missing = REQUIRED_DIRS.filter((d) => !present.has(d));
          const created = [];
          if (missing.length) {
            try { await sshRun(cfg, mkRemoteEnsure(cfg.base, missing)); created.push(...missing); }
            catch (e) { json(res, 500, { ok: false, error: '创建失败：' + String(e && e.message || e), missing }); return; }
          }
          // 建完再验一次，不拿 mkdir 的返回值当成功
          let after = new Set();
          try { const out2 = await sshRun(cfg, mkRemoteList(cfg.base)); after = new Set(out2.split('\n').map((x) => x.trim()).filter(Boolean)); }
          catch (e) { /* 保持 after 为空，如实报未验证 */ }
          const dirs = REQUIRED_DIRS.map((name) => ({ name, exists: after.has(name) }));
          json(res, 200, { ok: true, created, dirs, verified: after.size > 0, full: mailboxDisplay(cfg) });
          return;
        }


        if (req.method === 'POST' && p === '/agent-access/registry') {
          const d = JSON.parse(await readBody(req) || '{}');
          if (!Array.isArray(d.agents)) { json(res, 400, { ok: false, error: 'agents 必须是数组' }); return; }
          if (d.agents.length > 64) { json(res, 400, { ok: false, error: 'agents 过多' }); return; }
          const current = load();
          const seen = new Set();
          const next = [];
          for (const raw of d.agents) {
            const err = validateAgent(raw);
            if (err) { json(res, 400, { ok: false, error: err }); return; }
            if (seen.has(raw.agent_id)) { json(res, 400, { ok: false, error: 'agent_id 重复' }); return; }
            seen.add(raw.agent_id);
            next.push(normalizeIncoming(raw, current.agents.find((x) => x.agent_id === raw.agent_id)));
          }
          atomicWrite(FILE, { agents: next, roles: current.roles });
          const t = loadTokens(); const ids = new Set(next.map((x) => x.agent_id)); let tChanged = false;
          for (const k of Object.keys(t)) { if (!ids.has(k)) { delete t[k]; tChanged = true; } }
          if (tChanged) saveTokens(t);
          json(res, 200, { ok: true, agents: next });
          return;
        }

        // 配对码：服务端生成 + hash 比对，客户端只拿展示串
        if (req.method === 'POST' && p === '/agent-access/pair/issue') {
          const d = JSON.parse(await readBody(req) || '{}');
          if (!ID_RE.test(String(d.agentId || ''))) { json(res, 400, { ok: false, error: 'agentId 非法' }); return; }
          const code = base32(crypto.randomBytes(16));
          const expiresAt = Date.now() + PAIR_TTL_MS;
          const pairs = loadPairs().filter((x) => x.agentId !== d.agentId && x.expiresAt > Date.now() && !x.used);
          pairs.push({ agentId: d.agentId, hash: sha256(code), expiresAt, used: false });
          atomicWrite(PAIRS, pairs);
          json(res, 200, { ok: true, display: displayCode(code), expiresAt });
          return;
        }
        if (req.method === 'POST' && p === '/agent-access/pair/confirm') {
          const d = JSON.parse(await readBody(req) || '{}');
          const code = String(d.code || '').replace(/-/g, '').toUpperCase();
          const pairs = loadPairs();
          const hit = pairs.find((x) => x.agentId === d.agentId && !x.used && x.expiresAt > Date.now() && x.hash === sha256(code));
          if (!hit) { json(res, 400, { ok: false, error: '配对码无效 / 已过期 / 已使用' }); return; }
          hit.used = true;
          const data = load();
          const a = data.agents.find((x) => x.agent_id === d.agentId);
          if (!a) { json(res, 404, { ok: false, error: 'agent 不存在' }); return; }
          a.verified = true; a.verified_at = new Date().toISOString();
          a.fingerprint = a.transport + '|' + a.endpoint; a.pairing_id = 'pair-' + sha256(code).slice(0, 8);
          atomicWrite(FILE, data); atomicWrite(PAIRS, pairs);
          json(res, 200, { ok: true, agent: a });
          return;
        }
        if (req.method === 'POST' && p === '/agent-access/pair/revoke') {
          const d = JSON.parse(await readBody(req) || '{}');
          const data = load();
          const a = data.agents.find((x) => x.agent_id === d.agentId);
          if (a) { a.verified = false; a.verified_at = ''; a.fingerprint = ''; a.pairing_id = ''; atomicWrite(FILE, data); }
          atomicWrite(PAIRS, loadPairs().map((x) => x.agentId === d.agentId ? Object.assign({}, x, { used: true }) : x));
          json(res, 200, { ok: true });
          return;
        }
        json(res, 404, { ok: false, error: 'not found' });
      } catch (e) {
        json(res, 500, { ok: false, error: String(e && e.message || e) });
      }
    },
  });
  ctx.effect(() => off, 'agent-access: registry + pairing route');
}
