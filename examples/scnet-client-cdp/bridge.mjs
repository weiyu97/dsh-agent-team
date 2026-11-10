// SCNet 客户端桥 v3
//  - 队列 claim（带 claim_id/claimed_at）+ 孤儿回收
//  - 每条任务新建独立会话（批量发射 N 条 → 顺序收集）
//  - 完成判定：停止按钮消失 && 无思考标记 && 静默 8s && 非空
//  - 失败重试（≤2）→ blocked：落板消息 + 回执
//  - 产出：文本回 outbox+板；FILES: 行回传 ITX 文件到 outbox/files/
//  - 回执：outbox/<id>.ack.json + 板 回执/
import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync, spawn } from 'node:child_process';

const HOME = process.env.HOME || '/home/dfy';
const DIR = path.join(HOME, '.dsh/scnet-client-bridge');
const IN = path.join(DIR, 'inbox'), OUT = path.join(DIR, 'outbox'), DONE = path.join(DIR, 'done'), FILES = path.join(OUT, 'files');
const MCP = process.env.SCNET_MCP || 'http://192.168.198.237:18889/mcp';
const BOARD_SCP = process.env.SCNET_BOARD_SCP || '';
const PASS = process.env.SCNET_BOARD_PASS_FILE || path.join(HOME, '.dsh/ftp-agent-comm/.pass');
const ITX = process.env.SCNET_SSH || 'administrator@192.168.198.237';
const ITX_PASS = process.env.SCNET_SSH_PASS_FILE || path.join(HOME, '.dsh/creds/itx.pass');
const CDP = `http://127.0.0.1:${process.env.SCNET_CDP_PORT || 9223}`;
const TASK_TIMEOUT = Number(process.env.SCNET_TASK_TIMEOUT || 600) * 1000;
const MAX_ATTEMPTS = 3;
const CONCURRENCY = Number(process.env.SCNET_CONCURRENCY || 3);
const ORPHAN_MS = 10 * 60 * 1000;

[DONE, FILES].forEach(d => fs.mkdirSync(d, { recursive: true }));
const LEDGER = path.join(DIR, 'ledger.json');
let ledger = {};
try { ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch { ledger = {}; }
function saveLedger() { try { fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1)); } catch { } }
const ts = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

// ---------- MCP ----------
async function mcp(tool, args) {
  const r = await fetch(MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args } })
  });
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error));
  return JSON.parse(d.result.content[0].text);
}

// ---------- CDP ----------
async function cdp() {
  const list = await (await fetch(CDP + '/json/list')).json();
  const t = list.find(x => x.type === 'page');
  if (!t) throw new Error('NO_PAGE');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const call = (method, params) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.result?.value; };
  await new Promise(r => ws.onopen = r);
  return { ws, ev, call };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newSession(ev) {
  await ev(`(()=>{const b=document.querySelector('button[data-tour="new-task"]');if(b)b.click();})()`);
  await sleep(2500);
  for (let i = 0; i < 3; i++) {
    const n = await ev(`document.querySelectorAll('.chat-message--response').length`);
    if (n === 0) return true;
    await sleep(1500);
  }
  return false;
}
async function sendPrompt(ev, call, text) {
  await ev(`(()=>{const e=document.querySelector('.ProseMirror');if(!e)return 0;e.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(e);s.removeAllRanges();s.addRange(r);return 1})()`);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 8, key: 'Backspace', code: 'Backspace' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 8, key: 'Backspace', code: 'Backspace' });
  await call('Input.insertText', { text });
  const sent = await ev(`(()=>{const b=document.querySelector('button[aria-label="发送消息"]');if(b){b.click();return 'btn'}return 'enter'})()`);
  if (sent === 'enter') {
    await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
  }
}
async function openSessionByMarker(ev, marker) {
  return ev(`(()=>{const rows=[...document.querySelectorAll('[class*=session-row__main]')];const r=rows.find(x=>(x.innerText||'').includes(${JSON.stringify(marker)}));if(!r)return 'no-row';r.click();return 'clicked'})()`);
}
async function readState(ev) {
  return ev(`JSON.stringify((()=>{const txt=document.body.innerText;
    const stop=[...document.querySelectorAll('button')].some(b=>/停止生成/.test((b.innerText||'')+(b.getAttribute('aria-label')||'')));
    const thinking=/正在思考|生成中|正在处理/.test(txt);
    const rs=[...document.querySelectorAll('.chat-message--response')];
    const e=rs[rs.length-1];
    const text=e?((e.querySelector('.chat-block-markdown')||e).innerText):'';
    return {stop,thinking,n:rs.length,text};})())`).then(s => { try { return JSON.parse(s); } catch { return {}; } });
}
async function waitDone(ev, marker, timeoutMs) {
  const start = Date.now();
  let last = '', lastChange = Date.now();
  while (Date.now() - start < timeoutMs) {
    await openSessionByMarker(ev, marker);
    await sleep(1200);
    const st = await readState(ev);
    if (st.text) {
      if (st.text !== last) { last = st.text; lastChange = Date.now(); }
      if (!st.stop && !st.thinking && Date.now() - lastChange >= 8000 && last.trim()) {
        return { ok: true, text: last };
      }
    }
  }
  return { ok: false, text: last };
}

// ---------- 产出 / 回执 / 板 ----------
function parseFiles(text) {
  const m = text.match(/FILES:\s*([\s\S]+)$/i);
  if (!m) return [];
  return m[1].split(/[\n,;]+/).map(s => s.trim()).filter(s => /^[A-Za-z]:[\\/]/.test(s) || s.startsWith('/'));
}
function pushBoard(name, content) {
  if (!BOARD_SCP) return null;
  const tmp = path.join(OUT, name);
  fs.writeFileSync(tmp, content);
  spawn('sshpass', ['-f', PASS, 'scp', '-q', '-o', 'StrictHostKeyChecking=no', tmp, BOARD_SCP], { stdio: 'ignore' });
  return name;
}
function pushAck(id, ack) {
  fs.writeFileSync(path.join(OUT, `${id}.ack.json`), JSON.stringify(ack, null, 1));
  if (BOARD_SCP) {
    const tmp = path.join(OUT, `${id}.ack.json`);
    spawn('sshpass', ['-f', PASS, 'scp', '-q', '-o', 'StrictHostKeyChecking=no', tmp, BOARD_SCP.replace(/产出\/$/, '回执/') + `${id}.ack.json`], { stdio: 'ignore' });
  }
}
function fetchFiles(id, paths) {
  const dir = path.join(FILES, id); fs.mkdirSync(dir, { recursive: true });
  const got = [];
  for (const p of paths) {
    const name = path.basename(p.replace(/\\/g, '/'));
    const local = path.join(dir, name);
    const remote = p.replace(/\\/g, '/');
    try {
      execFileSync('sshpass', ['-f', ITX_PASS, 'scp', '-q', '-o', 'StrictHostKeyChecking=no', `${ITX}:${remote}`, local], { timeout: 60000 });
      if (fs.existsSync(local)) got.push(local);
    } catch (e) { console.error('scp fail', p, String(e).slice(0, 100)); }
  }
  return got;
}

// ---------- 队列 ----------
async function reclaimOrphans() {
  let rep; try { rep = await mcp('report', {}); } catch { return; }
  const now = Date.now();
  for (const t of (rep.open || [])) {
    if (t.status !== 'doing') continue;
    const l = ledger[t.id];
    const claimedAt = l && l.claimed_at ? Date.parse(l.claimed_at) : 0;
    const stale = !claimedAt || (now - claimedAt > ORPHAN_MS);
    if (stale && /claimed by bridge/.test(t.progress || '')) {
      try {
        await mcp('update', { id: t.id, status: 'queued', progress: 'orphan_reclaimed by bridge' });
        console.log('[orphan] reclaimed', t.id);
      } catch (e) { console.error('orphan err', t.id, e); }
    }
  }
}

async function fireTask(t, ev, call) {
  const id = t.id;
  const claimId = `br-${Math.random().toString(36).slice(2, 10)}`;
  const cur = (await mcp('get', { id })).task;
  if (!cur || cur.status !== 'queued') return null;
  await mcp('update', { id, status: 'doing', progress: `claimed by bridge:${claimId} at ${new Date().toISOString()}` });
  ledger[id] = { claim_id: claimId, claimed_at: new Date().toISOString(), attempts: (ledger[id]?.attempts || 0) + 1 };
  saveLedger();
  const full = (await mcp('get', { id })).task || t;
  const marker = `TASK${id.replace(/[^A-Za-z0-9]/g, '')}`;
  const prompt = `[${marker}] ${full.title}\n\n${full.body || ''}`;
  const okNew = await newSession(ev);
  if (!okNew) throw new Error('NEW_SESSION_FAILED');
  await sendPrompt(ev, call, prompt);
  await sleep(1500);
  const title = await ev(`(document.querySelector('.chat-toolbar__title')||{}).innerText||''`);
  console.log(`[fire] ${id} marker=${marker} title=${title}`);
  return { t, full, id, marker, title };
}

async function collectTask(f, ev, call) {
  if (!f) return;
  const { t, full, id, marker, title } = f;
  const res = await waitDone(ev, marker, TASK_TIMEOUT);
  const attempts = ledger[id].attempts;
  if (!res.ok) {
    const failedReason = 'timeout/未判定完成';
    if (attempts < MAX_ATTEMPTS) {
      await mcp('update', { id, status: 'queued', progress: `retry ${attempts}/${MAX_ATTEMPTS}: ${failedReason}` });
      console.log(`[retry] ${id} attempt=${attempts}`);
    } else {
      await mcp('update', { id, status: 'cancelled', progress: `blocked: ${failedReason}` });
      const msg = `# BLOCKED · ${id}\n\n任务：${full.title}\n原因：${failedReason}（已重试 ${attempts} 次）\n最近内容：${(res.text || '').slice(0, 400)}\n`;
      pushBoard(`SCNetClient_blocked_${id}_${ts()}.md`, msg);
      pushAck(id, { task_id: id, status: 'blocked', attempts, title, error: failedReason, finished_at: new Date().toISOString() });
      console.log(`[blocked] ${id}`);
    }
    return;
  }
  const files = parseFiles(res.text);
  const gotFiles = files.length ? fetchFiles(id, files) : [];
  const reply = `# SCNet-Max reply · ${id}\n\n> title: ${full.title}\n> marker: ${marker}\n> session: ${title}\n\n---\n\n${res.text}\n`;
  fs.writeFileSync(path.join(OUT, `${id}.reply.md`), reply);
  pushBoard(`SCNetClient_${id}_${ts()}.md`, reply);
  await mcp('update', { id, status: 'done', result: res.text.slice(0, 4000) });
  pushAck(id, { task_id: id, status: 'done', attempts, title, marker, claimed_at: ledger[id].claimed_at, finished_at: new Date().toISOString(), files: gotFiles, outbox: path.join(OUT, `${id}.reply.md`) });
  ledger[id].status = 'done'; saveLedger();
  console.log(`[done] ${id} files=${gotFiles.length}`);
}

// ---------- inbox（保留） ----------
const seen = new Set();
async function tickInbox(ev, call) {
  let files = []; try { files = fs.readdirSync(IN).filter(f => f.endsWith('.txt')); } catch { }
  for (const f of files) {
    const full = path.join(IN, f); if (seen.has(full)) continue; seen.add(full);
    let prompt = ''; try { prompt = fs.readFileSync(full, 'utf8').trim(); } catch { continue; }
    if (!prompt) { fs.renameSync(full, path.join(DONE, f)); continue; }
    const okNew = await newSession(ev);
    if (!okNew) { console.log('[inbox] new session failed'); continue; }
    await sendPrompt(ev, call, prompt);
    await sleep(1500);
    const marker = `INBOX${f.replace(/[^A-Za-z0-9]/g, '')}`;
    const res = await waitDone(ev, marker, TASK_TIMEOUT);
    const body = res.ok ? res.text : 'TIMEOUT';
    const reply = `# SCNet-Max reply · ${f}\n\n---\n\n${body}\n`;
    fs.writeFileSync(path.join(OUT, f.replace(/\.txt$/, '') + '.reply.md'), reply);
    pushBoard(`SCNetClient_reply_${f.replace(/\.txt$/, '')}_${ts()}.md`, reply);
    fs.renameSync(full, path.join(DONE, f));
  }
}

// ---------- 主循环 ----------
let running = false;
async function loop() {
  if (running) return; running = true;
  let ctx = null;
  try {
    ctx = await cdp();
    const { ev, call } = ctx;
    await tickInbox(ev, call);
    await reclaimOrphans();
    // 取一批 queued
    const rep = await mcp('report', {});
    const batch = (rep.open || []).filter(t =>
      t.status === 'queued' && !/SELFTEST/i.test(t.title || '') && !(t.title || '').includes('【DFY-BRAIN】')
    ).slice(0, CONCURRENCY);
    const fired = [];
    for (const t of batch) {
      try { fired.push(await fireTask(t, ev, call)); }
      catch (e) {
        console.error('fire err', t.id, String(e));
        try { await mcp('update', { id: t.id, status: 'queued', progress: 'fire err: ' + String(e).slice(0, 80) }); } catch { }
      }
    }
    for (const f of fired) {
      try { await collectTask(f, ev, call); }
      catch (e) { console.error('collect err', f && f.id, String(e)); }
    }
  } catch (e) {
    console.error('loop err', String(e));
  } finally {
    if (ctx) try { ctx.ws.close(); } catch { }
    running = false;
  }
}
console.log(`bridge v3  mcp=${MCP}  conc=${CONCURRENCY}  timeout=${TASK_TIMEOUT / 1000}s  board=${BOARD_SCP ? 'on' : 'off'}`);
setInterval(() => loop(), 5000);
loop();
