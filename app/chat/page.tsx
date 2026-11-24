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

let uidCounter = 0
function Droplet({ o, w = 46, onClick, muted = true }: { o: any; w?: number; onClick?: (e: any) => void; muted?: boolean }) {
  const idRef = useRef(0)
  if (idRef.current === 0) { uidCounter += 1; idRef.current = uidCounter }
  const n = idRef.current
  const ring = o.ring === 'new' ? 'ring-unwatched' : o.ring === 'seen' ? 'ring-watched' : ''
  const type = o.type || 'none'
  const src = o.src
  const start = o.start || 0
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

  useEffect(() => {
    const v = videoRef.current
    if (v) v.muted = muted
  }, [muted])

  return (
    <span style={{ display: 'block', width: w }} onClick={onClick}>
      <svg className="drop" viewBox="-6 -4 112 218" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`rg${n}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff2f4d" /><stop offset="1" stopColor="#8a2be2" /></linearGradient>
          <radialGradient id={`gl${n}`} cx=".4" cy=".6" r=".7"><stop offset="0" stopColor="#6aa0ff" stopOpacity=".06" /><stop offset=".75" stopColor="#143070" stopOpacity=".10" /><stop offset="1" stopColor="#9fd0ff" stopOpacity=".40" /></radialGradient>
          <clipPath id={`c${n}`}><path d={P} /></clipPath>
        </defs>
        {ring && <path d={P} fill="none" strokeWidth={o.ring === 'new' ? 4.5 : 3} stroke={o.ring === 'new' ? `url(#rg${n})` : '#7a5560'} opacity={o.ring === 'seen' ? .55 : 1} style={o.ring === 'new' ? { filter: 'drop-shadow(0 0 5px #ff2f6d) drop-shadow(0 0 10px #8a2be2)' } : {}} />}
        <g transform={T}>
          <g clipPath={`url(#c${n})`}>
            {type === 'photo' && src && <image href={src} x={0} y={0} width={100} height={210} preserveAspectRatio="xMidYMid slice" />}
            {type === 'live' && src && (
              <foreignObject x="0" y="0" width="100" height="210">
                <video ref={videoRef} muted={muted} playsInline autoPlay src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
  const [fullView, setFullView] = useState<any | null>(null)
  const [fullMuted, setFullMuted] = useState(true)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordUrl, setRecordUrl] = useState('')
  const galleryRef = useRef<HTMLInputElement>(null); const photoRef = useRef<HTMLInputElement>(null)
  const fullVideoRef = useRef<HTMLVideoElement>(null)

  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchFilter, setSearchFilter] = useState<'all' | 'unread' | 'photo' | 'live'>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const close = () => { setOverlay(null); setShowPlusMenu(false) }
  const setLive = (src: string, start: number) => { setMe({ type: 'live', src, start }); close(); setTab('chat'); setFullView(null); showToast('Live sticker set ✔') }

  useEffect(() => {
    const v = fullVideoRef.current
    if (!v || !fullView || fullView.type !== 'live') return
    let raf = 0
    const start = fullView.start || 0
    const go = () => {
      if (!v.isConnected) return
      const end = Math.min(start + 7, v.duration || start + 7)
      if (v.currentTime >= end - 0.04 || v.currentTime < start - 0.1) v.currentTime = start
      if (v.paused) v.play().catch(() => {})
      raf = requestAnimationFrame(go)
    }
    const onMeta = () => { v.currentTime = start }
    v.addEventListener('loadedmetadata', onMeta)
    raf = requestAnimationFrame(go)
    return () => { cancelAnimationFrame(raf); v.removeEventListener('loadedmetadata', onMeta) }
  }, [fullView])

  useEffect(() => { if (fullVideoRef.current) fullVideoRef.current.muted = fullMuted }, [fullMuted, fullView])
  useEffect(() => { if (searching) setTimeout(() => searchInputRef.current?.focus(), 50) }, [searching])

  const openFull = (obj: any) => { setFullView(obj); setFullMuted(true); setShowPlusMenu(false); setOverlay(null) }
  const closeFull = () => { setFullView(null); setFullMuted(true); setShowPlusMenu(false) }
  const closeSearch = () => { setSearching(false); setSearchText(''); setSearchFilter('all') }

  const handleGallery = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    const t = document.createElement('video'); t.src = url; t.preload = 'metadata'
    t.onloadedmetadata = () => { if (t.duration <= 7.05) setLive(url, 0); else { setTrimUrl(url); setTrimDur(t.duration); setTrimStart(0); setOverlay('trim'); setFullView(null) } }
    e.target.value = ''
  }
  const handlePhoto = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    setMe({ type: 'photo', src: url }); e.target.value = ''
    if (fullView && fullView.isMe) setFullView({ ...fullView, type: 'photo', src: url })
    showToast('Photo set ✔')
  }

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      const chunks: Blob[] = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType }))
        setRecordUrl(url); stream.getTracks().forEach(t => t.stop())
      }
      mr.start(); setRecording(true)
      setTimeout(() => { mr.stop(); setRecording(false) }, 7000)
      setOverlay('record')
    } catch { showToast('Camera not allowed') }
  }

  const isMeFull = fullView && fullView.isMe
  const q = searchText.trim().toLowerCase()
  const filteredChats = chats.filter(c => {
    if (searchFilter === 'unread' && c.ring !== 'new') return false
    if (searchFilter === 'photo' && c.type !== 'photo') return false
    if (searchFilter === 'live' && c.type !== 'live') return false
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.msg.toLowerCase().includes(q) || c.time.toLowerCase().includes(q)
  })

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
        .fullTopBtn{width:44px;height:44px;border-radius:50%;background:rgba(20,24,58,.85);border:1px solid #2a2f5c;color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .fullAction{width:56px;height:56px;border-radius:50%;background:#171c46;border:0;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .fullAction.plus{background:linear-gradient(90deg,#ff2f6d,#8a2be2);color:#fff;font-weight:700}
        .plusMenu{background:#0e1230;border:1px solid #23284f;border-radius:16px;padding:10px;width:210px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
        .plusMenu button{display:block;width:100%;background:#171c46;border:0;color:#fff;padding:12px;border-radius:10px;font-size:15px;margin-bottom:8px;text-align:left}
        .sideBtn{background:#171c46;border:1px solid #2a2f5c;color:#fff;border-radius:20px;padding:7px 11px;font-size:12px;cursor:pointer;white-space:nowrap}
        .waSearchBar{display:flex;align-items:center;gap:10px;background:#1a1f4a;border-radius:22px;padding:11px 14px;color:#8a8fb0;font-size:15px;cursor:text}
        .waChip{background:#1a1f4a;border:1px solid #2a2f5c;color:#cfd3ff;border-radius:20px;padding:7px 12px;font-size:13px;white-space:nowrap;cursor:pointer}
        .waChip.on{background:#ff2f6d;border-color:#ff2f6d;color:#fff}
      `}</style>

      {!openChat && !searching && (
        <header style={{ padding: '14px 16px 10px', background: '#080b1c' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>EVA Chat</div>
          <div className="waSearchBar" style={{ marginTop: 12 }} onClick={() => setSearching(true)}>
            <span>🔍</span><span>Search</span>
          </div>
        </header>
      )}

      {/* SEARCH - back arrow INSIDE the bar, left, no X, no Meta AI */}
      {!openChat && searching && (
        <header style={{ padding: '12px 12px 10px', background: '#080b1c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#1a1f4a', borderRadius: 22, padding: '6px 6px 6px 2px' }}>
            <button onClick={closeSearch} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, padding: '6px 8px', cursor: 'pointer' }}>←</button>
            <input ref={searchInputRef} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search" style={{ flex: 1, background: 'none', border: 0, outline: 'none', color: '#fff', fontSize: 15, padding: '6px 6px 6px 0' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
            <button className={`waChip ${searchFilter === 'all' ? 'on' : ''}`} onClick={() => setSearchFilter('all')}>All</button>
            <button className={`waChip ${searchFilter === 'unread' ? 'on' : ''}`} onClick={() => setSearchFilter('unread')}>☑ Unread</button>
            <button className={`waChip ${searchFilter === 'photo' ? 'on' : ''}`} onClick={() => setSearchFilter('photo')}>🖼️ Photos</button>
            <button className={`waChip ${searchFilter === 'live' ? 'on' : ''}`} onClick={() => setSearchFilter('live')}>🎬 Videos</button>
          </div>
        </header>
      )}

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
            {!searching && (
              <div className="hero">
                <div style={{ width: 150 }}><Droplet o={{ ...me, name: 'You', ring: 'none' }} w={150} onClick={() => openFull({ ...me, name: 'You', isMe: true })} /></div>
              </div>
            )}
            {searching && (q || searchFilter !== 'all') && (
              <div className="section">{filteredChats.length} result{filteredChats.length === 1 ? '' : 's'} for “{searchText || searchFilter}”</div>
            )}
            {filteredChats.map((c, i) => (
              <div key={i} className="row">
                <Droplet o={c} w={46} onClick={(e) => { e.stopPropagation(); openFull({ ...c, isMe: false }) }} />
                <div className="info" onClick={() => { closeSearch(); setOpenChat(c) }}><div className="name">{c.name}</div><div className="sub">{c.msg}</div></div>
                <div className="time">{c.time}</div>
              </div>
            ))}
            {searching && filteredChats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a8fb0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <b style={{ color: '#fff' }}>No results found</b>
                <div style={{ fontSize: 13, marginTop: 6 }}>Try a different name or message</div>
              </div>
            )}
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
          <button className={tab === 'chat' ? 'on' : ''} onClick={() => { setTab('chat'); closeSearch() }}><span>💬</span>Chat</button>
          <button className={tab === 'check' ? 'on' : ''} onClick={() => { setTab('check'); closeSearch() }}><span>✔</span>Check</button>
          <button className={tab === 'call' ? 'on' : ''} onClick={() => { setTab('call'); closeSearch() }}><span>📞</span>Call</button>
        </nav>
      )}

      {fullView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeFull}>
          <div style={{ width: 340, maxWidth: '100%', height: 410, maxHeight: '88dvh', background: '#0e1230', border: '1px solid #23284f', borderRadius: 22, position: 'relative', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 10, left: 0, right: 0, fontWeight: 700, fontSize: 15, zIndex: 3 }}>{fullView.name}</div>
            <div style={{ position: 'absolute', left: 10, top: 46, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', zIndex: 3 }}>
              <button className="sideBtn" onClick={(e) => { e.stopPropagation(); if (me.type === 'live' && isMeFull) return showToast('Remove live sticker first'); photoRef.current?.click(); }}>🖼️ Add photo</button>
              <button className="sideBtn" onClick={(e) => { e.stopPropagation(); setMe({ type: 'none' }); if (isMeFull) setFullView({ ...fullView, type: 'none', src: undefined }); showToast('Photo removed') }}>🗑️ Remove</button>
            </div>
            <div style={{ position: 'absolute', right: 10, top: 46, zIndex: 3 }}>
              <button className="sideBtn" onClick={(e) => { e.stopPropagation(); setFullMuted(!fullMuted) }}>{fullMuted ? '🔇 Mute' : '🔊 Sound'}</button>
            </div>
            <div style={{ position: 'absolute', inset: 0, top: -24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 180 }}><Droplet o={{ ...fullView, ring: 'none' }} w={180} muted={fullMuted} /></div>
            </div>
            {fullView.type === 'live' && fullView.src && <video ref={fullVideoRef} src={fullView.src} muted={fullMuted} playsInline autoPlay style={{ display: 'none' }} />}
            {showPlusMenu && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 74, display: 'flex', justifyContent: 'center', zIndex: 4 }} onClick={e => e.stopPropagation()}>
                <div className="plusMenu">
                  <button onClick={() => { setShowPlusMenu(false); setOverlay('upload') }}>⬆️ Upload Live</button>
                  <button onClick={() => { setShowPlusMenu(false); startRecord() }}>🎬 Record</button>
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, zIndex: 3 }} onClick={e => e.stopPropagation()}>
              <div className="icons" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 320, margin: '0 auto' }}>
                <button className="fullAction" onClick={() => { closeFull(); if (fullView.name === 'You') showToast('This is you'); else setOpenChat(fullView as Chat) }}>💬</button>
                <button className="fullAction" onClick={() => showToast('Voice call ' + fullView.name)}>📞</button>
                <button className="fullAction plus" onClick={() => setShowPlusMenu(!showPlusMenu)}>+</button>
                <button className="fullAction" onClick={() => showToast('Video call ' + fullView.name)}>🎥</button>
              </div>
            </div>
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
      {overlay === 'record' && (
        <div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="sheetbox"><h3>Record (max 7 sec)</h3>
            <p className="small">{recording ? 'Recording… 7 sec' : recordUrl ? 'Done (7 sec)' : 'Recording...'}</p>
            {recordUrl && <video className="vid" muted playsInline autoPlay loop src={recordUrl} />}
            {recordUrl && <button className="big pri" onClick={() => setLive(recordUrl, 0)}>Upload</button>}
            <button className="big" onClick={close}>Cancel</button>
          </div>
        </div>
      )}

      <input ref={galleryRef} type="file" accept="video/*" hidden onChange={handleGallery} />
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
      {toast && <div id="toast">{toast}</div>}
    </div>
  )
}
