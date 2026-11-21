const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('desktopInfo', Object.freeze({isDesktop:true,platform:process.platform,appName:'Chatbot Coding Agent'}));
