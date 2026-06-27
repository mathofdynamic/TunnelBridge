import React, { useEffect, useRef, useState } from 'react'

/* ---------- Persian digits ---------- */
const FA = '۰۱۲۳۴۵۶۷۸۹'
const fa = (v) => String(v).replace(/[0-9]/g, d => FA[d])

/* ---------- formatting helpers (Persian output) ---------- */
const fmtB = (n) => { n = +n || 0; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++ } return fa(i ? n.toFixed(1) : Math.round(n)) + ' ' + u[i] }
const rate = (n) => fmtB(n) + '/ث'
const dur = (s) => {
  s = Math.floor(Math.max(0, s))
  const d = Math.floor(s / 86400); const h = Math.floor(s % 86400 / 3600); const m = Math.floor(s % 3600 / 60); const x = s % 60
  const pad = (n) => fa(String(n).padStart(2, '0'))
  const clock = pad(h) + ':' + pad(m) + ':' + pad(x)
  return d > 0 ? fa(d) + ' روز ' + clock : clock
}
const hue = (ip) => { let h = 0; for (const c of ip) h = (h * 31 + c.charCodeAt(0)) % 360; return h }

const api = (typeof window !== 'undefined' && window.mamali) ? window.mamali : null

/* ---------- canvas: smooth path ---------- */
function smoothPath (ctx, pts) {
  if (pts.length < 2) return
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[i + 2] || p2
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1])
  }
}

/* chart colors: upload = silver, download = blue */
const C_UP = '#cdd3dc'; const C_DN = '#3b82f6'

export default function App () {
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState({ myIp: '…', listenPort: 1081, upstream: '127.0.0.1:1080', version: '1.0.0' })
  const [names, setNames] = useState({})
  const [blockedLocal, setBlockedLocal] = useState({})
  const [toast, setToast] = useState('')
  const [clock, setClock] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [cfg, setCfg] = useState({ upstreamHost: '127.0.0.1', upstreamPort: 1080, listenPort: 1081 })
  const [detecting, setDetecting] = useState(false)

  const upH = useRef([]); const dnH = useRef([]); const N = 60
  const sparks = useRef({})
  const peak = useRef({ u: 0, d: 0 })
  const disp = useRef({})
  const target = useRef({ upNow: 0, dnNow: 0, kActive: 0, kConns: 0, kData: 0 })
  const lastSec = useRef(0)

  const R = { upNow: useRef(), dnNow: useRef(), kActive: useRef(), kConns: useRef(), kData: useRef() }
  const chartRef = useRef(); const heroRef = useRef()
  const sparkEls = useRef({})

  /* ---------- polling ---------- */
  useEffect(() => {
    let alive = true
    if (api) api.meta().then(m => alive && setMeta(m))
    const pull = async () => {
      let d
      try { d = api ? await api.getStats() : null } catch (e) { d = null }
      if (!d || !alive) return
      setStats(d)
      let ur = 0; let dr = 0; let act = 0
      d.clients.forEach(c => { ur += (c.up_rate || 0); dr += (c.down_rate || 0); act += c.active })
      target.current.upNow = ur; target.current.dnNow = dr
      target.current.kActive = d.clients.filter(c => c.active > 0).length
      target.current.kConns = act
      target.current.kData = d.total_up + d.total_down
      peak.current.u = Math.max(peak.current.u, ur); peak.current.d = Math.max(peak.current.d, dr)
      const now = Date.now() / 1000
      if (now - lastSec.current >= 0.95) {
        lastSec.current = now
        upH.current.push(ur); dnH.current.push(dr)
        if (upH.current.length > N) upH.current.shift()
        if (dnH.current.length > N) dnH.current.shift()
        d.clients.forEach(c => {
          const s = sparks.current[c.ip] || (sparks.current[c.ip] = [])
          s.push((c.up_rate || 0) + (c.down_rate || 0)); if (s.length > 24) s.shift()
        })
      }
    }
    pull()
    const iv = setInterval(pull, 1000)
    const ck = setInterval(() => setClock(fa(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))), 1000)
    return () => { alive = false; clearInterval(iv); clearInterval(ck) }
  }, [])

  /* ---------- animation ---------- */
  useEffect(() => {
    let raf
    const ease = (key, fmt) => {
      const to = target.current[key] || 0
      const cur = disp.current[key] ?? to
      const nx = cur + (to - cur) * 0.22
      disp.current[key] = nx
      const el = R[key].current
      if (el) el.innerHTML = fmt(nx)
    }
    const sizeFor = (cv) => { const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; if (cv.width !== Math.round(r.width * dpr)) { cv.width = r.width * dpr; cv.height = r.height * dpr } return { r, dpr } }

    const drawMain = () => {
      const cv = chartRef.current; if (!cv) return
      const { r, dpr } = sizeFor(cv); const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const W = r.width; const H = r.height; const pad = 8
      ctx.clearRect(0, 0, W, H)
      const max = Math.max(1, ...upH.current, ...dnH.current) * 1.18
      ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1
      for (let i = 0; i <= 3; i++) { const y = pad + (H - 2 * pad) * i / 3; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      const series = (arr, col, c1, c2) => {
        if (arr.length < 2) return
        const step = W / Math.max(1, arr.length - 1)
        const pts = arr.map((v, i) => [i * step, pad + (H - 2 * pad) * (1 - v / max)])
        ctx.beginPath(); smoothPath(ctx, pts); ctx.lineTo(pts[pts.length - 1][0], H); ctx.lineTo(pts[0][0], H); ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); smoothPath(ctx, pts); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.shadowColor = col; ctx.shadowBlur = col === C_DN ? 14 : 6; ctx.stroke(); ctx.shadowBlur = 0
        const last = pts[pts.length - 1]
        ctx.beginPath(); ctx.arc(last[0], last[1], 3.4, 0, 7); ctx.fillStyle = col; ctx.fill()
        ctx.beginPath(); ctx.arc(last[0], last[1], 6, 0, 7); ctx.fillStyle = col + '33'; ctx.fill()
      }
      series(dnH.current, C_DN, 'rgba(59,130,246,.32)', 'rgba(59,130,246,0)')
      series(upH.current, C_UP, 'rgba(205,211,220,.20)', 'rgba(205,211,220,0)')
    }
    const drawHero = () => {
      const cv = heroRef.current; if (!cv) return
      const { r, dpr } = sizeFor(cv); const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height)
      const a = upH.current.map((u, i) => u + (dnH.current[i] || 0)); if (a.length < 2) return
      const max = Math.max(1, ...a) * 1.15; const step = r.width / Math.max(1, a.length - 1)
      const pts = a.map((v, i) => [i * step, 2 + (r.height - 4) * (1 - v / max)])
      ctx.beginPath(); smoothPath(ctx, pts); ctx.lineTo(pts[pts.length - 1][0], r.height); ctx.lineTo(pts[0][0], r.height); ctx.closePath()
      const g = ctx.createLinearGradient(0, 0, r.width, 0); g.addColorStop(0, 'rgba(205,211,220,.16)'); g.addColorStop(1, 'rgba(59,130,246,.20)'); ctx.fillStyle = g; ctx.fill()
      ctx.beginPath(); smoothPath(ctx, pts); const g2 = ctx.createLinearGradient(0, 0, r.width, 0); g2.addColorStop(0, C_UP); g2.addColorStop(1, C_DN); ctx.strokeStyle = g2; ctx.lineWidth = 1.8; ctx.stroke()
    }
    const drawSparks = () => {
      for (const ip in sparkEls.current) {
        const cv = sparkEls.current[ip]; if (!cv) continue
        const s = sparks.current[ip]; if (!s || s.length < 2) continue
        const { r, dpr } = sizeFor(cv); const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height)
        const max = Math.max(1, ...s); const step = r.width / Math.max(1, s.length - 1)
        const live = (s[s.length - 1] || 0) > 1
        ctx.beginPath(); s.forEach((v, i) => { const x = i * step; const y = r.height - 2 - (r.height - 4) * (v / max); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
        ctx.strokeStyle = live ? C_DN : '#566173'; ctx.lineWidth = 1.5; ctx.stroke()
      }
    }
    const tick = () => {
      ease('upNow', v => fmtB(v) + '<small> /ث</small>')
      ease('dnNow', v => fmtB(v) + '<small> /ث</small>')
      ease('kActive', v => fa(Math.round(v)))
      ease('kConns', v => fa(Math.round(v)))
      ease('kData', v => { const s = fmtB(v).split(' '); return s[0] + '<span class="unit"> ' + s[1] + '</span>' })
      drawMain(); drawHero(); drawSparks()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* open settings automatically when launched with ?settings (used for previews) */
  useEffect(() => { try { if (new URLSearchParams(location.search).has('settings')) openSettings() } catch (e) {} }, [])

  /* ---------- actions ---------- */
  const showToast = (t) => { setToast(t); clearTimeout(showToast._t); showToast._t = setTimeout(() => setToast(''), 1800) }
  const copyAddr = async () => { const t = (stats?.my_ip || meta.myIp) + ':' + (stats?.listen_port || meta.listenPort); if (api) await api.copy(t); showToast('کپی شد  ' + t) }
  const commitName = (ip, val) => { const v = (val || '').trim(); setNames(n => ({ ...n, [ip]: v })); if (api) api.rename(ip, v) }
  const toggleBlock = (ip, on) => { setBlockedLocal(b => ({ ...b, [ip]: on })); if (api) api.block(ip, on); showToast(on ? 'دستگاه مسدود شد' : 'مسدودی برداشته شد') }
  const openSettings = async () => { if (api) { try { const c = await api.getConfig(); setCfg(c) } catch (e) {} } setShowSettings(true) }
  const saveSettings = async () => { if (api) { await api.setConfig(cfg); api.meta().then(setMeta) } setShowSettings(false); showToast('تنظیمات ذخیره شد') }
  const autoDetect = async () => { setDetecting(true); try { if (api) { const r = await api.detectProxy(); if (r && r.ok) { setCfg(c => ({ ...c, upstreamHost: r.host, upstreamPort: r.port })); api.meta().then(setMeta); showToast('پروکسی پیدا شد · پورت ' + fa(r.port)) } else showToast('پروکسی‌ای پیدا نشد') } } catch (e) {} setDetecting(false) }

  /* ---------- derived ---------- */
  const clients = (stats?.clients || []).slice().sort((a, b) => b.last_seen - a.last_seen)
  const onlineCount = clients.filter(c => c.active > 0).length
  const ex = stats?.exit
  const myIp = stats?.my_ip || meta.myIp
  const port = stats?.listen_port || meta.listenPort
  const exitText = ex
    ? (ex.status === 'ok' ? ((ex.city ? ex.city + '، ' : '') + (ex.region || ex.country)) : (ex.status === 'locating' ? 'در حال یافتن…' : 'نامشخص'))
    : 'در حال یافتن…'

  return (
    <>
      <div className="bg" /><div className="aurora a1" /><div className="aurora a2" /><div className="aurora a3" /><div className="grain" />

      {/* native frameless titlebar (controls stay top-right) */}
      <div className="titlebar">
        <div className="tb-brand"><span className="tb-dot" /> TunnelBridge</div>
        <div className="tb-spacer" />
        <button className="winbtn" onClick={openSettings} title="تنظیمات">⚙</button>
        <button className="winbtn" onClick={() => api && api.minimize()} title="کوچک کردن">─</button>
        <button className="winbtn close" onClick={() => api && api.close()} title="بستن">✕</button>
      </div>

      <div className="wrap">
        {/* header */}
        <div className="top reveal">
          <div className="brand">
            <div className="mark" dir="ltr"><b>Tunnel</b><i>Bridge</i></div>
            <div className="tagline">اشتراک امن شبکه با دستگاه‌های شما</div>
          </div>
          <div className="status">
            <div className="pill"><span className={'led' + (stats ? '' : ' off')} /><span>{stats ? 'در حال اشتراک' : 'در حال شروع'}</span></div>
            <div className="clock">{clock}</div>
          </div>
        </div>

        {/* no-proxy banner */}
        {meta.detected === false && (
          <div className="banner reveal">
            <span>⚠ هیچ پروکسی VPN روی این رایانه پیدا نشد — مطمئن شوید VPN روشن است.</span>
            <button className="btn ghost" onClick={openSettings}>تنظیمات و تشخیص خودکار</button>
          </div>
        )}

        {/* hero */}
        <div className="hero">
          <div className="panel reveal" style={{ animationDelay: '.05s' }}>
            <div className="pad">
              <div className="eyebrow">آدرس پروکسی گوشی</div>
              <div className="addr">
                <div className="ltr"><span className="ip">{myIp}</span><span className="colon">:</span><span className="port">{port}</span></div>
                <button className="copy" onClick={copyAddr}>⧉ کپی</button>
              </div>
              <div className="metaRow">
                <div className="chip">نوع <b>SOCKS5 · HTTP</b></div>
                <div className="chip"><span className="flag">{ex && ex.flag ? ex.flag : '🌎'}</span> خروجی <b>{exitText}</b></div>
                <div className="chip">سرور <b dir="ltr">{stats?.upstream || meta.upstream}</b></div>
              </div>
            </div>
          </div>

          <div className="panel reveal" style={{ animationDelay: '.1s' }}>
            <div className="pad tp">
              <div className="eyebrow">پهنای باند زنده</div>
              <div className="tpNow">
                <div className="tpCol up"><div className="lab"><span className="dot" style={{ background: 'var(--acc)' }} />آپلود</div>
                  <div className="val" ref={R.upNow}>۰<small> /ث</small></div>
                  <div className="peak">اوج <b>{rate(peak.current.u)}</b></div></div>
                <div className="tpCol dn"><div className="lab"><span className="dot" style={{ background: 'var(--dn)' }} />دانلود</div>
                  <div className="val" ref={R.dnNow}>۰<small> /ث</small></div>
                  <div className="peak">اوج <b>{rate(peak.current.d)}</b></div></div>
              </div>
              <canvas id="heroSpark" ref={heroRef} />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpis">
          <div className="panel kpi reveal" style={{ animationDelay: '.12s' }}><div className="k">دستگاه‌های فعال</div><div className="v" ref={R.kActive}>۰</div><div className="sub">{fa(clients.length)} دستگاه · {fa(stats?.total_conns || 0)} اتصال</div></div>
          <div className="panel kpi reveal" style={{ animationDelay: '.16s' }}><div className="k">اتصالات باز</div><div className="v" ref={R.kConns}>۰</div><div className="sub">تونل‌های فعال</div></div>
          <div className="panel kpi reveal" style={{ animationDelay: '.2s' }}><div className="k">مصرف این نشست</div><div className="v" ref={R.kData}>۰</div><div className="sub"><span dir="ltr">↑{fmtB(stats?.total_up || 0)} ↓{fmtB(stats?.total_down || 0)}</span></div></div>
          <div className="panel kpi reveal" style={{ animationDelay: '.24s' }}><div className="k">مدت فعالیت</div><div className="v">{stats ? dur(Date.now() / 1000 - stats.started) : '۰ث'}</div><div className="sub">از زمان اجرا</div></div>
        </div>

        {/* chart */}
        <div className="panel reveal" style={{ animationDelay: '.28s' }}>
          <div className="pad">
            <div className="chartHead">
              <div className="eyebrow" style={{ marginBottom: 0 }}>پهنای باند · ۶۰ ثانیه اخیر</div>
              <div className="legend">
                <span><span className="dot" style={{ background: 'var(--acc)' }} />آپلود</span>
                <span><span className="dot" style={{ background: 'var(--dn)' }} />دانلود</span>
              </div>
            </div>
            <canvas id="chart" ref={chartRef} />
          </div>
        </div>

        {/* devices */}
        <div className="devHead">
          <h2>دستگاه‌های متصل</h2>
          <div className="count">{fa(onlineCount)} متصل</div>
        </div>
        <div className="devices">
          {clients.length === 0 && <div className="empty">هنوز دستگاهی متصل نشده — گوشی را به وای‌فای وصل کنید و پروکسی بالا را تنظیم کنید.</div>}
          {clients.map(c => {
            const h = hue(c.ip)
            const blk = (c.ip in blockedLocal) ? blockedLocal[c.ip] : c.blocked
            const nm = (c.ip in names) ? names[c.ip] : (c.name || c.hostname || c.ip)
            const display = nm || c.hostname || c.ip
            const live = c.active > 0
            const tot = c.up + c.down; const frac = Math.min(1, c.down / (tot || 1))
            return (
              <div className={'dev' + (blk ? ' blocked' : '')} key={c.ip}>
                <div className="avatar" style={{ background: `linear-gradient(135deg,hsl(${h} 60% 62%),hsl(${(h + 40) % 360} 60% 56%))`, color: `hsl(${h} 60% 62%)` }}>
                  <span style={{ color: '#06080d' }}>{(display[0] || '?').toUpperCase()}</span><div className="ring" />
                </div>
                <div>
                  <div className="dname"><span className={'livedot' + (live ? '' : ' idle')} />
                    <input className="nameInput" defaultValue={display} spellCheck={false}
                      onBlur={e => commitName(c.ip, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }} />
                  </div>
                  <div className="dip">{c.ip}{c.hostname && c.hostname !== display ? ' · ' + c.hostname : ''}</div>
                </div>
                <div className="cell"><div className="t">اتصالات</div><div className="b">{fa(c.active)} <span style={{ color: 'var(--faint)' }}>/ {fa(c.total_conns)}</span></div></div>
                <div className="cell used"><div className="t">مصرف داده</div><div className="b">{fmtB(c.up + c.down)}</div><div className="bar"><i style={{ width: Math.max(4, frac * 100) + '%' }} /></div></div>
                <div className="cell"><div className="t">سرعت</div><div className="spd"><span className="u">↑{rate(c.up_rate || 0)}</span><span className="d">↓{rate(c.down_rate || 0)}</span></div>
                  <canvas className="spark" ref={el => { if (el) sparkEls.current[c.ip] = el }} /></div>
                <div className="act">
                  <button className="iconbtn danger block" title={blk ? 'برداشتن مسدودی' : 'مسدود کردن دستگاه'} onClick={() => toggleBlock(c.ip, !blk)}>{blk ? '↺' : '⊘'}</button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="foot reveal">
          <div>TunnelBridge — همه‌چیز محلی است؛ هیچ داده‌ای از این دستگاه خارج نمی‌شود</div>
          <div>نسخه {fa(meta.version)}</div>
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) setShowSettings(false) }}>
          <div className="modal reveal">
            <div className="modal-head"><h3>تنظیمات</h3><button className="iconbtn" onClick={() => setShowSettings(false)}>✕</button></div>
            <div className="field">
              <label>پورت پروکسی VPN روی این رایانه</label>
              <div className="row">
                <input dir="ltr" value={cfg.upstreamPort} onChange={e => setCfg({ ...cfg, upstreamPort: e.target.value.replace(/[^0-9]/g, '') })} />
                <button className="btn ghost" onClick={autoDetect} disabled={detecting}>{detecting ? 'در حال جستجو…' : 'تشخیص خودکار'}</button>
              </div>
            </div>
            <div className="field">
              <label>آدرس سرور پروکسی</label>
              <input dir="ltr" value={cfg.upstreamHost} onChange={e => setCfg({ ...cfg, upstreamHost: e.target.value })} />
            </div>
            <div className="field">
              <label>پورت اشتراک (روی گوشی همین را وارد کنید)</label>
              <input dir="ltr" value={cfg.listenPort} onChange={e => setCfg({ ...cfg, listenPort: e.target.value.replace(/[^0-9]/g, '') })} />
            </div>
            <div className="hint">اگر از VPN دیگری استفاده می‌کنید، روی «تشخیص خودکار» بزنید تا پورت آن به‌صورت خودکار پیدا شود.</div>
            <div className="modal-actions">
              <button className="btn" onClick={saveSettings}>ذخیره و اعمال</button>
              <button className="btn ghost" onClick={() => setShowSettings(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </>
  )
}
