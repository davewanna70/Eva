'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PhoneIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>)
const VideoIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>)
const ChatIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>)

export default function ChatInside() {
  const router = useRouter()
  const params = useParams()
  const [text, setText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [fullLive, setFullLive] = useState(false)
  const [fullImg, setFullImg] = useState('')
  const EVA_BG = '/eva-bg.jpg'
  const names = { '1': 'Ada', '2': 'EVA Group - Lagos', '3': 'Tunde' }
  const name = names[params.id] || 'Ada'
  const lastSeens = { '1': '● Online', '2': 'Tunde, Ada • Online', '3': 'Last seen 2 mins ago' }
  const lastSeen = lastSeens[params.id] || '● Online'
  const [msgs, setMsgs] = useState([
    { id: 1, from: 'other', text: 'You don see my new live sticker?', time: '2:12 PM' },
    { id: 2, from: 'me', text: 'Yes o, e too fine, e dey repeat 😍', time: '2:13 PM' },
    { id: 3, from: 'other', type: 'live', time: '2:15 PM', img: EVA_BG },
    { id: 4, from: 'me', type: 'voice', text: '0:07', time: '2:16 PM' },
  ])
  const send = () => {
    if (!text.trim()) return
    setMsgs([...msgs, { id: Date.now(), from: 'me', text, time: 'Now' }])
    setText('')
  }
  const openFull = (img) => { setFullImg(img); setFullLive(true) }
  const closeAll = () => { setShowMenu(false); setShowAttach(false) }
  return (
    <div className="chat-inside" onClick={closeAll}>
      <div className="inside-header" onClick={e => e.stopPropagation()}>
        <button className="icon-btn" onClick={() => router.push('/chat')}>←</button>
        <div className="droplet-real small" onClick={() => setShowProfile(true)}><img src={EVA_BG} alt="" /></div>
        <div className="header-text" onClick={() => setShowProfile(true)}>
          <b>{name}</b>
          <span>{lastSeen}</span>
        </div>
        <div className="header-icons">
          <button className="call-futuristic" onClick={(e) => e.stopPropagation()}><VideoIcon /></button>
          <button className="call-futuristic" onClick={(e) => e.stopPropagation()}><PhoneIcon /></button>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}>⋮</button>
        </div>
        {showMenu && (
          <>
            <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
            <div className="inside-menu" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMenu(false)}>View contact</button>
              <button onClick={() => setShowMenu(false)}>Media, links, docs</button>
              <button onClick={() => setShowMenu(false)}>Search</button>
              <button onClick={() => setShowMenu(false)}>Mute notifications</button>
              <button onClick={() => setShowMenu(false)}>Block</button>
            </div>
          </>
        )}
      </div>
      <div className="messages-area">
        <div className="date-pill">Today</div>
        <div className="encrypt-note">🔒 Messages are end-to-end encrypted</div>
        {msgs.map(m => (
          <div key={m.id} className={m.from === 'me' ? 'msg-row me' : 'msg-row'}>
            <div className="bubble">
              {m.type === 'live' ? (
                <div className="live-box-full" onClick={() => openFull(m.img)}>
                  <img src={m.img} alt="" />
                </div>
              ) : m.type === 'voice' ? (
                <div className="voice-msg"><span>▶️</span><div className="voice-bar" /><span>{m.text}</span></div>
              ) : (
                <p>{m.text}</p>
              )}
              <div className="msg-meta"><span>{m.time}</span><span>✓✓</span></div>
            </div>
          </div>
        ))}
      </div>
      {showAttach && (
        <div className="attach-menu" onClick={e => e.stopPropagation()}>
          <button>📷 Camera</button>
          <button>🖼️ Gallery</button>
          <button>📄 Document</button>
          <button>📍 Location</button>
        </div>
      )}
      <div className="input-area" onClick={e => e.stopPropagation()}>
        <button className="input-btn" onClick={() => setShowAttach(!showAttach)}>+</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message" />
        <button className="input-btn">😊</button>
        <button className="input-btn">📎</button>
        <button className="send-btn" onClick={send}>➤</button>
      </div>
      {showProfile && !fullLive && (
        <div className="eva-pop-bg" onClick={() => setShowProfile(false)}>
          <div className="eva-pop" onClick={e => e.stopPropagation()}>
            <div className="eva-pop-img" onClick={() => openFull(EVA_BG)}>
              <img src={EVA_BG} alt="" />
              <span className="eva-live-dot" />
            </div>
            <div className="eva-pop-icons">
              <button onClick={() => setShowProfile(false)}><ChatIcon /></button>
              <button><PhoneIcon /></button>
              <button><VideoIcon /></button>
            </div>
          </div>
        </div>
      )}
      {fullLive && (
        <div className="eva-full" onClick={() => setFullLive(false)}>
          <div className="eva-full-top">
            <button onClick={() => setFullLive(false)}>✕</button>
            <b>{name}</b>
            <span>● Live</span>
          </div>
          <img src={fullImg} alt="" />
        </div>
      )}
    </div>
  )
          }
