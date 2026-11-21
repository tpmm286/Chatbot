const { app, BrowserWindow, dialog, shell } = require('electron');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
let apiProcess = null, mainWindow = null, apiPort = null;
function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); });
  });
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer(url, child) {
  for (let i=0;i<80;i++) {
    if (child.exitCode !== null) throw new Error('سرور داخلی برنامه اجرا نشد.');
    try { const r=await fetch(url+'/api/models'); if (r.ok) return; } catch (_) {}
    await delay(250);
  }
  throw new Error('زمان انتظار برای راه‌اندازی سرور داخلی تمام شد.');
}
async function startLocalServer() {
  apiPort=await reservePort();
  const appPath=app.getAppPath();
  const entry=path.join(appPath,'electron','server.cjs');
  const userData = app.getPath('userData');
  const bootstrapFile = path.join(userData, 'admin-bootstrap-token.txt');
  fs.mkdirSync(userData, { recursive: true });
  if (!fs.existsSync(bootstrapFile)) fs.writeFileSync(bootstrapFile, crypto.randomBytes(24).toString('hex'), { mode: 0o600 });
  const bootstrapToken = fs.readFileSync(bootstrapFile, 'utf8').trim();
  const childEnv={...process.env,ELECTRON_RUN_AS_NODE:'1',NODE_ENV:'production',PORT:String(apiPort),HOST:'127.0.0.1',
    WORKSPACE_ROOT:path.join(userData,'workspaces'),AUTH_DB_PATH:path.join(userData,'auth.json'),
    ADMIN_BOOTSTRAP_TOKEN:bootstrapToken,LOCAL_DESKTOP_APP:'1',
    WORKSPACE_COMMANDS_ALLOW_UNSANDBOXED:'true'};
  apiProcess=spawn(process.execPath,[entry],{cwd:appPath,env:childEnv,stdio:['ignore','pipe','pipe'],windowsHide:true});
  apiProcess.stdout.on('data',d=>console.log('[local-api]',d.toString()));
  apiProcess.stderr.on('data',d=>console.error('[local-api]',d.toString()));
  apiProcess.on('exit',code=>{if(code&&mainWindow&&!mainWindow.isDestroyed())dialog.showErrorBox('خطای سرور داخلی',`سرور داخلی متوقف شد (کد ${code}).`);});
  await waitForServer(`http://127.0.0.1:${apiPort}`,apiProcess);
  const status = await fetch(`http://127.0.0.1:${apiPort}/api/auth/status`).then(r => r.json());
  if (!status.initialized) {
    await dialog.showMessageBox({ type: 'info', title: 'کد راه‌اندازی ادمین اصلی',
      message: 'برای ساخت ادمین اولیه، این کد را در صفحه راه‌اندازی وارد کن:',
      detail: bootstrapToken, buttons: ['متوجه شدم'] });
  }
}
async function createWindow() {
  mainWindow=new BrowserWindow({width:1440,height:920,minWidth:980,minHeight:680,backgroundColor:'#111827',show:false,
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
  mainWindow.once('ready-to-show',()=>mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(`http://127.0.0.1:${apiPort}`))event.preventDefault();});
  await mainWindow.loadURL(`http://127.0.0.1:${apiPort}`);
}
app.whenReady().then(async()=>{try{await startLocalServer();await createWindow();}catch(e){dialog.showErrorBox('راه‌اندازی ناموفق',e.message||String(e));app.quit();}});
app.on('before-quit',()=>{if(apiProcess&&!apiProcess.killed)apiProcess.kill();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0&&apiPort)createWindow();});
