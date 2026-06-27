'use strict'
// Transparent TCP relay + live stats engine.
// Listens on 0.0.0.0:<listenPort>, forwards every connection to the upstream
// proxy (TurboVPN on 127.0.0.1:1080) from localhost, so the upstream trusts it.
// Works for both SOCKS5 and HTTP proxy traffic (it's a raw byte pipe).

const net = require('net')
const dns = require('dns')

function cleanIp (a) { return (a || '?').replace('::ffff:', '') }

class Engine {
  constructor (opts = {}) {
    this.listenHost = opts.listenHost || '0.0.0.0'
    this.listenPort = opts.listenPort || 1081
    this.upHost = opts.upstreamHost || '127.0.0.1'
    this.upPort = opts.upstreamPort || 1080
    this.clients = new Map()        // ip -> stat
    this.active = new Map()         // ip -> Set<socket>
    this.blocked = new Set(opts.blocked || [])
    this.names = Object.assign({}, opts.names || {})
    this.totalUp = 0
    this.totalDown = 0
    this.totalConns = 0
    this.started = Date.now()
    this.server = null
    this.lastError = null
    this.onError = opts.onError || null
    // sample per-device + total throughput rates once per second
    this.lastSample = Date.now()
    this._sampler = setInterval(() => this._sample(), 1000)
    if (this._sampler.unref) this._sampler.unref()
  }

  _stat (ip) {
    let c = this.clients.get(ip)
    if (!c) {
      c = { ip, hostname: '', active: 0, total: 0, up: 0, down: 0, up_rate: 0, down_rate: 0, _pu: 0, _pd: 0, first: Date.now(), last: Date.now() }
      this.clients.set(ip, c)
      dns.reverse(ip, (e, h) => { if (!e && h && h[0]) c.hostname = h[0] })
    }
    return c
  }

  _sample () {
    const now = Date.now()
    const dt = Math.max(0.001, (now - this.lastSample) / 1000)
    this.lastSample = now
    for (const c of this.clients.values()) {
      c.up_rate = Math.max(0, (c.up - c._pu) / dt)
      c.down_rate = Math.max(0, (c.down - c._pd) / dt)
      c._pu = c.up; c._pd = c.down
    }
  }

  listen () {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((sock) => this._onConn(sock))
      this.server.once('error', (e) => { this.lastError = e.message; reject(e) })
      this.server.listen(this.listenPort, this.listenHost, () => {
        this.server.removeAllListeners('error')
        this.server.on('error', (e) => { this.lastError = e.message; if (this.onError) this.onError(e) })
        resolve()
      })
    })
  }

  _onConn (client) {
    const ip = cleanIp(client.remoteAddress)
    if (this.blocked.has(ip)) { this._stat(ip); client.destroy(); return }

    const c = this._stat(ip)
    c.active++; c.total++; c.last = Date.now(); this.totalConns++
    if (!this.active.has(ip)) this.active.set(ip, new Set())
    this.active.get(ip).add(client)

    const up = net.connect(this.upPort, this.upHost)
    let closed = false
    const done = () => {
      if (closed) return
      closed = true
      c.active = Math.max(0, c.active - 1); c.last = Date.now()
      const s = this.active.get(ip); if (s) s.delete(client)
      client.destroy(); up.destroy()
    }

    up.on('connect', () => {
      client.on('data', (d) => { c.up += d.length; this.totalUp += d.length; c.last = Date.now(); if (!up.write(d)) client.pause() })
      up.on('drain', () => client.resume())
      up.on('data', (d) => { c.down += d.length; this.totalDown += d.length; c.last = Date.now(); if (!client.write(d)) up.pause() })
      client.on('drain', () => up.resume())
    })
    up.on('error', done); client.on('error', done)
    up.on('close', done); client.on('close', done)
  }

  block (ip, on) {
    if (on) {
      this.blocked.add(ip)
      const s = this.active.get(ip)
      if (s) for (const sock of [...s]) { try { sock.destroy() } catch (e) {} }
    } else {
      this.blocked.delete(ip)
    }
  }

  rename (ip, name) { if (name) this.names[ip] = name; else delete this.names[ip] }

  snapshot () {
    const clients = []
    for (const c of this.clients.values()) {
      clients.push({
        ip: c.ip,
        hostname: c.hostname,
        name: this.names[c.ip] || '',
        active: c.active,
        total_conns: c.total,
        up: c.up,
        down: c.down,
        up_rate: c.up_rate,
        down_rate: c.down_rate,
        blocked: this.blocked.has(c.ip),
        first_seen: c.first / 1000,
        last_seen: c.last / 1000
      })
    }
    return {
      started: this.started / 1000,
      listen_port: this.listenPort,
      upstream: `${this.upHost}:${this.upPort}`,
      total_up: this.totalUp,
      total_down: this.totalDown,
      total_conns: this.totalConns,
      clients
    }
  }

  close () { try { clearInterval(this._sampler) } catch (e) {}; try { this.server && this.server.close() } catch (e) {} }
}

module.exports = { Engine }
