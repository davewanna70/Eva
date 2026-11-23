"use client"
import { useState, useEffect, useRef } from "react"

const P = 'M50,0 C70,40 100,90 100,140 C100,180 80,210 50,210 C20,210 0,180 0,140 C0,90 30,40 50,0 Z'
const T = 'translate(5,10.5) scale(.9)'

type Chat = { name: string; msg: string; time: string; ring: 'new' | 'seen' | 'none'; type: 'none' | 'photo' | 'live'; src?: string; start?: number }
type Me = { type: 'none' | 'photo' | 'live'; src?: string; start?: number }

const INITIAL_CHATS: Chat[] = [
  { name: 'Ann', msg: 'Wetin dey happen?', time: '11:40', ring: 'new', type: 'photo', src: 'images/ann.jpg' },
  { name: 'My Dera', msg: 'I don see am 😂', time: '10:12', ring: 'seen', type: 'photo', src: 'images/dera.jpg' },
  { name: 'Aki', msg: 'Live sticker profile', time: 'Yesterday', ring: 'none', type: 'live', src: 'stickers/aki.mp4' },
  { name: 'Pawpaw', msg: 'Hello', time: 'Yesterday', ring: 'none', type: 'none' },
]
const STICKERS = [
  { name: 'Aki', src: 'stickers/aki.mp4', e: '😎' },
  { name: 'Pawpaw', src: 'stickers/pawpaw.mp4', e: '🐶' },
]

let uid = 0
function Droplet({ o, w = 46, onClick }: { o: Chat | Me & { name?: string; ring?: string }; w?: number; onClick?: (e: any) => void }) {
  const n = ++uid
  // use stable id per render - we use useRef style id via n, for React we need unique per instance, this is ok for static list
  const ring = (o as any).ring === 'new' ? 'ring-unwatched' : (o as any).ring === 'seen' ? 'ring-watched' : ''
  const type = (o as any).type || 'none'
  const src = (o as any).src
  const start = (o as any).start || 0
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v || type !== 'live' || !src) return
    let raf = 0
    const go = () => {
      if (!v.isConnected) return
      const end = Math.min(start + 7, v.duration || start + 7)
      if (v.currentTime >= end - 0.04 || v.currentTime < start - 0.1) v.currentTime = start
      if (v.paused && v.isConnected) v.play().catch(() => {})
      raf = requestAnimationFrame(go)
    }
    const onMeta = () => { v.currentTime = start }
    v.addEventListener('loadedmetadata', onMeta)
    raf = requestAnimationFrame(go)
    return () => { cancelAnimationFrame(raf); v.removeEventListener('loadedmetadata', onMeta) }
  }, [src, type, start])

  return (
    <span style={{ display: 'block', width: w }} onClick={onClick}>
      <svg className="drop" viewBox="-6 -4 112 218" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`rg${n}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff2f4d" /><stop offset="1" stopColor="#8a2be2" /></linearGradient>
          <radialGradient id={`gl${n}`} cx=".4" cy=".6" r=".7"><stop offset="0" stopColor="#6aa0ff" stopOpacity=".06" /><stop offset=".75" stopColor="#143070" stopOpacity=".10" /><stop offset="1" stopColor="#9fd0ff" stopOpacity=".40" /></radialGradient>
          <clipPath id={`c${n}`}><path d={P} /></clipPath>
        </defs>
        {ring && <path className={ring} d={P} fill="none" strokeWidth={(o as any).ring === 'new' ? 4.5 : 3} stroke={ (o as any).ring === 'new' ? `url(#rg${n})` : undefined} style={ring === 'ring-unwatched' ? { filter: 'drop-shadow(0 0 5px #ff2f6d) drop-shadow(0 0 10px #8a2be2)' } : ring === 'ring-watched' ? { stroke: '#7a5560', opacity: .55 } : {}} />}
        <g transform={T}>
          <g clipPath={`url(#c${n})`}>
            {type === 'photo' && src && <image href={src} x={0} y={0} width={100} height={210} preserveAspectRatio="xMidYMid slice" />}
            {type === 'live' && src && (
              <foreignObject x="0" y="0" width="100" height="210">
                <video ref={videoRef} muted playsInline autoPlay src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </foreignObject>
            )}
            {type === 'none' && <rect x="0" y="0" width="100" height="210" fill="#1a1f4a" />}
          </g>
          <path d={P} fill={`url(#gl${n})`} stroke="rgba(255,255,255,.55)" strokeWidth="1.4" />
          <path d="M24,125 C20,100 36,64 47,32 C36,70 31,100 33,130 Z" fill="#fff" opacity=".32" />
          <path d="M22,160 C28,190 48,200 70,196" fill="none" stroke="#bfe0ff" strokeWidth="2" opacity=".45" strokeLinecap="round" />
          <path d="M78,120 C84,140 82,160 74,176" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".25" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  )
}

export default function ChatPage() {
  const [me, setMe] = useState<Me>({ type: 'none' })
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS)
  const [tab, setTab] = useState<'chat' | 'check' | 'call'>('chat')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [selected, setSelected] = useState<Chat | null>(null)
  const [openChat, setOpenChat] = useState<Chat | null>(null)
  const [toast, setToast] = useState('')
  const [trimUrl, setTrimUrl] = useState(''); const [trimDur, setTrimDur] = useState(0); const [trimStart, setTrimStart] = useState(0)
  const galleryRef = useRef<HTMLInputElement>(null); const photoRef = useRef<HTMLInputElement>(null)
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const close = () => setOverlay(null)
  const setLive = (src: string, start: number) => { setMe({ type: 'live', src, start }); close(); setTab('chat'); showToast('Live sticker set ✔') }

  const handleGallery = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    const t = document.createElement('video'); t.src = url; t.preload = 'metadata'
    t.onloadedmetadata = () => { if (t.duration <= 7.05) setLive(url, 0); else { setTrimUrl(url); setTrimDur(t.duration); setTrimStart(0); setOverlay('trim') } }
    e.target.value = ''
  }
  const handlePhoto = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    setMe({ type: 'photo', src: URL.createObjectURL(f) }); e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#050520', color: '#fff', fontFamily: 'system-ui,Arial' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        #screen{flex:1;overflow-y:auto;padding-bottom:10px}
        #nav{display:flex;background:#0b0e24;border-top:1px solid #1b1f3d;padding-bottom:env(safe-area-inset-bottom)}
        #nav button{flex:1;background:none;border:0;color:#8a8fb0;padding:10px 0;font-size:14px}
        #nav button span{display:block;font-size:22px}
        #nav button.on{color:#ff3b6b}
        .drop{display:block;overflow:visible;background:none}
        .hero{display:flex;flex-direction:column;align-items:center;padding:14px 0 6px}
        .hero-btns{display:flex;gap:10px;margin-top:8px}
        .hero-btns button{background:#14183a;color:#cfd3ff;border:1px solid #2a2f5c;border-radius:20px;padding:7px 14px;font-size:13px}
        .hero-label{font-size:12px;color:#8a8fb0;margin-top:6px}
        .row{display:flex;align-items:center;gap:14px;padding:10px 18px}
        .row .info{flex:1;min-width:0;cursor:pointer}
        .row .name{font-weight:600;font-size:16px}
        .row .sub{font-size:13px;color:#8a8fb0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .row .time{font-size:12px;color:#8a8fb0}
        .section{padding:10px 18px 4px;font-size:13px;color:#8a8fb0}
        #overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;justify-content:center;align-items:flex-start;padding-top:70px;z-index:10}
        #overlay.sheet{align-items:flex-end;padding-top:0}
        .popup{background:#0e1230;border:1px solid #23284f;border-radius:18px;padding:16px;width:260px;text-align:center}
        .popup .pname{font-weight:700;margin-bottom:12px}
        .icons{display:flex;justify-content:space-between}
        .icons button{background:#171c46;border:0;color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px}
        .icons button.plus{color:#ff3b6b;font-weight:700}
        .sheetbox{background:#0e1230;width:100%;border-radius:20px 20px 0 0;padding:18px;max-height:88vh;overflow-y:auto}
        .sheetbox h3{margin-bottom:12px}
        .big{display:block;width:100%;background:#171c46;border:0;color:#fff;padding:14px;border-radius:12px;font-size:16px;margin-bottom:10px;text-align:left}
        .pri{background:linear-gradient(90deg,#ff2f6d,#8a2be2)}
        .vid{width:100%;max-height:300px;border-radius:12px;background:#000;margin-bottom:10px}
        .range{width:100%;margin:8px 0}
        .small{font-size:13px;color:#8a8fb0;margin-bottom:8px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .grid button{background:#171c46;border:0;color:#fff;border-radius:12px;padding:12px 4px;font-size:13px}
        .grid button b{display:block;font-size:30px}
        #toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#ff2f6d;padding:10px 16px;border-radius:20px;font-size:14px;z-index:20}
        .chathead{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#0b0e24}
        .chathead .back{background:none;border:0;color:#fff;font-size:24px}
        .msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;height:calc(100vh - 150px)}
        .b{max-width:78%;padding:8px 12px;border-radius:14px;font-size:15px}
        .b small{display:block;text-align:right;font-size:11px;opacity:.7;margin-top:2px}
        .in{background:#1a1f4a;align-self:flex-start}
        .out{background:#6a2a8f;align-self:flex-end}
        .bar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0b0e24}
        .bar input{flex:1;background:#171c46;border:0;border-radius:22px;padding:11px 14px;color:#fff;font-size:15px}
        .bar button{background:none;border:0;font-size:22px;color:#cfd3ff}
      `}</style>

      {!openChat && <header style={{ padding: '16px 18px', fontSize: 22, fontWeight: 700, background: '#080b1c' }}>EVA Chat</header>}
      <main id="screen" style={{ flex: 1, overflowY: 'auto' }}>
        {openChat ? (
          <>
            <div className="chathead">
              <button className="back" onClick={() => setOpenChat(null)}>←</button>
              <Droplet o={{ ...openChat, ring: 'none' }} w={36} />
              <div><b>{openChat.name}</b></div>
            </div>
            <div className="msgs">
              <div className="b in">Boss how far?<small>11:30</small></div>
              <div className="b out">I dey. Wetin dey?<small>11:31 ✓✓</small></div>
              <div className="b in">{openChat.msg}<small>{openChat.time}</small></div>
            </div>
            <div className="bar"><button>😊</button><input placeholder="Message..." /><button>📎</button><button>📷</button><button>🎤</button></div>
          </>
        ) : tab === 'chat' ? (
          <>
            <div className="hero">
              <div style={{ width: 150 }}><Droplet o={{ ...me, name: 'You', ring: 'none' } as any} w={150} onClick={() => { setSelected({ name: 'You', msg: '', time: '', ring: 'none', type: me.type, src: me.src } as any); setOverlay('popup') }} /></div>
              <div className="hero-label">{me.type === 'none' ? 'Empty droplet' : me.type === 'photo' ? 'Photo profile (stays still)' : 'Live sticker (7 sec loop)'}</div>
              <div className="hero-btns">
                <button onClick={() => { if (me.type === 'live') return showToast('Remove live sticker first'); photoRef.current?.click() }}>Add photo</button>
                <button onClick={() => setMe({ type: 'none' })}>Remove</button>
              </div>
            </div>
            {chats.map((c, i) => (
              <div key={i} className="row">
                <Droplet o={c} w={46} onClick={(e) => { e.stopPropagation(); setSelected(c); setOverlay('popup') }} />
                <div className="info" onClick={() => setOpenChat(c)}><div className="name">{c.name}</div><div className="sub">{c.msg}</div></div>
                <div className="time">{c.time}</div>
              </div>
            ))}
          </>
        ) : tab === 'check' ? (
          <>
            <div className="section">Recent Checks</div>
            {chats.filter(c => c.ring !== 'none').map((c, i) => (
              <div key={i} className="row" onClick={() => { setChats(prev => prev.map(x => x.name === c.name ? { ...x, ring: 'seen' as const } : x)); showToast('Check viewed'); }}>
                <Droplet o={c} w={46} /><div className="info"><div className="name">{c.name}</div><div className="sub">{c.ring === 'new' ? 'New check' : 'Viewed'}</div></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="section">Recent Calls</div>
            {chats.map((c, i) => (
              <div key={i} className="row"><Droplet o={{ ...c, ring: 'none' }} w={46} /><div className="info"><div className="name">{c.name}</div><div className="sub">↗ Today, 9:20</div></div><div className="time">📞</div></div>
            ))}
          </>
        )}
      </main>

      {!openChat && (
        <nav id="nav">
          <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}><span>💬</span>Chat</button>
          <button className={tab === 'check' ? 'on' : ''} onClick={() => setTab('check')}><span>✔</span>Check</button>
          <button className={tab === 'call' ? 'on' : ''} onClick={() => setTab('call')}><span>📞</span>Call</button>
        </nav>
      )}

      {overlay === 'popup' && selected && (
        <div id="overlay" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="popup">
            <div style={{ display: 'flex', justifyContent: 'center' }}><Droplet o={{ ...selected, ring: 'none' }} w={90} /></div>
            <div className="pname">{selected.name}</div>
            <div className="icons">
              <button onClick={() => { close(); if (selected.name === 'You') showToast('This is you'); else setOpenChat(selected as Chat) }}>💬</button>
              <button onClick={() => { close(); showToast('Voice call ' + selected.name) }}>📞</button>
              <button className="plus" onClick={() => setOverlay('plus')}>＋</button>
              <button onClick={() => { close(); showToast('Video call ' + selected.name) }}>🎥</button>
            </div>
          </div>
        </div>
      )}

      {overlay === 'plus' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>EVA Live Profile</h3>
            <button className="big" onClick={() => setOverlay('upload')}>⬆️ Upload</button>
            <button className="big" onClick={() => showToast('Record coming - use Upload for now')}>🎬 Record</button>
          </div>
        </div>
      )}
      {overlay === 'upload' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>Upload</h3>
            <button className="big" onClick={() => { if (me.type === 'photo') { setOverlay('guard') } else { close(); galleryRef.current?.click() } }}>🖼️ Gallery</button>
            <button className="big" onClick={() => { if (me.type === 'photo') setOverlay('guard'); else setOverlay('stickers') }}>✨ Live Stickers</button>
          </div>
        </div>
      )}
      {overlay === 'guard' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>Remove photo first</h3><p className="small">You cannot have photo and live sticker at the same time.</p>
            <button className="big pri" onClick={() => { setMe({ type: 'none' }); setOverlay('upload') }}>Remove photo</button>
          </div>
        </div>
      )}
      {overlay === 'stickers' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>Live Stickers</h3><p className="small">All max 7 sec, all loop</p><div className="grid">
            {STICKERS.map((s, i) => <button key={i} onClick={() => setLive(s.src, 0)}><b>{s.e}</b>{s.name}</button>)}
          </div></div>
        </div>
      )}
      {overlay === 'trim' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>Trim to 7 seconds</h3>
            <video className="vid" muted playsInline autoPlay src={trimUrl} />
            <div className="small">00:{String(Math.floor(trimStart)).padStart(2, '0')} - 00:{String(Math.floor(trimStart + 7)).padStart(2, '0')}</div>
            <input className="range" type="range" min="0" max={Math.max(0, trimDur - 7)} step="0.1" value={trimStart} onChange={e => setTrimStart(+e.target.value)} />
            <button className="big pri" onClick={() => setLive(trimUrl, trimStart)}>Upload</button>
          </div>
        </div>
      )}

      <input ref={galleryRef} type="file" accept="video/*" hidden onChange={handleGallery} />
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
      {toast && <div id="toast">{toast}</div>}
    </div>
  )
}
