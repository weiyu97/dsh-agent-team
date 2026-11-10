// SCNet 客户端 CDP 直连：发一句话，等它回完，打印回复。
// 用法: node ask.mjs "<prompt>" [timeoutSec]
const HOST='http://127.0.0.1:9223';
const list = await (await fetch(HOST+'/json/list')).json();
const t = list.find(x=>x.type==='page' && /计算服务/.test(x.title||'')) || list.find(x=>x.type==='page');
if(!t){ console.error('NO_PAGE'); process.exit(2); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id=0; const pend=new Map();
ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}};
const call=(method,params)=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
const ev=async(expr)=>{const r=await call('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.result?.value;};
await new Promise(r=>ws.onopen=r);
const prompt=process.argv[2]; const timeout=Number(process.argv[3]||120)*1000;
if(!prompt){ console.error('usage: ask.mjs "<prompt>" [timeoutSec]'); process.exit(2); }
// 关公告/弹窗
await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/不再提示/.test(x.innerText||'')); if(b)b.click(); return 1})()`);
// 基线应答数
const before = await ev(`document.querySelectorAll('.chat-message--response').length`);
// 清空并输入
await ev(`(()=>{const e=document.querySelector('.ProseMirror'); if(!e) return 0; e.focus(); const s=window.getSelection(); const r=document.createRange(); r.selectNodeContents(e); s.removeAllRanges(); s.addRange(r); return 1})()`);
await call('Input.dispatchKeyEvent',{type:'keyDown',windowsVirtualKeyCode:8,key:'Backspace',code:'Backspace'});
await call('Input.dispatchKeyEvent',{type:'keyUp',windowsVirtualKeyCode:8,key:'Backspace',code:'Backspace'});
await call('Input.insertText',{text:prompt});
// 点发送
const clicked = await ev(`(()=>{const b=document.querySelector('button[aria-label="发送消息"]'); if(b){b.click(); return 'btn'} const e=document.querySelector('.ProseMirror'); return 'enter'})()`);
if(clicked==='enter'){
  await call('Input.dispatchKeyEvent',{type:'rawKeyDown',windowsVirtualKeyCode:13,key:'Enter',code:'Enter'});
  await call('Input.dispatchKeyEvent',{type:'keyUp',windowsVirtualKeyCode:13,key:'Enter',code:'Enter'});
}
// 等回复：出现新的 response 且文本稳定
let last='', stable=0, started=Date.now();
while(Date.now()-started < timeout){
  await new Promise(r=>setTimeout(r,1000));
  const n = await ev(`document.querySelectorAll('.chat-message--response').length`);
  if(n>before){
    const txt = await ev(`(()=>{const a=[...document.querySelectorAll('.chat-message--response')]; const e=a[a.length-1]; if(!e) return ''; const m=e.querySelector('.chat-block-markdown')||e.querySelector('.chat-message__blocks')||e; return m.innerText;})()`);
    if(txt && txt===last) stable++;
    if(txt && txt!==last) { last=txt; stable=0; }
    if(stable>=2 && last.trim()){ console.log(last.trim()); ws.close(); process.exit(0); }
  }
}
console.error('TIMEOUT waiting reply; last=', JSON.stringify(last.slice(0,200)));
ws.close(); process.exit(3);
