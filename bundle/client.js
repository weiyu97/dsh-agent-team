window.__ModuleLoader__.load({
  id: '@local/dsh-agent-team',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'agent-access';
    const API = '/agent-access/registry';

    const DICT = {
      zh: {
        nav: 'Agent 接入', title: '多桌面 agent 接入',
        intro: '登记谁接入、什么岗位、配对码确认。状态只报真实探活。',
        add: '添加', refresh: '刷新', retry: '重试',
        empty: '还没有 agent。', loading: '载入中…', loadFail: '载入失败',
        colName: '名称', colRole: '岗位', colState: '状态', colAct: '',
        edit: '编辑', pair: '配对', del: '删除', save: '保存', cancel: '取消',
        unverified: '未验证', verified: '已验证',
        rolesLabel: '岗位',
        fId: 'agent_id', fName: '显示名', fTransport: '接入方式', fEndpoint: '端点', fRole: '岗位', fNote: '备注', fToken: 'Bearer token（选填）',
        method: '接入方法',
        pairTitle: '配对码', pairHint: '生成后抄给对方；由你在设置页确认「已核对对方回报」后置为已验证。它证明的是你确认过，不是对端身份。',
        revoke: '撤销验证',
        confirm: '确认接入', gen: '生成配对码',
        saved: '已保存', saveFail: '保存失败', needId: 'agent_id 必填', dupId: 'agent_id 已存在',
        delConfirm: '删除该 agent？相关派活会立刻被拦。',
        sDown: '停摆', sFake: '假在线', sOnline: '可达', sStale: '待判', sManual: '需人工', sUnknown: '未探', sAuth: '需鉴权',
        pasteLabel: '粘一段对方的回复，自动识别并填入（省得你手抄）',
        pasteHint: '小提示：随便哪一栏，直接粘对方回的一大段，会自动识别把手填好。',
        pastePh: '把对方 agent 回给你的那一整段文字粘到这里，然后点下面识别…',
        pasteBtn: '识别并填入',
        pasteOk: '已识别填入', pasteNone: '没认出可用信息，请手动补',
        promptLabel: '把下面这段复制，发给对方那个 agent（含回报模板与配对码）',
        promptHint: '这段自带规范回报模板；先点「配对」生成码，提示词里就会带上，切走页面也不会丢。',
        copyPrompt: '复制提示词', copied: '已复制', selected: '已全选，按 Ctrl+C 复制',
        mbTitle: '共享信箱', mbIntro: '所有 agent 共用的板子地址。填好根路径先「保存地址」，再「重新检测」看目录；缺的点「一键补齐」。',
        mbKind: '在哪台机器', mbLocal: '本机', mbRemote: '外地（远程）', mbRemoteHint: '本机＝这台 dsh 主机自己；外地＝另一台机器，要选连接方式。',
        mbProto: '连接方式', mbProtoHint: '外地才用：当前只支持 ssh；smb / ftp 预留，点开备注有说明。',
        mbUser: '账号', mbUserHint: '外地才填：登录那台机器的用户名，如 root。',
        mbPass: '密码', mbPassHint: '外地才填：只保存在本机 .dsh/agent-access，不回显不回传。',
        mbHost: '主机（user@内网IP）', mbHostHint: '填共享目录所在主机的 SSH 登录地址；凭据见 docs/01 前置说明，界面不收集密码。',
        mbBase: '根路径', mbBaseHint: '板子的绝对路径，如 /srv/agent-board。只改这里，六个子目录名固定。',
        mbSave: '保存地址', mbCheck: '重新检测', mbEnsure: '一键补齐缺失文件夹',
        mbOk: '信箱地址已保存', mbChecked: '检测完成', mbCreated: '已补齐', mbAllOk: '六个文件夹齐全',
        mbMissing: '缺', mbHave: '有', mbUnknown: '未检测', mbProbeErr: '连不上板子', mbSaving: '处理中…',
        mbDirHint: '这六个是板子约定目录，固定不改：消息 / 回执 / 状态 / 附件 / 任务 / 产出。',
        hId: '给它起个唯一名字，字母数字下划线最稳，要和板子上的 状态/同名.json 对上',
        hName: '界面上显示的名字，随便起，中文也行',
        hTransport: '它怎么连：MCP=有 MCP server｜文件板=共享目录｜webhook=暂不用｜人工=你自己抄码',
        hEndpoint: '连接地址：MCP 填 http://IP:端口/mcp；文件板填共享目录；人工可留空',
        hRole: '它能干什么：空=不派活；判官只复核；只有「执行」才派活',
        hNote: '给自己看的备注，随便写',
        hToken: '对方 MCP 开了 Bearer 鉴权才填；只存本机、不回显。删除方式见 docs/02。',
        legend: '状态：可达=连得上｜假在线=连得上但卡住｜停摆=连不上｜未探=还没点刷新',
      },
      en: {
        nav: 'Agent access', title: 'Multi-agent access',
        intro: 'Register who connects, the role, and confirm by pairing code. Status is probe-only.',
        add: 'Add', refresh: 'Refresh', retry: 'Retry',
        empty: 'No agents yet.', loading: 'Loading…', loadFail: 'Load failed',
        colName: 'Name', colRole: 'Role', colState: 'Status', colAct: '',
        edit: 'Edit', pair: 'Pair', del: 'Delete', save: 'Save', cancel: 'Cancel',
        unverified: 'Unverified', verified: 'Verified',
        rolesLabel: 'Roles',
        fId: 'agent_id', fName: 'Display name', fTransport: 'Transport', fEndpoint: 'Endpoint', fRole: 'Role', fNote: 'Note', fToken: 'Bearer token (optional)',
        method: 'How to connect',
        pairTitle: 'Pairing code', pairHint: 'Generate, hand it to the peer, then you confirm here that you checked its reply. This records your confirmation, not the peer identity.',
        revoke: 'Revoke',
        confirm: 'Confirm', gen: 'Generate',
        saved: 'Saved', saveFail: 'Save failed', needId: 'agent_id required', dupId: 'agent_id exists',
        delConfirm: 'Delete this agent? Its dispatches are blocked immediately.',
        sDown: 'Down', sFake: 'Fake online', sOnline: 'Reachable', sStale: 'Stale', sManual: 'Manual', sUnknown: 'Unprobed',
        pasteLabel: 'Paste the peer\'s reply and auto-fill',
        pasteHint: 'Tip: paste a whole reply into ANY field and it auto-fills the rest.',
        pastePh: 'Paste the whole reply from the other agent here, then click parse…',
        pasteBtn: 'Parse & fill',
        pasteOk: 'Parsed', pasteNone: 'Nothing recognised, fill manually',
        promptLabel: 'Copy this to the other agent (includes reply template + pairing code)',
        promptHint: 'Reply template included; click Pair first so the code appears in the prompt, and it survives page switches.',
        copyPrompt: 'Copy prompt', copied: 'Copied', selected: 'Selected — press Ctrl+C',
        mbTitle: 'Shared mailbox', mbIntro: 'Common board address. Save the base path, then Re-check folders; use Create-missing for any absent ones.',
        mbKind: 'Location', mbLocal: 'This host', mbRemote: 'Remote', mbRemoteHint: 'Local = this dsh host itself; remote = another machine, pick a transport.',
        mbProto: 'Transport', mbProtoHint: 'Remote only: only ssh is live; smb / ftp are reserved.',
        mbUser: 'User', mbUserHint: 'Remote only: login user, e.g. root.',
        mbPass: 'Password', mbPassHint: 'Remote only: stored locally under the plugin data dir, never echoed back.',
        mbHost: 'Host (user@private IP)', mbHostHint: 'SSH host for the machine holding the board; credentials are described in docs/01, never collected in this UI.',
        mbBase: 'Base path', mbBaseHint: 'Absolute board path. Folder names are fixed.',
        mbSave: 'Save', mbCheck: 'Re-check', mbEnsure: 'Create missing folders',
        mbOk: 'Mailbox saved', mbChecked: 'Checked', mbCreated: 'Created', mbAllOk: 'All six folders present',
        mbMissing: 'missing', mbHave: 'ok', mbUnknown: 'unchecked', mbProbeErr: 'unreachable', mbSaving: 'working…',
        mbDirHint: 'Fixed board folders: 消息 / 回执 / 状态 / 附件 / 任务 / 产出.',
        hId: 'Unique id (letters/digits); must match board 状态/<id>.json',
        hName: 'Display name, anything you like',
        hTransport: 'How it connects: MCP=has a server｜file-board=shared dir｜webhook=reserved｜manual=you copy the code',
        hEndpoint: 'Address: MCP = http://ip:port/mcp; file-board = shared path; manual can be blank',
        hRole: 'What it may do: empty = no tasks; judge only reviews; only exec gets dispatched',
        hNote: 'Note to yourself, anything',
        hToken: 'Only fill if the peer MCP uses Bearer auth; stored locally, never echoed. See docs/02 to remove.',
        legend: 'Status: Reachable = up｜Fake online = up but stuck｜Down = unreachable｜Unprobed = not refreshed',
      },
    };

    const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    function base32(buf) { let bits = 0, value = 0, out = ''; for (let i = 0; i < buf.length; i++) { value = (value << 8) | buf[i]; bits += 8; while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]; return out; }
    function genPairCode() { let buf; if (typeof crypto !== 'undefined' && crypto.getRandomValues) { buf = new Uint8Array(16); crypto.getRandomValues(buf); } else { buf = new Uint8Array(16); for (let i = 0; i < 16; i++) buf[i] = Math.floor(Math.random() * 256); } const code = base32(buf); const display = [code.slice(0, 5), code.slice(5, 10), code.slice(10, 15), code.slice(15, 20), code.slice(20)].join('-'); return { code, display }; }
    const TRANSPORTS = ['mcp-http', 'file-board', 'webhook', 'manual'];
    const DEFAULT_ROLES = [
      { id: 'dispatcher', label: '协调', allowed_task_kinds: [] },
      { id: 'adjudicator', label: '判官', allowed_task_kinds: ['adjudicate', 'review'] },
      { id: 'reviewer', label: '复核', allowed_task_kinds: ['review', 'adjudicate'] },
      { id: 'executor', label: '执行', allowed_task_kinds: ['execute', 'signed_action'] },
      { id: 'runner', label: '跑腿 · MCP', allowed_task_kinds: ['runner', 'probe'] },
    ];
    function transportLabel(v) { return ({ 'mcp-http': 'MCP', 'file-board': '文件板', webhook: 'webhook', manual: '人工' })[v] || v; }
    function mbFullAddress(m) {
      if (!m) return '';
      const cfg = m.config || m;
      if (cfg.kind === 'local') return '本机 ' + cfg.base;
      return (cfg.host || '') + ':' + (cfg.base || '');
    }
    function accessMethodText(a) {
      const id = a.agent_id || '<agent_id>';
      if (a.transport === 'mcp-http') return '起一个 MCP streamable-http server，URL 填回端点：\n' + (a.endpoint || 'http://<ip>:<port>/mcp') + '\n\n注意：TCP 通 ≠ 醒着；run() 只入队，成功判据是 doing 推进。';
      if (a.transport === 'file-board') return '文件板：' + (a.endpoint || '/srv/agent-board/') + '\n消息只追加；心跳写 状态/' + id + '.json；配对码绝不写进板子。';
      if (a.transport === 'webhook') return 'HTTP webhook（当前零对端，仅契约预留）。';
      return '纯人工：本页生成配对码 → 抄给对方 → 对方确认后点确认接入。端点 CLOSED 只标需人工，不假装已唤醒。';
    }
    function clientPrivateHost(host) {
      const m = String(host).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!m) return false; // 域名/hostname 一律不认，Host 侧同样 fail-closed
      const o = m.slice(1).map(Number);
      if (o.some((x) => x < 0 || x > 255)) return false;
      if (o[0] === 127 || o[0] === 169 || o[0] === 0) return false;
      if (o[0] === 10) return true;
      if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
      if (o[0] === 192 && o[1] === 168) return true;
      return false;
    }
    function parseTagged(text) {
      const kv = {};
      for (const line of String(text || '').split(/\r?\n/)) {
        const m = line.match(/^\s*(AGENT_ID|DISPLAY_NAME|TRANSPORT|ENDPOINT|ROLE)\s*[:：]\s*(.+?)\s*$/i);
        if (m) kv[m[1].toUpperCase()] = m[2].trim();
      }
      if (!kv.AGENT_ID || !kv.ENDPOINT) return {};
      const out = {};
      const id = kv.AGENT_ID;
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(id)) return {};
      const ep = kv.ENDPOINT;
      const um = ep.match(/^(https?:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d{1,5}\/mcp)$/i);
      if (!um || !clientPrivateHost(um[1].split('//')[1].split(':')[0])) return {};
      const port = Number(um[1].match(/:(\d{1,5})\/mcp/)[1]);
      if (port < 1 || port > 65535) return {};
      const role = String(kv.ROLE || '').toLowerCase();
      if (['dispatcher', 'adjudicator', 'reviewer', 'executor', 'runner'].indexOf(role) >= 0) out.role = role;
      out.agent_id = id; out.display_name = (kv.DISPLAY_NAME || id).slice(0, 60);
      out.transport = 'mcp-http'; out.endpoint = um[1];
      return out;
    }
    function parseAny(text) { const a = parseTagged(text); return Object.keys(a).length ? a : parsePaste(text); }

    function parsePaste(text) {
      const t = text || '';
      const out = {};
      const roleIds = ['dispatcher', 'adjudicator', 'reviewer', 'executor', 'runner'];
      const zh2id = { '主脑': 'dispatcher', '判官': 'adjudicator', '复核': 'reviewer', '执行': 'executor', '跑腿': 'runner' };
      // 岗位：只认显式标签 + 精确相等，不再 includes 提权
      const rm = t.match(/(?:岗位|role)\s*[：:]\s*([A-Za-z_]+|[\u4e00-\u9fa5]{2,4})/i);
      if (rm) {
        const v = rm[1].toLowerCase();
        if (roleIds.indexOf(v) >= 0) out.role = v;
        else if (zh2id[rm[1]]) out.role = zh2id[rm[1]];
      }
      // 身份标记：必须出现至少一个显式 id/主机/serverInfo
      const hasId = /(?:agent_id|主机|机器|主机名|serverInfo)\s*[：:]?\s*\S/i.test(t);
      // 端点：只认带 /mcp 的完整 URL，八位组校 0-255、端口 1-65535、仅私有网段
      const um = t.match(/(https?:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d{1,5}\/mcp)/i);
      if (um && clientPrivateHost(um[1].split('//')[1].split(':')[0])) {
        const port = Number(um[1].match(/:(\d{1,5})\/mcp/)[1]);
        if (port >= 1 && port <= 65535) { out.transport = 'mcp-http'; out.endpoint = um[1]; }
      }
      // 裸 IP + 数字不再合成端点；只有「显式端口标签 + 显式 IP」也不合成，交给用户手填
      let idm = t.match(/agent_id\s*[：:]\s*([A-Za-z0-9_\-]+)/i);
      if (idm) out.agent_id = idm[1];
      if (!out.agent_id) { const sim = t.match(/serverInfo\s*([A-Za-z0-9_\-]+)\s*[0-9]/i); if (sim) out.agent_id = sim[1].split('-')[0].toLowerCase(); }
      const hm = t.match(/主机\s*[：:]\s*([^\s，,（(、]+)/);
      if (hm) out.display_name = hm[1];
      const mm = t.match(/机器\s+([A-Za-z0-9_-]{2,24})/);
      if (!out.agent_id && mm) out.agent_id = mm[1].toLowerCase();
      if (!out.display_name && mm) out.display_name = mm[1];
      if (!out.agent_id && hm) out.agent_id = hm[1].toLowerCase().replace(/[^a-z0-9_\-]/g, '_').slice(0, 24);
      if (!out.display_name && out.agent_id) out.display_name = out.agent_id;
      // 成组门槛：至少一个身份标记 + 一个显式 /mcp URL，否则整段丢弃
      if (!hasId || !out.endpoint) return {};
      return out;
    }
    const REPLY_TEMPLATE = [
      '【回报格式】请严格按下面模板回我，一行一个键，别加代码块、别改键名：',
      'AGENT_ID: <唯一 id，字母开头，字母数字下划线连字符，≤32>',
      'DISPLAY_NAME: <界面显示名，中文也行>',
      'ENDPOINT: <完整 MCP URL，形如 http://内网IP:端口/mcp>',
      'ROLE: <dispatcher / adjudicator / reviewer / executor / runner 五选一>',
      'PAIRING_CODE: <把我发给你的配对码原样抄这里>', '',
      '必填 AGENT_ID、ENDPOINT；DISPLAY_NAME / ROLE 可省。ENDPOINT 只收内网私有 IP、/mcp 结尾、端口 1-65535；',
      '别写域名、公网 IP、127.0.0.1、169.254.x。回整段给我，我这边粘进设置页就能自动填表。',
    ].join('\n');
    function buildFullPrompt(a, code) {
      const base = buildPrompt(a);
      const name = a.display_name || a.agent_id || '<agent_id>';
      return [
        base, '',
        '———— 以下两段请一并照做 ————', '',
        REPLY_TEMPLATE, '',
        '【本次配对码】' + (code || '<先在我这边点「配对」生成>'),
        '这一串只作人事确认，不是技术凭据；收到后原样填进上面的 PAIRING_CODE 回给我即可。',
        '【安全红线】Bearer token / 密码 / API key 一律不要写进回复，也不要贴消息板或聊天；只放你自己机器的文件，回一句「token 已落本机」就行。',
        '', '(接入说明 · dsh-agent-team)',
      ].join('\n');
    }

    function buildPrompt(a) {
      const id = a.agent_id || '<agent_id>';
      const name = a.display_name || id;
      if (a.transport === 'mcp-http') {
        return [
          '你是桌面 agent「' + name + '」。请把自己挂成一个 MCP streamable-http 服务，让 dsh 主机上的接入插件能连上你。', '',
          '1. 监听一个局域网端口，提供 MCP streamable-http 端点，完整地址形如：http://<你的局域网IP>:<端口>/mcp',
          '2. 至少实现两个 tool：',
          '   - report：返回你当前任务队列的 open 列表，字段 id/title/status/queued_at/started_at，用来探活；',
          '   - dispatch：接收 {title, body} 入队（只入队，不自动执行）。',
          '3. 做完后回给我两样：你的完整 MCP URL，以及你愿意领的岗位（dispatcher / adjudicator / reviewer / executor / runner）。',
          '4. 注意：TCP / initialize 通只代表你在线，不代表你在干活；请让 report 里 doing.started_at 真实推进。', '',
          '我这边会在 dsh 的「设置 → Agent 接入」里登记你，并生成一个一次性配对码发给你，你收到后回给我确认就行。', '',
          '回报时请尽量用下面这个模板，我这边设置页能整段粘贴自动识别（每行一个键，别的说明随意附在后面）：',
          'AGENT_ID: <你的唯一 id，字母数字下划线>',
          'DISPLAY_NAME: <界面显示名>',
          'ENDPOINT: <完整 MCP URL，形如 http://内网IP:端口/mcp>',
          'ROLE: <dispatcher / adjudicator / reviewer / executor / runner 之一>', '',
          '重要：Bearer token / 密码 / 密钥绝对不要写进这段回复，也不要贴到消息板或聊天里；凭据只放你自己机器的文件，回一句「token 已落本机」即可。',
        ].join('\n');
      }
      if (a.transport === 'file-board') {
        return [
          '你是桌面 agent「' + name + '」。我们通过文件板沟通，板子根目录：' + (a.endpoint || '/srv/agent-board/'), '',
          '1. 每 60 秒写一次心跳到 状态/' + id + '.json（字段：time / role / status）。',
          '2. 收消息读 消息/ 目录，回执写 回执/ 目录，只追加不删别人的。',
          '3. 回给我你愿意领的岗位（dispatcher / adjudicator / reviewer / executor / runner）。',
          '4. 配对码不要写进板子，单独口述或私发给我。', '',
          '我这边在 dsh「设置 → Agent 接入」里登记你，再给你一个一次性配对码，你回给我确认即可。',
        ].join('\n');
      }
      if (a.transport === 'webhook') {
        return ['你是桌面 agent「' + name + '」。请提供一个 HTTP 端点接收 POST /agent-team/pair 与任务派发；回给我完整 URL。', '', '说明：webhook 对端当前未启用，这只是预留契约。'].join('\n');
      }
      return [
        '你是桌面 agent「' + name + '」。我没有你的服务地址，请回给我三样：', '',
        '1. 你运行在哪台机器、局域网 IP 和端口；',
        '2. 你能不能起一个 MCP streamable-http server——能的话给我完整 URL，形如 http://<IP>:<端口>/mcp；',
        '3. 你愿意领哪个岗位（dispatcher / adjudicator / reviewer / executor / runner）。', '',
        '我拿到后在 dsh「设置 → Agent 接入」里登记你，再给你一个一次性配对码，你回给我确认就行。',
      ].join('\n');
    }
    function ageMin(ts) { if (!ts) return null; const t = Date.parse(ts); if (Number.isNaN(t)) return null; return Math.floor((Date.now() - t) / 60000); }
    async function probeAgent(a) {
      if (a.transport !== 'mcp-http' || !a.endpoint) return 'manual';
      try { const u = new URL(a.endpoint); if (!/^https?:$/.test(u.protocol) || !clientPrivateHost(u.hostname)) return 'manual'; } catch (e) { return 'manual'; }
      // 服务端代打：绕开 CORS，Bearer 由 Host 从 tokens.json（600）带
      try {
        const r = await fetch('/agent-access/probe', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agent_id: a.agent_id }) });
        const j = await r.json();
        return (j && j.state) || 'down';
      } catch (e) { return 'down'; }
    }

    const S = {
      wrap: { padding: '2px 0', color: 'var(--dsw-alias-text-1, inherit)', fontSize: 12 },
      head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 2px' },
      h1: { fontSize: 16, fontWeight: 600, margin: 0 },
      sectionTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 6px' },
      sub: { fontSize: 11, color: 'var(--dsw-alias-text-2, #888)', margin: '0 0 14px' },
      row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--dsw-alias-border-1, #2a2a2a)' },
      name: { fontWeight: 500, marginRight: 6 },
      tag: { fontSize: 10, padding: '0 6px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-1, #444)', color: 'var(--dsw-alias-text-2, #999)' },
      grow: { flex: 1 },
      btn: { cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--dsw-alias-text-2, #aab)', fontSize: 11, padding: '2px 6px', borderRadius: 5 },
      btnP: { cursor: 'pointer', border: '1px solid var(--dsw-alias-accent-1, #4c8dff)', background: 'var(--dsw-alias-accent-1, #2b5fd9)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 6 },
      btnB: { cursor: 'pointer', border: '1px solid var(--dsw-alias-border-1, #3a3a3a)', background: 'transparent', color: 'inherit', fontSize: 12, padding: '3px 10px', borderRadius: 6 },
      chip: { display: 'inline-block', fontSize: 11, padding: '1px 7px', marginRight: 6, borderRadius: 9, border: '1px solid var(--dsw-alias-border-1, #3a3a3a)', color: 'var(--dsw-alias-text-2, #bbb)' },
      form: { border: '1px solid var(--dsw-alias-border-1, #2f2f2f)', borderRadius: 8, padding: 10, margin: '10px 0' },
      fl: { display: 'flex', gap: 8, margin: '0 0 6px' },
      flc: { flex: 1, display: 'flex', flexDirection: 'column' },
      lb: { fontSize: 10, color: 'var(--dsw-alias-text-2, #888)', marginBottom: 2 },
      inp: { padding: '4px 7px', fontSize: 12, borderRadius: 5, border: '1px solid var(--dsw-alias-border-1, #3a3a3a)', background: 'var(--dsw-alias-bg-1, transparent)', color: 'inherit', width: '100%', boxSizing: 'border-box' },
      pre: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, lineHeight: 1.5, padding: 8, borderRadius: 6, background: 'var(--dsw-alias-bg-2, rgba(255,255,255,0.03))', border: '1px solid var(--dsw-alias-border-1, #2f2f2f)', margin: '6px 0 0' },
      code: { fontFamily: 'ui-monospace, monospace', letterSpacing: 1, fontSize: 15, fontWeight: 600 },
      ok: { color: 'var(--dsw-alias-success-1, #4caf7a)', fontSize: 11, margin: '4px 0' },
      err: { color: 'var(--dsw-alias-danger-1, #d55)', fontSize: 11, margin: '4px 0' },
      muted: { color: 'var(--dsw-alias-text-2, #888)', fontSize: 11 },
      tip: { display: 'block', fontSize: 10, lineHeight: 1.4, color: 'var(--dsw-alias-text-2, #888)', margin: '2px 0 0' },
      ta: { width: '100%', boxSizing: 'border-box', minHeight: 140, resize: 'vertical', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 11, lineHeight: 1.5, padding: 8, borderRadius: 6, background: 'var(--dsw-alias-bg-2, rgba(255,255,255,0.03))', border: '1px solid var(--dsw-alias-border-1, #2f2f2f)', color: 'inherit', margin: '6px 0 0' },
    };
    const stateColor = (s) => ({ down: 'var(--dsw-alias-danger-1, #d55)', fake_online: 'var(--dsw-alias-warning-1, #e0a030)', online: 'var(--dsw-alias-success-1, #4caf7a)', manual: 'var(--dsw-alias-text-2, #999)' })[s] || 'var(--dsw-alias-text-2,#888)';

    function makePage() {
      return function Page(props) {
        const t = props.t;
        const [agents, setAgents] = React.useState(null);
        const [roles, setRoles] = React.useState(DEFAULT_ROLES);
        const [editing, setEditing] = React.useState(null);
        const [pairing, setPairing] = React.useState(() => {
          try { const j = JSON.parse(sessionStorage.getItem('agent-access-pairing') || 'null'); return j && j.expiresAt > Date.now() ? j : null; }
          catch (e) { return null; }
        });
        function putPairing(p) { setPairing(p); try { if (p) sessionStorage.setItem('agent-access-pairing', JSON.stringify(p)); else sessionStorage.removeItem('agent-access-pairing'); } catch (e) {} }
        const [statuses, setStatuses] = React.useState({});
        const [busy, setBusy] = React.useState(false);
        const [msg, setMsg] = React.useState(null);
        const [mb, setMb] = React.useState(null);           // {config:{kind,host,base}, dirs, error, full}
        const [mbPass, setMbPass] = React.useState('');
        const [tokenDraft, setTokenDraft] = React.useState('');
        const [hasTokens, setHasTokens] = React.useState({});
        const [mbBusy, setMbBusy] = React.useState(false);

        function load(tries) {
          fetch(API, { credentials: 'include', cache: 'no-store' })
            .then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
            .then((d) => { setAgents(Array.isArray(d.agents) ? d.agents : []); if (Array.isArray(d.roles) && d.roles.length) setRoles(d.roles); setMsg(null); })
            .catch(() => { if ((tries || 0) < 3) { setTimeout(() => load((tries || 0) + 1), 350); } else { setAgents([]); setMsg({ kind: 'err', text: t('loadFail') }); } });
        }
        React.useEffect(() => { load(0); }, []);
        const list = Array.isArray(agents) ? agents : [];

        // 只提交非信任字段；verified/指纹一律由服务端独占，提交前剥干净
        function publicOnly(a) {
          return { agent_id: a.agent_id, display_name: a.display_name || '', transport: a.transport,
            endpoint: a.endpoint || '', role: a.role || '', capabilities: Array.isArray(a.capabilities) ? a.capabilities : [], note: a.note || '' };
        }
        async function reload() {
          const r = await fetch(API, { credentials: 'include', cache: 'no-store' });
          const d = await r.json();
          setAgents(Array.isArray(d.agents) ? d.agents : []);
          if (Array.isArray(d.roles) && d.roles.length) setRoles(d.roles);
        }
        async function persist(next) {
          try {
            const r = await fetch(API, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agents: next.map(publicOnly) }) });
            const j = await r.json();
            if (j && j.ok) { await reload(); setMsg({ kind: 'ok', text: t('saved') }); return true; }
            setMsg({ kind: 'err', text: t('saveFail') + (j && j.error ? '：' + j.error : '') }); return false;
          } catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); return false; }
        }
        function blank() { return { agent_id: '', display_name: '', transport: 'manual', endpoint: '', role: '', capabilities: [], note: '' }; }
        function add() { setMsg(null); setEditing(blank()); }
        function edit(a) { setMsg(null); setTokenDraft(''); setEditing(Object.assign({}, a, { __orig: a.agent_id })); }
        async function save() {
          const a = editing; if (!a || !String(a.agent_id || '').trim()) { setMsg({ kind: 'err', text: t('needId') }); return; }
          const clean = Object.assign({}, a); const orig = clean.__orig; delete clean.__orig;
          let next;
          if (orig && list.some((x) => x.agent_id === orig)) next = list.map((x) => x.agent_id === orig ? clean : x);
          else { if (list.some((x) => x.agent_id === clean.agent_id)) { setMsg({ kind: 'err', text: t('dupId') }); return; } next = list.concat([clean]); }
          if (await persist(next)) {
            if (tokenDraft.trim()) {
              try { await fetch('/agent-access/tokens', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agent_id: clean.agent_id, token: tokenDraft.trim() }) }); } catch (e) {}
            }
            setTokenDraft(''); setEditing(null);
            fetch('/agent-access/tokens', { credentials: 'include' }).then((r) => r.json()).then((j) => setHasTokens(j.has || {})).catch(() => {});
          }
        }
        async function del(a) { if (!window.confirm(t('delConfirm'))) return; await persist(list.filter((x) => x.agent_id !== a.agent_id)); }
        async function revoke(a) {
          try { await fetch('/agent-access/pair/revoke', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agentId: a.agent_id }) }); await reload(); }
          catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); }
        }
        async function gen(a) {
          setEditing(null);
          try {
            const r = await fetch('/agent-access/pair/issue', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agentId: a.agent_id }) });
            const j = await r.json();
            if (j && j.ok) putPairing({ agentId: a.agent_id, display: j.display, expiresAt: j.expiresAt });
            else setMsg({ kind: 'err', text: t('saveFail') + (j && j.error ? '：' + j.error : '') });
          } catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); }
        }
        async function confirm() {
          if (!pairing) return;
          try {
            const r = await fetch('/agent-access/pair/confirm', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }, body: JSON.stringify({ agentId: pairing.agentId, code: pairing.display }) });
            const j = await r.json();
            if (j && j.ok) { await reload(); putPairing(null); setMsg({ kind: 'ok', text: '已确认接入' }); }
            else setMsg({ kind: 'err', text: t('saveFail') + (j && j.error ? '：' + j.error : '') });
          } catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); }
        }
        async function refresh() { setBusy(true); const nx = {}; for (const a of list) nx[a.agent_id] = await probeAgent(a); setStatuses(nx); setBusy(false); }

        function mbHeaders() { return { 'Content-Type': 'application/json', 'X-Agent-Access': '1' }; }
        async function mbLoad() {
          try { const r = await fetch('/agent-access/mailbox', { credentials: 'include', cache: 'no-store' }); const j = await r.json(); setMb(j && j.config ? j : Object.assign({}, j, { config: j.config || { kind: 'remote', host: '', base: '' } })); }
          catch (e) { setMb({ config: { host: '', base: '' }, dirs: [], error: String(e.message || e) }); }
        }
        async function mbSave() {
          if (!mb) return; setMbBusy(true);
          try {
            const r = await fetch('/agent-access/mailbox', { method: 'POST', credentials: 'include', headers: mbHeaders(), body: JSON.stringify(Object.assign({}, mb.config, { password: mbPass || undefined })) });
            const j = await r.json();
            if (j && j.ok) { setMsg({ kind: 'ok', text: t('mbOk') }); setMb(Object.assign({}, mb, { full: j.full })); await mbLoad(); }
            else setMsg({ kind: 'err', text: t('saveFail') + (j && j.error ? '：' + j.error : '') });
          } catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); }
          setMbBusy(false);
        }
        async function mbEnsure() {
          setMbBusy(true);
          try {
            const r = await fetch('/agent-access/mailbox/ensure', { method: 'POST', credentials: 'include', headers: mbHeaders(), body: '{}' });
            const j = await r.json();
            if (j && j.ok) {
              setMb(Object.assign({}, mb, { dirs: j.dirs, error: null, full: j.full || mb.full }));
              setMsg({ kind: 'ok', text: j.created && j.created.length ? t('mbCreated') + '：' + j.created.join('、') : t('mbAllOk') });
            } else setMsg({ kind: 'err', text: t('saveFail') + (j && j.error ? '：' + j.error : '') });
          } catch (e) { setMsg({ kind: 'err', text: t('saveFail') }); }
          setMbBusy(false);
        }
        React.useEffect(() => { mbLoad(); }, []);
        React.useEffect(() => { fetch('/agent-access/tokens', { credentials: 'include' }).then((r) => r.json()).then((j) => setHasTokens(j.has || {})).catch(() => {}); }, [agents]);

        function handlePaste(e) {
          const cb = e.clipboardData || window.clipboardData;
          const txt = cb ? cb.getData('text') : '';
          if (!txt) return;
          const looksBlob = txt.length > 30 || /\n/.test(txt) || /https?:\/\//i.test(txt) || /(端口|host|ip)/i.test(txt);
          if (!looksBlob) return; // 普通小段粘贴放行
          const p = parseAny(txt);
          if (Object.keys(p).length) {
            e.preventDefault();
            const merged = Object.assign({}, editing);
            const filled = [];
            for (const k in p) { if (!String(merged[k] || '')) { merged[k] = p[k]; filled.push(k); } }
            setEditing(merged);
            setMsg({ kind: 'ok', text: t('pasteOk') + '：' + (filled.length ? filled.join('、') : t('pasteNone')) });
          }
        }

        function applyPaste() {
          const el = document.getElementById('agent-paste-box');
          const txt = el ? el.value : '';
          if (!editing) return;
          const p = parseAny(txt);
          if (!Object.keys(p).length) { setMsg({ kind: 'err', text: t('pasteNone') }); return; }
          const merged = Object.assign({}, editing);
          const filled = [];
          for (const k in p) { if (!String(merged[k] || '')) { merged[k] = p[k]; filled.push(k); } }
          setEditing(merged);
          setMsg({ kind: 'ok', text: t('pasteOk') + '：' + (filled.length ? filled.join('、') : t('pasteNone')) });
        }

        function copyPrompt() {
          const el = document.getElementById('agent-prompt-box');
          const text = el ? el.value : buildFullPrompt(editing || list[0] || blank(), pairing ? pairing.display : null);
          const done = () => setMsg({ kind: 'ok', text: t('copied') });
          const fallback = () => { try { if (el) { el.focus(); el.select(); } setMsg({ kind: 'ok', text: t('selected') }); } catch (e) { setMsg({ kind: 'err', text: '请手动选中文本框复制' }); } };
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
            else fallback();
          } catch (e) { fallback(); }
        }

        if (agents === null) return h('div', { style: S.wrap }, h('div', { style: S.h1 }, t('title')), h('div', { style: S.sub }, t('loading')));

        const methodAgent = editing || (pairing ? list.find((x) => x.agent_id === pairing.agentId) : null);

        const agentRows = list.length === 0
          ? h('div', { style: Object.assign({}, S.muted, { padding: '8px 0' }) }, t('empty'))
          : list.map((a) => {
              const st = statuses[a.agent_id] || 'unknown';
              const stKey = ({ down: 'sDown', fake_online: 'sFake', online: 'sOnline', auth: 'sAuth',
                             manual: 'sManual', stale: 'sStale', unknown: 'sUnknown' })[st] || 'sUnknown';
              return h('div', { key: a.agent_id, style: S.row },
                h('span', { style: S.name }, a.display_name || a.agent_id),
                a.verified ? h('span', { style: Object.assign({}, S.tag, { color: 'var(--dsw-alias-success-1,#4caf7a)', borderColor: 'currentColor' }) }, '✓') : null,
                h('span', { style: S.tag }, transportLabel(a.transport)),
                h('span', { style: S.muted }, (roles.find((r) => r.id === a.role) || {}).label || a.role || '—'),
                h('span', { style: { flex: 1 } }),
                h('span', { style: { fontSize: 11, color: stateColor(st) } }, st === 'unknown' ? t('sUnknown') : t(stKey)),
                h('button', { style: S.btn, onClick: () => edit(a) }, t('edit')),
                h('button', { style: S.btn, onClick: () => gen(a) }, t('pair')),
                a.verified ? h('button', { style: S.btn, onClick: () => revoke(a) }, t('revoke')) : null,
                 h('button', { style: S.btn, onClick: () => del(a) }, t('del'))
              );
            });

        const fld = (lk, hk, control) => h('label', { style: S.flc }, h('span', { style: S.lb }, t(lk)), control, h('span', { style: S.tip }, t(hk)));
        const form = editing ? h('div', { style: S.form },
          h('div', { style: { marginBottom: 8, fontSize: 11, color: 'var(--dsw-alias-text-2,#888)' } }, t('pasteHint')),
          h('div', { style: { marginBottom: 10 } },
            h('textarea', { id: 'agent-paste-box', style: S.ta, placeholder: t('pastePh') }),
            h('div', { style: { marginTop: 6 } }, h('button', { style: S.btnP, onClick: applyPaste }, t('pasteBtn')))),
          h('div', { style: S.fl },
            fld('fId', 'hId', h('input', { style: S.inp, value: editing.agent_id, onPaste: handlePaste, onChange: (e) => setEditing(Object.assign({}, editing, { agent_id: e.target.value })) })),
            fld('fName', 'hName', h('input', { style: S.inp, value: editing.display_name, onPaste: handlePaste, onChange: (e) => setEditing(Object.assign({}, editing, { display_name: e.target.value })) }))),
          h('div', { style: S.fl },
            fld('fTransport', 'hTransport', h('select', { style: S.inp, value: editing.transport, onChange: (e) => setEditing(Object.assign({}, editing, { transport: e.target.value })) }, TRANSPORTS.map((v) => h('option', { key: v, value: v }, transportLabel(v))))),
            fld('fRole', 'hRole', h('select', { style: S.inp, value: editing.role, onChange: (e) => setEditing(Object.assign({}, editing, { role: e.target.value })) }, h('option', { value: '' }, '—'), roles.map((r) => h('option', { key: r.id, value: r.id }, r.label + ' (' + r.id + ')'))))),
          h('div', { style: { display: 'flex', gap: 8 } },
            h('div', { style: { flex: 2 } }, fld('fEndpoint', 'hEndpoint', h('input', { style: S.inp, value: editing.endpoint, placeholder: 'http://ip:port/mcp 或板子绝对路径', onPaste: handlePaste, onChange: (e) => setEditing(Object.assign({}, editing, { endpoint: e.target.value })) }))),
            h('div', { style: { flex: 1 } }, fld('fNote', 'hNote', h('input', { style: S.inp, value: editing.note, onPaste: handlePaste, onChange: (e) => setEditing(Object.assign({}, editing, { note: e.target.value })) })))),
          h('div', { style: { display: 'flex', gap: 8, marginTop: 6 } },
            h('div', { style: { flex: 1 } }, fld('fToken', 'hToken', h('input', { style: S.inp, type: 'password', value: tokenDraft, placeholder: hasTokens[editing.agent_id] ? '（已存；输入新值覆盖。删除见 docs/02）' : '对方开了鉴权才填', autoComplete: 'new-password', onChange: (e) => setTokenDraft(e.target.value) })))),
          h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } }, h('button', { style: S.btnP, onClick: save }, t('save')), h('button', { style: S.btnB, onClick: () => setEditing(null) }, t('cancel'))),
          h('div', { style: { marginTop: 8 } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, h('span', { style: S.lb }, t('promptLabel')), h('button', { style: S.btnB, onClick: copyPrompt }, t('copyPrompt'))),
            h('textarea', { id: 'agent-prompt-box', readOnly: true, style: S.ta,
              value: buildFullPrompt(editing, pairing && pairing.agentId === editing.agent_id ? pairing.display : null),
              onClick: (e) => e.target.select() }))
        ) : null;

        const pairCard = pairing ? h('div', { style: S.form },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('span', { style: S.lb }, t('pairTitle') + ' · ' + pairing.agentId),
            h('span', { style: S.code }, pairing.display),
            h('span', { style: S.muted }, new Date(pairing.expiresAt).toLocaleTimeString()),
            h('span', { style: { flex: 1 } }),
            h('button', { style: S.btnP, onClick: confirm }, t('confirm')),
            h('button', { style: S.btnB, onClick: () => putPairing(null) }, t('cancel'))),
          h('div', { style: Object.assign({}, S.muted, { marginTop: 4 }) }, t('pairHint')),
          h('div', { style: { marginTop: 8 } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              h('span', { style: S.lb }, t('promptLabel')),
              h('button', { style: S.btnB, onClick: () => {
                const el = document.getElementById('pair-prompt-box');
                const text = el ? el.value : '';
                const done = () => setMsg({ kind: 'ok', text: t('copied') });
                const fallback = () => { try { if (el) { el.focus(); el.select(); } setMsg({ kind: 'ok', text: t('selected') }); } catch (e) {} };
                try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback(); }
                catch (e) { fallback(); }
              } }, t('copyPrompt'))),
            h('textarea', { id: 'pair-prompt-box', readOnly: true, style: S.ta,
              value: buildFullPrompt(list.find((x) => x.agent_id === pairing.agentId) || { agent_id: pairing.agentId }, pairing.display),
              onClick: (e) => e.target.select() }))
        ) : null;

        return h('div', { style: S.wrap },
          h('div', { style: S.head },
            h('span', { style: S.h1 }, t('title')),
            h('span', null, h('button', { style: S.btn, onClick: refresh, disabled: busy }, busy ? '…' : t('refresh')), h('button', { style: S.btnP, onClick: add }, '+ ' + t('add')))),
          h('div', { style: S.sub }, t('intro')),
          h('div', { style: { border: '1px solid var(--dsw-alias-border-1, #2f2f2f)', borderRadius: 8, padding: 10, margin: '0 0 14px' } },
            h('div', { style: S.sectionTitle }, t('mbTitle')),
            h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-text-2,#888)', margin: '0 0 8px' } }, t('mbIntro')),
            mb ? [
              h('div', { key: 'mb0', style: S.fl },
                h('label', { style: S.flc }, h('span', { style: S.lb }, t('mbKind')),
                  h('select', { style: S.inp, value: mb.config.kind || 'remote', onChange: (e) => setMb(Object.assign({}, mb, { config: Object.assign({}, mb.config, { kind: e.target.value }) })) },
                    h('option', { value: 'remote' }, t('mbRemote')), h('option', { value: 'local' }, t('mbLocal'))),
                  h('span', { style: S.tip }, t('mbRemoteHint')))),
              h('div', { key: 'mb1', style: S.fl },
                h('label', { style: S.flc }, h('span', { style: S.lb }, t('mbHost')),
                  h('input', { style: S.inp, value: mb.config.host, disabled: mb.config.kind === 'local', onChange: (e) => setMb(Object.assign({}, mb, { config: Object.assign({}, mb.config, { host: e.target.value }) })) }),
                  h('span', { style: S.tip }, t('mbHostHint'))),
                h('label', { style: S.flc }, h('span', { style: S.lb }, t('mbBase')),
                  h('input', { style: S.inp, value: mb.config.base, onChange: (e) => setMb(Object.assign({}, mb, { config: Object.assign({}, mb.config, { base: e.target.value }) })) }),
                  h('span', { style: S.tip }, t('mbBaseHint')))),
              h('div', { key: 'mb1b', style: Object.assign({}, S.tip, { marginBottom: 6 }) }, (mb.full || mbFullAddress(mb)) ? ('完整地址：' + (mb.full || mbFullAddress(mb))) : ''),
              h('div', { key: 'mb2', style: { margin: '4px 0 8px' } },
                h('button', { style: S.btnP, disabled: mbBusy, onClick: mbSave }, mbBusy ? t('mbSaving') : t('mbSave')),
                h('button', { style: S.btnB, disabled: mbBusy, onClick: mbLoad }, t('mbCheck')),
                h('button', { style: S.btnB, disabled: mbBusy, onClick: mbEnsure }, t('mbEnsure'))),
              h('div', { key: 'mb3', style: { fontSize: 11 } },
                (mb.dirs || []).length ? mb.dirs.map((d) => h('span', { key: d.name, style: Object.assign({}, S.chip, { color: d.exists ? 'var(--dsw-alias-success-1,#4caf7a)' : 'var(--dsw-alias-danger-1,#d55)' }) }, d.name + (d.exists ? ' ✓' : ' · ' + t('mbMissing')))) : h('span', { style: S.muted }, t('mbUnknown')),
                mb.error ? h('span', { style: Object.assign({}, S.err, { marginLeft: 8 }) }, t('mbProbeErr') + '：' + mb.error) : null),
              h('div', { key: 'mb4', style: Object.assign({}, S.tip, { marginTop: 6 }) }, t('mbDirHint')),
            ] : h('div', { style: S.muted }, t('mbUnknown'))),
          msg ? h('div', { style: msg.kind === 'ok' ? S.ok : S.err }, msg.text, msg.kind === 'err' ? h('button', { style: S.btn, onClick: () => { setAgents(null); load(0); } }, t('retry')) : null) : null,
          h('div', null, agentRows),
          h('div', { style: Object.assign({}, S.tip, { marginTop: 4 }) }, t('legend')),
          form,
          pairCard,
          h('div', { style: { marginTop: 14, fontSize: 11, color: 'var(--dsw-alias-text-2,#888)' } },
            h('span', null, t('rolesLabel') + '：'),
            roles.map((r) => h('span', { key: r.id, style: S.chip }, r.label)))
        );
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICT.zh), 'agent-access: zh');
        ctx.effect(() => ctx.locale.register(NS, 'en', DICT.en), 'agent-access: en');
        const Page = makePage();
        ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'agent-access', order: 60, label: () => t('nav'), locale: NS,
        }, (p) => h(Page, Object.assign({}, p, { t })))), 'agent-access: section');
      },
    };
  },
});
