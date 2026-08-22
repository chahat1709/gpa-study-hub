const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('gpaDesktop', {
  platform: process.platform,
  isDesktop: true,
});
