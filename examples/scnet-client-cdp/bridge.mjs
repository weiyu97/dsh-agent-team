// SCNet 客户端桥：inbox/*.txt -> 发给客户端 -> outbox/*.reply.md，并投共享信箱。
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
const DIR = path.resolve(process.env.HOME || '/home/dfy', '.dsh/scnet-client-bridge');
const IN = path.join(DIR,'inbox'), OUT = path.join(DIR,'outbox'), DONE = path.join(DIR,'done');
const ASK = path.join(DIR,'ask.mjs');
const BOARD = '/mnt/usb2_3-1/agent沟通'; // 仅当本机可达时用；这里用 scp 推
const itx = process.env.SCNET_BOARD || '';
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;}
function askP(prompt, timeout){return new Promise((res)=>{execFile('node',[ASK,prompt,String(timeout)],{timeout:(timeout+30)*1000},(e,so,se)=>res({ok:!e,out:(so||'').trim(),err:(se||'').trim()}))})}
const seen=new Set();
async function tick(){
  let files=[]; try{files=fs.readdirSync(IN).filter(f=>f.endsWith('.txt'))}catch{}
  for(const f of files){
    const full=path.join(IN,f); if(seen.has(full)) continue; seen.add(full);
    let prompt=''; try{prompt=fs.readFileSync(full,'utf8').trim()}catch{continue}
    if(!prompt) { fs.renameSync(full, path.join(DONE,f)); continue; }
    console.log(`[${new Date().toISOString()}] ask ${f}: ${prompt.slice(0,60)}`);
    const r=await askP(prompt, 180);
    const base=f.replace(/\.txt$/,'');
    const body = r.ok? r.out : `ERROR: ${r.err||'ask failed'}`;
    const reply=`# SCNet-Max reply · ${f}\n\n> prompt: ${prompt}\n\n---\n\n${body}\n`;
    fs.writeFileSync(path.join(OUT, base+'.reply.md'), reply);
    // 推共享信箱（若配置了 SCNET_BOARD_SCP=user@host:path）
    if(process.env.SCNET_BOARD_SCP){
      const {spawn}=await import('node:child_process');
      const fname=`SCNetClient_reply_${base}_${ts()}.md`;
      const tmp=path.join(OUT,fname); fs.writeFileSync(tmp,reply);
      spawn('sshpass',['-f',process.env.HOME+'/.dsh/ftp-agent-comm/.pass','scp','-q','-o','StrictHostKeyChecking=no',tmp,process.env.SCNET_BOARD_SCP+fname],{stdio:'ignore'});
    }
    fs.renameSync(full, path.join(DONE,f));
    console.log(`  -> ${r.ok?'OK':'FAIL'} ${base}`);
  }
}
console.log('scnet-client bridge watching', IN);
setInterval(()=>tick().catch(e=>console.error('tick err',e)), 5000);
tick().catch(e=>console.error(e));
