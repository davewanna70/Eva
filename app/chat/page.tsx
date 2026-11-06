'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PhoneIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>)
const VideoIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>)
const ChatIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>)

export default function EvaChat() {
  const router = useRouter()
  const [tab, setTab] = useState('chats')
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
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
  const openProfile = (person, e) => { if (e) e.stopPropagation(); setProfile(person); setFullProfile(false) }
  return (
    <div className="eva-chat-page">
      <div className="chat-top-glass">
        <div className="chat-top-left">
          <img src={EVA_BG} className="top-eva-img" alt="" />
          <h1>EVA <span>💧</span></h1>
        </div>
        <div className="top-icons">
          <button onClick={openSettings} className="top-gear">⚙️</button>
          <button onClick={() => setShowMenu(!showMenu)}>⋮</button>
        </div>
      </div>
      {showMenu && (<>
        <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
        <div className="three-dot-menu">
          <button onClick={() => { setShowMenu(false); setShowNewChat(true) }}>New group</button>
          <button onClick={() => setShowMenu(false)}>New broadcast</button>
          <button onClick={openSettings}>Settings</button>
          <button onClick={() => setShowMenu(false)}>Starred messages</button>
          <button onClick={() => setShowMenu(false)}>Linked devices</button>
        </div>
      </>)}
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
              <div className="droplet-real check-ring"><img src={c.photo} alt="" /></div>
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
            <div style={{ flex: 1 }}><b>Ada</b><p>Video call • 2 mins ago</p></div>
            <button className="call-futuristic" onClick={(e) => e.stopPropagation()}><VideoIcon /></button>
            <button className="call-futuristic" onClick={(e) => e.stopPropagation()}><PhoneIcon /></button>
          </div>
        </div>
      )}
      <div className="bottom-glass">
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}><ChatIcon /><span>Chats</span></button>
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>◎<span>Check</span></button>
        <button className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')}><PhoneIcon /><span>Calls</span></button>
      </div>
      {!profile && <button className="fab-glass" onClick={() => setShowNewChat(true)}><ChatIcon /></button>}
      {profile && !fullProfile && (
        <div className="eva-pop-bg" onClick={() => setProfile(null)}>
          <div className="eva-pop" onClick={e => e.stopPropagation()}>
            <div className="eva-pop-img" onClick={() => setFullProfile(true)}>
              <img src={profile.photo} alt="" />
              {profile.live && <span className="eva-live-dot" />}
            </div>
            <div className="eva-pop-icons">
              <button onClick={() => router.push(`/chat/${profile.id}`)}><ChatIcon /></button>
              <button><PhoneIcon /></button>
              <button><VideoIcon /></button>
            </div>
          </div>
        </div>
      )}
      {profile && fullProfile && (
        <div className="eva-full" onClick={() => setFullProfile(false)}>
          <div className="eva-full-top">
            <button onClick={() => setFullProfile(false)}>✕</button>
            <b>{profile.name}</b>
            <span>{profile.live ? '● Live' : profile.lastSeen}</span>
          </div>
          <img src={profile.photo} alt="" />
        </div>
      )}
      {showNewChat && (
        <div className="modal" onClick={() => setShowNewChat(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>New Chat</h3>
            <p style={{color:'#bbb', fontSize:13}}>Choose who you wan chat with</p>
            {allChats.map(c => (
              <button key={c.id} onClick={() => router.push(`/chat/${c.id}`)} style={{display:'flex', gap:10, alignItems:'center', textAlign:'left'}}>
                <img src={c.photo} style={{width:36, height:36, borderRadius:'50% 50% 50% 8px', objectFit:'cover', border:'1.5px solid #a78bfa'}} alt="" /> {c.name}
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
            <button onClick={() => { setShowSettings(false); setShowNotifications(true) }}>Notifications • Sound, Vibrate</button>
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
