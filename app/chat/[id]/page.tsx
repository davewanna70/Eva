'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ChatInside() {
  const router = useRouter()
  const params = useParams()
  const [text, setText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showAttach, setShowAttach] = useState(false)

  // STEP 3 - PROFILE + FULL LIVE
  const [showProfile, setShowProfile] = useState(false)
  const [fullLive, setFullLive] = useState(false)
  const [fullImg, setFullImg] = useState('')

  const EVA_BG = '/eva-bg.jpg'
  const names = { '1': 'Ada', '2': 'EVA Group - Lagos', '3': 'Tunde' }
  const name = names[params.id] || 'Ada'

  const [msgs, setMsgs] = useState([
    { id: 1, from: 'other', text: 'You don see my new live sticker?', time: '2:12 PM' },
    { id: 2, from: 'me', text: 'Yes o, e too fine, e dey repeat 😍', time: '2:13 PM' },
    { id: 3, from: 'other', type: 'live', text: 'Live • 7s', time: '2:15 PM', img: EVA_BG },
    { id: 4, from: 'me', type: 'voice', text: '0:07', time: '2:16 PM' },
  ])

  const send = () => {
    if (!text.trim()) return
    setMsgs([...msgs, { id: Date.now(), from: 'me', text, time: 'Now' }])
    setText('')
  }

  const openFull = (img) => { setFullImg(img); setFullLive(true) }

  return (
    <div className="chat-inside">
      <div className="inside-header">
        <button className="icon-btn" onClick={() => router.push('/chat')}>←</button>
        <div className="droplet-real small" onClick={() => setShowProfile(true)}><img src={EVA_BG} alt="" /></div>
        <div className="header-text" onClick={() => setShowProfile(true)}>
          <b>{name}</b>
          <span>Online • Last seen today</span>
        </div>
        <div className="header-icons">
          <button className="icon-btn">📹</button>
          <button className="icon-btn">📞</button>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
        </div>
        {showMenu && (
          <div className="inside-menu">
            <button onClick={() => setShowMenu(false)}>View contact</button>
            <button onClick={() => setShowMenu(false)}>Media, links, docs</button>
            <button onClick={() => setShowMenu(false)}>Search</button>
            <button onClick={() => setShowMenu(false)}>Mute notifications</button>
            <button onClick={() => setShowMenu(false)}>Block</button>
          </div>
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
                  <span>● {m.text} — Tap to watch full</span>
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
        <div className="attach-menu">
          <button>📷 Camera</button>
          <button>🖼️ Gallery</button>
          <button>📄 Document</button>
          <button>📍 Location</button>
        </div>
      )}

      <div className="input-area">
        <button className="input-btn" onClick={() => setShowAttach(!showAttach)}>+</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message" />
        <button className="input-btn">😊</button>
        <button className="input-btn">📎</button>
        <button className="send-btn" onClick={send}>➤</button>
      </div>

      {/* PROFILE HALF SHEET INSIDE CHAT TOO */}
      {showProfile && !fullLive && (
        <div className="profile-sheet-bg" onClick={() => setShowProfile(false)}>
          <div className="profile-sheet" onClick={e => e.stopPropagation()}>
            <div className="profile-big" onClick={() => openFull(EVA_BG)}>
              <img src={EVA_BG} alt="" />
              <span className="live-pill">● Live • 7s — Tap to watch full</span>
              <span className="tap-full">Tap to view full</span>
            </div>
            <div className="profile-name"><b>{name}</b><span>Online • Last seen today</span></div>
            <div className="profile-3btn">
              <button onClick={() => setShowProfile(false)}>💬<span>Message</span></button>
              <button>📞<span>Call</span></button>
              <button>📹<span>Video</span></button>
            </div>
            <button className="profile-close" onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}

      {/* FULL SCREEN LIVE / PROFILE */}
      {fullLive && (
        <div className="full-view" onClick={() => { setFullLive(false); }}>
          <div className="full-top">
            <button onClick={() => setFullLive(false)}>✕</button>
            <b>{name}</b>
            <span>Live • 7s</span>
          </div>
          <img src={fullImg} alt="" />
          <div className="full-bottom">● Live sticker dey play — Tap anywhere to close</div>
        </div>
      )}
    </div>
  )
}
