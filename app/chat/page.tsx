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

  // STEP 3 - PROFILE SHEET + FULL VIEW
  const [profile, setProfile] = useState(null)
  const [fullProfile, setFullProfile] = useState(false)

  const EVA_BG = '/eva-bg.jpg'

  const allChats = [
    { id: 1, name: 'Ada', last: 'I don see your live sticker', time: '2:15 PM', unread: 2, photo: EVA_BG, live: true },
    { id: 2, name: 'EVA Group - Lagos', last: 'Tunde: Who dey come?', time: '1:40 PM', unread: 5, photo: EVA_BG, live: false },
    { id: 3, name: 'Tunde', last: 'Send me that 7s sticker', time: '11:20 AM', unread: 0, photo: EVA_BG, live: true },
  ]

  const chats = allChats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const checks = [
    { id: 1, name: 'Ada', time: '12 mins ago', views: 24, photo: EVA_BG, live: true },
    { id: 2, name: 'Tunde', time: '1 hr ago', views: 12, photo: EVA_BG, live: false },
  ]

  const openSettings = () => { setShowMenu(false); setShowSettings(true) }
  const openNotifs = () => { setShowMenu(false); setShowNotifications(true) }

  const openProfile = (person, e) => {
    e.stopPropagation()
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
            <div key={c.id} className="chat-row" onClick={() => openProfile(c, { stopPropagation:()=>{} })}>
              <div className="droplet-real check-ring"><img src={c.photo} alt="" /></div>
              <div style={{ flex: 1 }}><b>{c.name}</b><p>{c.time} • {c.views} views</p></div>
              <span>👁️ {c.views}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'calls' && (
        <div className="calls-page">
          <div className="chat-row">
            <div className="droplet-real" onClick={(e) => openProfile(allChats[0], e)}><img src={EVA_BG} alt="" /></div>
            <div style={{ flex: 1 }}><b>Ada</b><p>Video call • 2 mins ago</p></div>
            <button className="call-btn">📹</button>
            <button className="call-btn">📞</button>
          </div>
        </div>
      )}

      <div className="bottom-glass">
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>💬<span>Chats</span></button>
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>◎<span>Check</span></button>
        <button className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')}>📞<span>Calls</span></button>
      </div>

      <button className="fab-glass" onClick={() => setShowNewChat(true)}>💬</button>

      {/* STEP 3 - PROFILE HALF SHEET LIKE WHATSAPP */}
      {profile && !fullProfile && (
        <div className="profile-sheet-bg" onClick={() => setProfile(null)}>
          <div className="profile-sheet" onClick={e => e.stopPropagation()}>
            <div className="profile-big" onClick={() => setFullProfile(true)}>
              <img src={profile.photo} alt="" />
              {profile.live && <span className="live-pill">● Live • 7s — Tap to watch full</span>}
              <span className="tap-full">Tap to view full</span>
            </div>
            <div className="profile-name"><b>{profile.name}</b><span>Online • Last seen today</span></div>
            <div className="profile-3btn">
              <button onClick={() => router.push(`/chat/${profile.id}`)}>💬<span>Message</span></button>
              <button>📞<span>Call</span></button>
              <button>📹<span>Video</span></button>
            </div>
            <button className="profile-close" onClick={() => setProfile(null)}>Close</button>
          </div>
        </div>
      )}

      {/* STEP 3 - FULL SCREEN PROFILE / LIVE */}
      {profile && fullProfile && (
        <div className="full-view" onClick={() => setFullProfile(false)}>
          <div className="full-top">
            <button onClick={() => setFullProfile(false)}>✕</button>
            <b>{profile.name}</b>
            <span>{profile.live ? 'Live • 7s' : 'Profile'}</span>
          </div>
          <img src={profile.photo} alt="" />
          <div className="full-bottom">{profile.live ? '● Live sticker dey play' : 'Tap anywhere to close'}</div>
        </div>
      )}

      {showNewChat && (
        <div className="modal" onClick={() => setShowNewChat(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>New Chat</h3>
            <p style={{color:'#bbb', fontSize:13}}>Choose who you wan chat with</p>
            {allChats.map(c => (
              <button key={c.id} onClick={() => router.push(`/chat/${c.id}`)} style={{display:'flex', gap:10, alignItems:'center', textAlign:'left'}}>
                <img src={c.photo} style={{width:36, height:36, borderRadius:'50% 50% 50% 8px', objectFit:'cover', border:'1.5px solid #a78bfa'}} /> {c.name}
              </button>
            ))}
            <button onClick={() => setShowNewChat(false)}>Close</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Settings</h3>
            <button>Account • Privacy, Security</button>
            <button>Chats • Theme, Wallpaper, Backup</button>
            <button>Notifications • Sound, Vibrate</button>
            <button>Storage and Data</button>
            <button>Help • About EVA</button>
            <button onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="modal" onClick={() => setShowNotifications(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Notifications</h3>
            <p>Ada sent you 2 messages</p>
            <p>EVA Group - Lagos: 5 new messages</p>
            <button onClick={() => setShowNotifications(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
