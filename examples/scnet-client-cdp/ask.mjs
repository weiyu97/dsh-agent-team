// SCNet-Max ask：默认每次新建独立会话；--same 复用当前会话。
// 用法: node ask.mjs "<prompt>" [timeoutSec] [--new|--same]
const HOST = 'http://127.0.0.1:9223';
const list = await (await fetch(HOST + '/json/list')).json();
const t = list.find(x => x.type === 'page');
if (!t) { console.error('NO_PAGE'); process.exit(2); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const call = (method, params) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.result?.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
await new Promise(r => ws.onopen = r);

const prompt = process.argv[2];
const timeout = Number(process.argv[3] || 600) * 1000;
const mode = process.argv.includes('--same') ? 'same' : 'new';
if (!prompt) { console.error('usage: ask.mjs "<prompt>" [timeoutSec] [--new|--same]'); process.exit(2); }

// 1) 新建会话：直接点 data-tour=new-task，不要点任何菜单项（会误触“新建项目”）
if (mode === 'new') {
  const clicked = await ev(`(()=>{const b=document.querySelector('button[data-tour="new-task"]');if(!b)return 'none';b.click();return 'ok'})()`);
  if (clicked !== 'ok') { console.error('NO_NEW_TASK_BTN'); process.exit(4); }
  await sleep(2500);
  let n = await ev(`document.querySelectorAll('.chat-message--response').length`);
  if (n !== 0) { await sleep(2000); n = await ev(`document.querySelectorAll('.chat-message--response').length`); }
  if (n !== 0) { console.error('NEW_SESSION_NOT_READY n=' + n); process.exit(5); }
}
const before = await ev(`document.querySelectorAll('.chat-message--response').length`);

// 2) 输入并发送
await ev(`(()=>{const e=document.querySelector('.ProseMirror');if(!e)return 0;e.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(e);s.removeAllRanges();s.addRange(r);return 1})()`);
await call('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 8, key: 'Backspace', code: 'Backspace' });
await call('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 8, key: 'Backspace', code: 'Backspace' });
await call('Input.insertText', { text: prompt });
const sent = await ev(`(()=>{const b=document.querySelector('button[aria-label="发送消息"]');if(b){b.click();return 'btn'}return 'enter'})()`);
if (sent === 'enter') {
  await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
}

// 3) 完成判定：停止按钮消失 && 无思考标记 && 文本静默 8s && 非空
const started = Date.now();
let last = '', lastChange = Date.now();
while (Date.now() - started < timeout) {
  await sleep(1000);
  const st = await ev(`JSON.stringify((()=>{
    const txt=document.body.innerText;
    const stop=[...document.querySelectorAll('button')].some(b=>/停止生成/.test((b.innerText||'')+(b.getAttribute('aria-label')||'')));
    const thinking=/正在思考|生成中|正在处理/.test(txt);
    const rs=[...document.querySelectorAll('.chat-message--response')];
    const e=rs[rs.length-1];
    const text=e?((e.querySelector('.chat-block-markdown')||e).innerText):'';
    return {stop,thinking,n:rs.length,text};
  })())`);
  let s = {}; try { s = JSON.parse(st); } catch { }
  if ((s.n || 0) > before && s.text) {
    if (s.text !== last) { last = s.text; lastChange = Date.now(); }
    const quiet = Date.now() - lastChange;
    if (!s.stop && !s.thinking && quiet >= 8000) { console.log(last.trim()); ws.close(); process.exit(0); }
  }
}
console.error('TIMEOUT last=' + JSON.stringify((last || '').slice(0, 200)));
ws.close(); process.exit(3);
