'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatInside() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const [messages, setMessages] = useState([
    { id: 1, from: 'other', text: 'You don see my new live sticker?', time: '2:12 PM', type: 'text' },
    { id: 2, from: 'me', text: 'Yes o, e too fine, e dey repeat 😍', time: '2:13 PM', type: 'text', status: 'seen' },
    { id: 3, from: 'other', text: '', time: '2:14 PM', type: 'sticker', sticker: '/sticker1.png' },
    { id: 4, from: 'other', text: '', time: '2:15 PM', type: 'live', liveSticker: '/ada.mp4' },
    { id: 5, from: 'me', text: '', time: '2:16 PM', type: 'voice', duration: '0:07' },
  ])

  const sendMessage = () => {
    if (!message.trim()) return
    setMessages([...messages, { id: Date.now(), from: 'me', text: message, time: 'Now', type: 'text', status: 'sent' }])
    setMessage('')
  }

  return (
    <div className="chat-inside">

      {/* TOP HEADER - LIKE WHATSAPP */}
      <div className="chat-header">
        <button onClick={() => router.back()}>←</button>
        {/* DROPLET PROFILE - CLICK AM GO OPEN PROFILE */}
        <div className="droplet-profile-tiny" onClick={() => setShowProfile(true)}>
          <video src="/ada.mp4" autoPlay muted loop playsInline />
        </div>
        <div className="header-name" onClick={() => setShowProfile(true)}>
          <b>Ada</b>
          <span>Online • Last seen today</span>
        </div>
        <button>📹</button>
        <button>📞</button>
        <button onClick={() => setShowMenu(!showMenu)}>⋮</button>
        {showMenu && (
          <div className="header-menu">
            <button>View contact</button>
            <button>Media, links, docs</button>
            <button>Search</button>
            <button>Mute notifications</button>
            <button>Wallpaper</button>
            <button>Block</button>
          </div>
        )}
      </div>

      {/* MESSAGES AREA */}
      <div className="messages-area">
        <div className="date-pill">Today</div>
        <div className="encrypt-note">🔒 Messages are end-to-end encrypted</div>

        {messages.map(m => (
          <div key={m.id} className={`msg-row ${m.from === 'me' ? 'me' : 'other'}`}>
            <div className="bubble">
              {m.type === 'text' && <p>{m.text}</p>}
              {m.type === 'sticker' && <img src={m.sticker} className="sticker-img" />}
              {m.type === 'live' && (
                <div className="live-in-chat">
                  <video src={m.liveSticker} autoPlay muted loop playsInline />
                  <span>Live • 7s</span>
                </div>
              )}
              {m.type === 'voice' && (
                <div className="voice-msg">
                  <span>▶️</span><div className="voice-bar" /><span>{m.duration}</span>
                </div>
              )}
              <div className="msg-meta"><span>{m.time}</span>{m.from === 'me' && <span>{m.status === 'seen' ? '✓✓' : '✓'}</span>}</div>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="input-area">
        <button className="input-btn" onClick={() => setShowAttach(!showAttach)}>＋</button>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message"
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button className="input-btn">😊</button>
        <button className="input-btn">📎</button>
        <button className="send-btn" onClick={sendMessage}>➤</button>
      </div>

      {/* ATTACH MENU - WHATSAPP NORMAL */}
      {showAttach && (
        <div className="attach-menu">
          <button>📄 Document</button>
          <button>📷 Camera</button>
          <button>🖼️ Gallery</button>
          <button>🎵 Audio</button>
          <button>📍 Location</button>
          <button>👤 Contact</button>
          <button>💧 Live Sticker (7s)</button>
          <button>😀 Sticker</button>
        </div>
      )}

      {/* PROFILE MODAL - DROPLET ONLY */}
      {showProfile && (
        <div className="modal" onClick={() => setShowProfile(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="droplet-profile-big">
              <video src="/ada.mp4" autoPlay muted loop playsInline />
            </div>
            <h2>Ada</h2>
            <p>Hey, I dey EVA 💧</p>
            <div className="profile-actions">
              <button className="glass-btn">📹<span>Video</span></button>
              <button className="glass-btn">●<span>Record</span></button>
              <label className="glass-btn">+<span>Upload</span><input type="file" hidden /></label>
              <button className="glass-btn">📞<span>Call</span></button>
            </div>
            <button className="normal-btn">Media, links, docs</button>
            <button className="normal-btn">Mute notifications</button>
            <button className="normal-btn">Block Ada</button>
          </div>
        </div>
      )}

    </div>
  )
          }
