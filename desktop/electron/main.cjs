'use strict'
const { app, BrowserWindow, ipcMain, shell, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const net = require('net')
const dgram = require('dgram')
const { spawnSync } = require('child_process')
const { Engine } = require('./relay.cjs')

const DEMO = !!process.env.MAMALI_DEMO
const SHOT = process.env.MAMALI_SHOT || null

// candidate local proxy ports used by common VPN clients
const CANDIDATE_PORTS = [1080, 1086, 1087, 1090, 1089, 7890, 7891, 10808, 10809, 2080, 2081, 8889, 9090, 8388, 1091, 20171, 2801]

let win = null
let engine = null
let myIp = '127.0.0.1'
let exitInfo = { status: 'locating' }
let detected = false       // did we find a working upstream proxy?
let listenOk = false
const userDir = app.getPath('userData')
const DEVICES_FILE = path.join(userDir, 'devices.json')
const CONFIG_FILE = path.join(userDir, 'config.json')
const FW_FLAG = path.join(userDir, 'fw.ok')

let CONFIG = { upstreamHost: '127.0.0.1', upstreamPort: 1080, listenPort: 1081 }
let devices = { names: {}, blocked: [] }

// ---------- persistence ----------
function loadConfig () { try { Object.assign(CONFIG, JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))) } catch (e) {} }
function saveConfig () { try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, null, 2)) } catch (e) {} }
function loadDevices () { try { return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf-8')) } catch (e) { return { names: {}, blocked: [] } } }
function saveDevices () { if (!engine) return; try { fs.writeFileSync(DEVICES_FILE, JSON.stringify({ names: engine.names, blocked: [...engine.blocked] }, null, 2)) } catch (e) {} }

// ---------- LAN ip ----------
function lanIp () {
  return new Promise((resolve) => {
    const s = dgram.createSocket('udp4')
    let done = false
    const fin = (v) => { if (done) return; done = true; try { s.close() } catch (e) {}; resolve(v) }
    try { s.connect(80, '8.8.8.8', () => fin(s.address().address)) } catch (e) { fin('127.0.0.1') }
    setTimeout(() => fin('127.0.0.1'), 1500)
  })
}

function flag (cc) {
  cc = (cc || '').trim().toUpperCase()
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return '🌎'
  return String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

// ---------- proxy probing ----------
function tcpOpen (host, port, ms) {
  return new Promise((res) => {
    const s = net.connect({ host, port })
    let done = false
    const fin = (v) => { if (done) return; done = true; try { s.destroy() } catch (e) {}; res(v) }
    s.setTimeout(ms, () => fin(false))
    s.on('connect', () => fin(true))
    s.on('error', () => fin(false))
  })
}
// HTTP-proxy test: GET ip-api through the candidate; resolves the location object or null
function httpProxyTest (host, port) {
  return new Promise((res) => {
    const s = net.connect(port, host)
    let buf = ''; let done = false
    const fin = (v) => { if (done) return; done = true; try { s.destroy() } catch (e) {}; res(v) }
    s.setTimeout(8000, () => fin(null))
    s.on('connect', () => s.write('GET http://ip-api.com/json/ HTTP/1.1\r\nHost: ip-api.com\r\nUser-Agent: tb\r\nConnection: close\r\n\r\n'))
    s.on('data', (d) => { buf += d.toString('utf8') })
    s.on('error', () => fin(null))
    s.on('close', () => {
      try {
        const a = buf.indexOf('{'); const b = buf.lastIndexOf('}')
        const j = JSON.parse(buf.slice(a, b + 1))
        if (j.query || j.ip) { const cc = j.countryCode || j.country || ''; fin({ status: 'ok', ip: j.query || j.ip, city: j.city || '', region: j.regionName || '', country: cc, org: j.isp || '', flag: flag(cc) }) } else fin(null)
      } catch (e) { fin(null) }
    })
  })
}
// SOCKS5 handshake test: confirms a SOCKS5 proxy is present
function socks5Test (host, port) {
  return new Promise((res) => {
    const s = net.connect(port, host)
    let done = false
    const fin = (v) => { if (done) return; done = true; try { s.destroy() } catch (e) {}; res(v) }
    s.setTimeout(3000, () => fin(false))
    s.on('connect', () => s.write(Buffer.from([0x05, 0x01, 0x00])))
    s.on('data', (d) => fin(d.length >= 2 && d[0] === 0x05 && (d[1] === 0x00 || d[1] === 0x02)))
    s.on('error', () => fin(false))
  })
}

// scan candidates; return {host,port,exit} for first working proxy (HTTP preferred for exit info)
async function detectProxy (exclude) {
  const cands = CANDIDATE_PORTS.filter(p => p !== exclude)
  const listening = []
  await Promise.all(cands.map(async (p) => { if (await tcpOpen('127.0.0.1', p, 400)) listening.push(p) }))
  for (const p of cands) {
    if (!listening.includes(p)) continue
    const ex = await httpProxyTest('127.0.0.1', p)
    if (ex) return { host: '127.0.0.1', port: p, exit: ex }
    if (await socks5Test('127.0.0.1', p)) return { host: '127.0.0.1', port: p, exit: { status: 'error' } }
  }
  return null
}

// ---------- exit location via current upstream (HTTP proxy) ----------
async function lookupExit () {
  const ex = await httpProxyTest(CONFIG.upstreamHost, CONFIG.upstreamPort)
  exitInfo = ex || { status: 'error', error: 'no http proxy' }
}

// ---------- elevated firewall / portproxy setup (one UAC) ----------
function elevatedSetup (port) {
  const bat = path.join(os.tmpdir(), 'tunnelbridge_setup.bat')
  const body = '@echo off\r\n' +
    `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=${port} >nul 2>&1\r\n` +
    `netsh advfirewall firewall delete rule name="TunnelBridge ${port}" >nul 2>&1\r\n` +
    `netsh advfirewall firewall add rule name="TunnelBridge ${port}" dir=in action=allow protocol=TCP localport=${port} profile=any >nul 2>&1\r\n`
  try { fs.writeFileSync(bat, body) } catch (e) { return }
  const ps = `Start-Process -FilePath '${bat}' -Verb RunAs -WindowStyle Hidden -Wait`
  try { spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true, timeout: 60000 }) } catch (e) {}
}

// ---------- demo data ----------
let demoT = 0
const demoDevs = [
  { ip: '192.168.1.48', host: 'iPhone-15-Pro', name: '', up: 0, down: 0, active: 2, total: 14, ph: 0, amp: [90000, 1500000] },
  { ip: '192.168.1.51', host: '', name: 'Sara laptop', up: 0, down: 0, active: 1, total: 6, ph: 2, amp: [40000, 300000] },
  { ip: '192.168.1.77', host: 'Galaxy-Tab', name: '', up: 0, down: 0, active: 0, total: 3, ph: 4, amp: [8000, 60000] }
]
function demoSnapshot () {
  demoT += 1
  let tu = 0; let td = 0
  const now = Date.now() / 1000
  const clients = demoDevs.map((d, i) => {
    const act = d.active > 0
    const ur = act ? Math.max(0, (Math.sin(demoT / 6 + d.ph) * 0.4 + 0.55) * d.amp[0] * (0.85 + 0.15 * Math.sin(demoT / 2.3 + i))) : 0
    const dr = act ? Math.max(0, (Math.sin(demoT / 4.5 + d.ph) * 0.42 + 0.6) * d.amp[1] * (0.85 + 0.15 * Math.sin(demoT / 1.7 + i))) : 0
    d.up += ur; d.down += dr; tu += d.up; td += d.down
    return { ip: d.ip, hostname: d.host, name: d.name, active: d.active, total_conns: d.total, up: d.up, down: d.down, up_rate: ur, down_rate: dr, blocked: false, first_seen: now - 184, last_seen: act ? now : now - 120 }
  })
  return { started: now - 184, listen_port: CONFIG.listenPort, my_ip: '192.168.1.33', upstream: '127.0.0.1:1080', total_up: tu, total_down: td, total_conns: 23, exit: { status: 'ok', city: 'Clifton', region: 'New Jersey', country: 'US', flag: '🇺🇸' }, clients }
}

// ---------- window ----------
function createWindow () {
  win = new BrowserWindow({
    width: 1180, height: 840, minWidth: 920, minHeight: 680,
    backgroundColor: '#08080a', frame: false, titleBarStyle: 'hidden', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  })
  const devUrl = process.env.MAMALI_DEV_URL
  const loadOpts = process.env.MAMALI_OPEN_SETTINGS ? { search: 'settings' } : {}
  if (devUrl) win.loadURL(devUrl)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), loadOpts)
  win.once('ready-to-show', () => win.show())

  if (SHOT) {
    win.webContents.on('did-finish-load', () => {
      try { win.setContentSize(1180, parseInt(process.env.MAMALI_SHOT_H || '1500', 10)) } catch (e) {}
      setTimeout(async () => {
        try { const img = await win.webContents.capturePage(); fs.writeFileSync(SHOT, img.toPNG()) } catch (e) {}
        app.quit()
      }, 6500)
    })
  }
}

// ---------- engine lifecycle ----------
async function startEngine (reconfigure) {
  if (engine) { try { engine.close() } catch (e) {}; engine = null }
  engine = new Engine({
    listenPort: CONFIG.listenPort, upstreamHost: CONFIG.upstreamHost, upstreamPort: CONFIG.upstreamPort,
    names: devices.names || {}, blocked: devices.blocked || []
  })
  // first run ever (or listen port changed): elevated firewall + clear portproxy
  let elevated = false
  if (!fs.existsSync(FW_FLAG) || reconfigure) {
    elevatedSetup(CONFIG.listenPort); elevated = true
    try { fs.writeFileSync(FW_FLAG, '1') } catch (e) {}
  }
  listenOk = false
  try { await engine.listen(); listenOk = true } catch (e) {
    if (e && e.code === 'EADDRINUSE' && !elevated) {
      elevatedSetup(CONFIG.listenPort)
      try { await engine.listen(); listenOk = true } catch (e2) { engine.lastError = e2.message }
    } else { engine.lastError = e.message }
  }
}

// ---------- IPC ----------
function wireIpc () {
  ipcMain.handle('stats:get', () => {
    if (DEMO) return demoSnapshot()
    const snap = engine.snapshot()
    snap.my_ip = myIp
    snap.exit = exitInfo
    return snap
  })
  ipcMain.handle('app:meta', () => ({
    version: app.getVersion(), myIp, listenPort: CONFIG.listenPort,
    upstream: `${CONFIG.upstreamHost}:${CONFIG.upstreamPort}`,
    detected: DEMO ? true : detected, listenOk: DEMO ? true : listenOk
  }))
  ipcMain.handle('config:get', () => ({ ...CONFIG }))
  ipcMain.handle('config:set', async (e, cfg) => {
    const oldPort = CONFIG.listenPort
    if (cfg && typeof cfg === 'object') {
      if (cfg.upstreamHost) CONFIG.upstreamHost = String(cfg.upstreamHost).trim()
      if (cfg.upstreamPort) CONFIG.upstreamPort = parseInt(cfg.upstreamPort, 10) || CONFIG.upstreamPort
      if (cfg.listenPort) CONFIG.listenPort = parseInt(cfg.listenPort, 10) || CONFIG.listenPort
    }
    saveConfig()
    detected = true
    await startEngine(CONFIG.listenPort !== oldPort)
    lookupExit()
    return { ok: true, listenOk }
  })
  ipcMain.handle('proxy:detect', async () => {
    const found = await detectProxy(CONFIG.listenPort)
    if (found) { CONFIG.upstreamHost = found.host; CONFIG.upstreamPort = found.port; saveConfig(); detected = true; if (found.exit && found.exit.status === 'ok') exitInfo = found.exit; await startEngine(false); lookupExit() }
    return found ? { ok: true, host: found.host, port: found.port } : { ok: false }
  })
  ipcMain.handle('device:rename', (e, ip, name) => { if (engine) { engine.rename(ip, (name || '').slice(0, 40)); saveDevices() } return true })
  ipcMain.handle('device:block', (e, ip, on) => { if (engine) { engine.block(ip, !!on); saveDevices() } return true })
  ipcMain.handle('clip:copy', (e, text) => { clipboard.writeText(String(text || '')); return true })
  ipcMain.on('win:minimize', () => win && win.minimize())
  ipcMain.on('win:close', () => win && win.close())
  ipcMain.on('open:external', (e, url) => { try { shell.openExternal(url) } catch (e) {} })
}

// ---------- startup ----------
async function start () {
  myIp = await lanIp()
  loadConfig()
  devices = loadDevices()

  if (!DEMO) {
    // Validate the saved/default upstream; if it doesn't work, auto-detect.
    const ok = (await httpProxyTest(CONFIG.upstreamHost, CONFIG.upstreamPort)) || (await socks5Test(CONFIG.upstreamHost, CONFIG.upstreamPort))
    if (ok) { detected = true; if (ok.status === 'ok') exitInfo = ok }
    else {
      const found = await detectProxy(CONFIG.listenPort)
      if (found) { CONFIG.upstreamHost = found.host; CONFIG.upstreamPort = found.port; saveConfig(); detected = true; if (found.exit && found.exit.status === 'ok') exitInfo = found.exit }
      else { detected = false; exitInfo = { status: 'error', error: 'no proxy' } }
    }
    await startEngine(false)
    lookupExit()
    setInterval(lookupExit, 300000)
  }

  wireIpc()
  createWindow()
}

app.whenReady().then(start)
app.on('window-all-closed', () => { if (engine) engine.close(); app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
