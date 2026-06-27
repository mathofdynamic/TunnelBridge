'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mamali', {
  getStats: () => ipcRenderer.invoke('stats:get'),
  meta: () => ipcRenderer.invoke('app:meta'),
  rename: (ip, name) => ipcRenderer.invoke('device:rename', ip, name),
  block: (ip, on) => ipcRenderer.invoke('device:block', ip, on),
  copy: (text) => ipcRenderer.invoke('clip:copy', text),
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (cfg) => ipcRenderer.invoke('config:set', cfg),
  detectProxy: () => ipcRenderer.invoke('proxy:detect'),
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  openExternal: (url) => ipcRenderer.send('open:external', url)
})
