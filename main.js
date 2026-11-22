'use strict';
// Electron shell: runs the local agent server in-process and shows the UI in a native window.
// Electron 22 (Chromium 108, Node 16) is the last line that supports Windows 7/8/8.1.
const { app, BrowserWindow, dialog, shell } = require('electron');
const agent = require('./server');

app.disableHardwareAcceleration(); // more stable on old PCs / GPUs

let win = null;
function createWindow(url) {
  win = new BrowserWindow({
    width: 1280, height: 820, title: 'Chatbot Local Agent', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadURL(url);
  win.webContents.setWindowOpenHandler(function (d) { shell.openExternal(d.url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', function (e, u) {
    if (u.indexOf('http://127.0.0.1:' + agent.getPort()) !== 0) { e.preventDefault(); shell.openExternal(u); }
  });
  win.on('closed', function () { win = null; });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', function () { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  agent.hooks.pickFolder = async function () {
    const r = await dialog.showOpenDialog(win, { title: 'انتخاب پوشه پروژه', properties: ['openDirectory'] });
    return r.canceled ? '' : r.filePaths[0];
  };
  app.whenReady().then(function () { agent.listen(0, createWindow); });
  app.on('window-all-closed', function () { app.quit(); });
}
