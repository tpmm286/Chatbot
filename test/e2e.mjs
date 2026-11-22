import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-'));
process.env.CHATBOT_AGENT_HOME = path.join(tmp, 'home'); process.env.NO_BROWSER = '1'; process.env.PORT = '18765';
delete process.env.HTTPS_PROXY; delete process.env.https_proxy; delete process.env.HTTP_PROXY; delete process.env.http_proxy;
const proj = path.join(tmp, 'proj'); fs.mkdirSync(path.join(proj, 'src'), { recursive: true });
fs.writeFileSync(path.join(proj, 'package.json'), JSON.stringify({ scripts: { build: 'x' }, dependencies: {} }));
fs.writeFileSync(path.join(proj, 'src/a.js'), "import b from './missing';\r\nconsole.log('a');\r\n");
fs.writeFileSync(path.join(proj, '.env'), 'SECRET=1');
fs.writeFileSync(path.join(proj, 'AGENTS.md'), 'NOTE_FROM_AGENTS_MD');
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
fs.writeFileSync(path.join(proj, 'pic.png'), Buffer.from(PNG.split(',')[1], 'base64'));

const T = (n, a) => ({ n, a });
const queue = []; let seen = [];
const mock = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => {
  const body = JSON.parse(b); const isSub = String(body.messages[0].content).includes('read-only research subagent');
  let msg, id = 0;
  if (isSub) {
    const hasTool = body.messages.some(m => m.role === 'tool');
    msg = hasTool ? { role: 'assistant', content: 'SUBREPORT:' + body.messages[1].content } : { role: 'assistant', content: null, tool_calls: [{ id: 's1', type: 'function', function: { name: 'list_dir', arguments: '{"path":"."}' } }] };
    body._sub = true;
  } else {
    const s = queue.shift(); if (s === undefined) throw new Error('mock queue empty');
    msg = typeof s === 'string' ? { role: 'assistant', content: s } : { role: 'assistant', content: null, tool_calls: s.map((t, i) => ({ id: 'c' + (id++) + '_' + seen.length + i, type: 'function', function: { name: t.n, arguments: JSON.stringify(t.a) } })) };
  }
  seen.push(body);
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: msg }] })); }); });
await new Promise(r => mock.listen(19911, '127.0.0.1', r));
const A = createRequire(import.meta.url)(path.join(here, '..', 'server.js')); A.listen(0);
await new Promise(r => setTimeout(r, 300));
const base = 'http://127.0.0.1:18765'; let cookie = '';
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
const call = async (p, method = 'GET', body, hdr = {}) => { const r = await fetch(base + p, { method, redirect: 'manual', headers: { 'content-type': 'application/json', cookie, ...hdr }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); let j; try { j = JSON.parse(t) } catch { j = t } return { s: r.status, j, h: r.headers }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function idle() { for (let i = 0; i < 200 && A.state.running; i++) await sleep(50); }
async function approve(tool, yes = true) { for (let i = 0; i < 100; i++) { const id = Object.keys(A.state.pending)[0]; if (id) { const ev = A.state.log.filter(e => e.type === 'approval').pop(); ok(ev.tool === tool, 'approval requested for ' + tool); return call('/api/approve', 'POST', { id, approve: yes }); } await sleep(50); } ok(false, 'no approval for ' + tool); }
const results = () => A.state.log.filter(e => e.type === 'tool_result').map(e => e.text);

// ---- security & basics
ok((await call('/api/ls')).s === 401, 'no token -> 401');
const r0 = await call('/?t=' + A.TOKEN); ok(r0.s === 302, 'token redirect'); cookie = r0.h.get('set-cookie').split(';')[0];
ok(String((await call('/')).j).includes('<html'), 'UI served');
ok((await call('/api/ls?path=.', 'GET', null, { origin: 'http://evil.com' })).s === 403, 'foreign origin blocked');
ok((await call('/api/open', 'POST', { path: proj })).s === 200, 'open project');
ok((await call('/api/ls?path=..')).s === 400, 'ls escape blocked');
ok((await call('/api/file?path=.env')).s === 403, '.env viewer blocked');
await call('/api/config', 'POST', { baseUrl: 'http://127.0.0.1:19911/v1', model: 'm', apiKey: 'k' });

// ---- phase A: file tools + approvals
queue.push([T('list_dir', { path: '.' }), T('diagnose_project', {}), T('read_file', { path: '.env' }), T('read_file', { path: '../x' }), T('search', { pattern: 'missing' })],
  [T('write_file', { path: 'src/new.js', content: 'var x = 1;\n' })], [T('run_command', { command: 'echo hello-from-agent' })],
  [T('edit_file', { path: 'src/a.js', old_string: "import b from './missing';\nconsole.log('a');", new_string: "console.log('fixed');" }), T('zip_folder', {})], 'DONE_TEXT');
ok((await call('/api/send', 'POST', { text: 'fix' })).s === 202, 'send accepted');
await approve('write_file'); await approve('run_command'); await approve('edit_file'); await approve('zip_folder'); await idle();
let r = results();
ok(r[0].includes('src/') && r[1].includes('missing') && /محرمانه/.test(r[2]) && /خارج از پوشه/.test(r[3]) && r[4].includes('src/a.js:1'), 'list/diagnose/secret/escape/search');
ok(fs.readFileSync(path.join(proj, 'src/new.js'), 'utf8') === 'var x = 1;\n', 'write_file');
ok(r[6].includes('hello-from-agent') && r[6].includes('exit code: 0'), 'run_command');
ok(fs.readFileSync(path.join(proj, 'src/a.js'), 'utf8') === "console.log('fixed');\r\n", 'edit_file keeps CRLF');
ok(fs.existsSync(path.join(proj, 'project-export.zip')) && fs.readdirSync(path.join(proj, '.agent-backups')).length >= 1, 'zip + backups');
ok(String(seen[0].messages[0].content).includes('NOTE_FROM_AGENTS_MD'), 'AGENTS.md loaded into system prompt');

// ---- phase B: hooks, MCP, parallel subagents
const adv = { mcpServers: { fake: { command: process.execPath, args: [path.join(here, 'fake-mcp.js')] } }, hooks: { PreToolUse: [{ matcher: 'run_command', command: '"' + process.execPath + '" "' + path.join(here, 'hook.js') + '"' }] } };
ok((await call('/api/config', 'POST', { baseUrl: 'http://127.0.0.1:19911/v1', model: 'm', advanced: JSON.stringify(adv) })).s === 200, 'advanced config saved');
ok((await call('/api/config', 'POST', { advanced: '{bad' })).s === 400, 'bad advanced JSON rejected');
queue.length = 0; seen = []; A.state.log.length = 0;
queue.push([T('run_command', { command: 'echo blockme' })], [T('mcp__fake__echo', { text: 'hi' })], [T('task', { description: 'a', prompt: 'ALPHA' }), T('task', { description: 'b', prompt: 'BETA' })], 'B_DONE');
await call('/api/send', 'POST', { text: 'phase b' });
await approve('mcp__fake__echo'); await idle();
r = results();
ok(/Blocked by PreToolUse hook: policy: blockme/.test(r[0]), 'PreToolUse hook blocks command (no approval asked)');
ok(r[1] === 'echo:hi', 'MCP tool called after approval: ' + r[1]);
ok(r.some(x => x.includes('SUBREPORT:ALPHA')) && r.some(x => x.includes('SUBREPORT:BETA')), 'two subagents ran in parallel');
ok(seen.filter(b => !b._sub)[0].tools.some(t => t.function.name === 'mcp__fake__echo'), 'MCP tool exposed to model');

// ---- phase C: plan mode is read-only
queue.length = 0; seen = []; A.state.log.length = 0;
queue.push([T('write_file', { path: 'x.txt', content: 'no' })], 'PLAN: 1. fix import');
await call('/api/send', 'POST', { text: 'plan it', plan: true }); await idle();
const main = seen.filter(b => !b._sub);
ok(!main[0].tools.some(t => t.function.name === 'write_file' || t.function.name === 'run_command'), 'plan mode hides write/command tools');
ok(/plan mode is read-only/.test(results()[0]) && !fs.existsSync(path.join(proj, 'x.txt')), 'plan mode refuses write even if model tries');
ok(A.state.log.some(e => e.type === 'status' && e.running === false && e.plan === true), 'plan status event');

// ---- phase D: images
queue.length = 0; seen = []; A.state.log.length = 0;
queue.push('SAW_IMAGE', [T('view_image', { path: 'pic.png' })], 'VIEWED');
await call('/api/send', 'POST', { text: 'look', images: [PNG, 'data:text/html;base64,AAAA'] }); await idle();
const um = seen[0].messages.filter(m => m.role === 'user').pop();
ok(Array.isArray(um.content) && um.content.filter(p => p.type === 'image_url').length === 1, 'user image attached (invalid one dropped)');
await call('/api/send', 'POST', { text: 'view file' }); await idle();
const last = seen[seen.length - 1].messages;
ok(Array.isArray(last[last.length - 1].content) && last[last.length - 1].content.some(p => p.type === 'image_url'), 'view_image injects image message after tool result');

// ---- reject flow + zip download
queue.length = 0; A.state.log.length = 0;
queue.push([T('run_command', { command: 'echo no' })], 'AFTER_REJECT');
await call('/api/send', 'POST', { text: 'again' }); await approve('run_command', false); await idle();
ok(A.state.messages.some(m => m.role === 'tool' && /REJECTED/.test(m.content)), 'rejection reported to model');
const z = await fetch(base + '/api/zip', { headers: { cookie } }); const zb = Buffer.from(await z.arrayBuffer());
ok(z.headers.get('content-type') === 'application/zip' && zb.length > 100 && !zb.includes('SECRET=1'), 'zip download without secrets');
process.exit(process.exitCode || 0);
