'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EvaChat() {
  const router = useRouter()
  const [tab, setTab] = useState('chats')
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)

  // STEP 3.1 - CLEAN POP + FULL VIEW
  const [profile, setProfile] = useState(null)
  const [fullProfile, setFullProfile] = useState(false)

  const EVA_BG = '/eva-bg.jpg'

  const allChats = [
    { id: 1, name: 'Ada', last: 'I don see your live sticker', time: '2:15 PM', unread: 2, photo: EVA_BG, live: true, lastSeen: '● Online' },
    { id: 2, name: 'EVA Group - Lagos', last: 'Tunde: Who dey come?', time: '1:40 PM', unread: 5, photo: EVA_BG, live: false, lastSeen: 'Last seen 5 mins ago' },
    { id: 3, name: 'Tunde', last: 'Send me that 7s sticker', time: '11:20 AM', unread: 0, photo: EVA_BG, live: true, lastSeen: 'Last seen 2 mins ago' },
  ]

  const chats = allChats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const checks = [
    { id: 1, name: 'Ada', time: '12 mins ago', views: 24, photo: EVA_BG, live: true, lastSeen: '● Online' },
    { id: 2, name: 'Tunde', time: '1 hr ago', views: 12, photo: EVA_BG, live: false, lastSeen: 'Last seen 2 mins ago' },
  ]

  const openSettings = () => { setShowMenu(false); setShowSettings(true) }
  const openNotifs = () => { setShowMenu(false); setShowNotifications(true) }

  const openProfile = (person, e) => {
    if (e) e.stopPropagation()
    setProfile(person)
    setFullProfile(false)
  }

  return (
    <div className="eva-chat-page">
      <div className="chat-top-glass">
        <div className="chat-top-left">
          <img src={EVA_BG} className="top-eva-img" />
          <h1>EVA <span>💧</span></h1>
        </div>
        <div className="top-icons">
          <button onClick={openNotifs}>🔔</button>
          <button onClick={openSettings}>⚙️</button>
          <button onClick={() => setShowMenu(!showMenu)}>⋮</button>
        </div>
        {showMenu && (
          <div className="three-dot-menu">
            <button onClick={() => { setShowMenu(false); setShowNewChat(true) }}>New group</button>
            <button onClick={() => setShowMenu(false)}>New broadcast</button>
            <button onClick={openSettings}>Settings</button>
            <button onClick={() => setShowMenu(false)}>Starred messages</button>
            <button onClick={() => setShowMenu(false)}>Linked devices</button>
          </div>
        )}
      </div>

      <div className="search-glass">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or start new chat" />
      </div>

      {tab === 'chats' && (
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className="chat-row" onClick={() => router.push(`/chat/${chat.id}`)}>
              <div className="droplet-real" onClick={(e) => openProfile(chat, e)}>
                <img src={chat.photo} alt="" />
                {chat.live && <span className="live-dot">Live</span>}
              </div>
              <div className="chat-info">
                <div className="chat-top"><b>{chat.name}</b><span>{chat.time}</span></div>
                <div className="chat-bottom"><span>{chat.last}</span>{chat.unread > 0 && <span className="unread">{chat.unread}</span>}</div>
              </div>
            </div>
          ))}
          {chats.length === 0 && <p style={{textAlign:'center', padding:20, color:'#aaa'}}>No chat found for "{search}"</p>}
        </div>
      )}

      {tab === 'check' && (
        <div className="check-page">
          <div className="my-check">
            <div className="droplet-real my-droplet"><span>+</span></div>
            <div><b>My Check</b><p>Tap to add Check</p></div>
          </div>
          <p className="label">Recent Checks</p>
          {checks.map(c => (
            <div key={c.id} className="chat-row" onClick={(e) => openProfile(c, e)}>
              <div className="droplet-real check-ring" onClick={(e) => openProfile(c, e)}><img src={c.photo} alt="" /></div>
              <div style={{ flex: 1 }}><b>{c.name}</b><p>{c.time} • {c.views} views</p></div>
              <span>👁️ {c.views}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'calls' && (
        <div className="calls-page">
          <div className="chat-row" onClick={() => router.push(`/chat/1`)}>
            <div className="droplet-real" onClick={(e) => openProfile(allChats[0], e)}><img src={EVA_BG} alt="" /></div>
            <div style={{ flex: 1 }} onClick={(e) => openProfile(allChats[0], e)}><b>Ada</b><p>Video call • 2 mins ago</p></div>
            <button className="call-btn" onClick={(e) => e.stopPropagation()}>📹</button>
            <button className="call-btn" onClick={(e) => e.stopPropagation()}>📞</button>
          </div>
        </div>
      )}

      <div className="bottom-glass">
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>💬<span>Chats</span></button>
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>◎<span>Check</span></button>
        <button className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')}>📞<span>Calls</span></button>
      </div>

      {!profile && <button className="fab-glass" onClick={() => setShowNewChat(true)}>💬</button>}

      {/* CLEAN POP - WHATSAPP SIZE, NO TEXT, NO DUPLICATE NAME */}
      {profile && !fullProfile && (
