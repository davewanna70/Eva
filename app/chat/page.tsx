'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EvaChat() {
  const router = useRouter()
  const [tab, setTab] = useState('chats')
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  const chats = [
    { id: 1, name: 'Ada', last: 'I don see your live sticker', time: '2:15 PM', unread: 2, photo: '/ada.jpg', liveSticker: '/ada.mp4' },
    { id: 2, name: 'EVA Group - Lagos', last: 'Tunde: Who dey come?', time: '1:40 PM', unread: 5, photo: '/group.jpg', isGroup: true },
    { id: 3, name: 'Tunde', last: 'Send me that 7s sticker', time: '11:20 AM', unread: 0, photo: '/tunde.jpg' },
  ]

  const checks = [
    { id: 1, name: 'Ada', time: '12 mins ago', views: 24, photo: '/ada.jpg', liveSticker: '/ada.mp4' },
    { id: 2, name: 'Tunde', time: '1 hr ago', views: 12, photo: '/tunde.jpg' },
  ]

  return (
    <div className="eva-chat-page">
      <div className="top-bar">
        <h1>EVA <span className="transparent-sign">💧</span></h1>
        <div className="top-icons">
          <button onClick={() => setShowNotifications(true)}>🔔</button>
          <button onClick={() => setShowSettings(true)}>⚙️</button>
          <button onClick={() => setShowMenu(!showMenu)}>⋮</button>
        </div>
        {showMenu && (
          <div className="three-dot-menu">
            <button onClick={() => alert('New group - you fit create as many as you want')}>New group</button>
            <button>New broadcast</button>
            <button onClick={() => setShowSettings(true)}>Settings</button>
            <button>Starred messages</button>
            <button>Linked devices</button>
          </div>
        )}
      </div>

      <div className="search-bar">
        <input placeholder="Search or start new chat" />
      </div>

      {tab === 'chats' && (
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className="chat-row" onClick={() => router.push(`/chat/${chat.id}`)}>
              <div className="droplet-profile-small">
                {chat.liveSticker ? <video src={chat.liveSticker} autoPlay muted loop playsInline /> : <img src={chat.photo} alt={chat.name} />}
              </div>
              <div className="chat-info">
                <div className="chat-top"><b>{chat.name}</b><span>{chat.time}</span></div>
                <div className="chat-bottom"><span>{chat.last}</span>{chat.unread > 0 && <span className="unread">{chat.unread}</span>}</div>
              </div>
            </div>
          ))}
          <button className="fab" onClick={() => alert('New chat')}>💬</button>
        </div>
      )}

      {tab === 'check' && (
        <div className="check-page">
          <div className="my-check" onClick={() => alert('Upload your Check')}>
            <div className="droplet-profile-small my-droplet"><span>+</span></div>
            <div><b>My Check</b><p>Tap to add Check</p></div>
          </div>
          <p className="label">Recent Checks</p>
          {checks.map(c => (
            <div key={c.id} className="chat-row" onClick={() => alert('Viewing Check - ' + c.views + ' views')}>
              <div className="droplet-profile-small check-ring">
                {c.liveSticker ? <video src={c.liveSticker} autoPlay muted loop playsInline /> : <img src={c.photo} alt={c.name} />}
              </div>
              <div style={{ flex: 1 }}><b>{c.name}</b><p>{c.time} • {c.views} views</p></div>
              <span>👁️ {c.views}</span>
            </div>
          ))}
          <button className="fab" onClick={() => alert('Upload Check')}>＋</button>
        </div>
      )}

      {tab === 'calls' && (
        <div className="calls-page">
          <div className="chat-row">
            <div className="droplet-profile-small"><img src="/ada.jpg" alt="Ada" /></div>
            <div style={{ flex: 1 }}><b>Ada</b><p>Video call • 2 mins ago</p></div>
            <button className="call-btn">📹</button>
            <button className="call-btn">📞</button>
          </div>
          <button className="fab">📞</button>
        </div>
      )}

      <div className="bottom-nav">
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>💬<span>Chats</span></button>
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>◎<span>Check</span></button>
        <button className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')}>📞<span>Calls</span></button>
      </div>

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
            <p>Tunde viewed your Check</p>
            <button onClick={() => setShowNotifications(false)}>Close</button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-card profile-modal" onClick={e => e.stopPropagation()}>
            <div className="droplet-profile-big">
              {selectedUser.liveSticker ? <video src={selectedUser.liveSticker} autoPlay muted loop playsInline /> : <img src={selectedUser.photo} alt="" />}
            </div>
            <h2>{selectedUser.name}</h2>
            <div className="profile-actions">
              <button className="glass-btn">📹<span>Video</span></button>
              <button className="glass-btn">●<span>Record</span></button>
              <label className="glass-btn">+<span>Upload</span><input type="file" hidden /></label>
              <button className="glass-btn">📞<span>Call</span></button>
            </div>
            <button onClick={() => router.push(`/chat/${selectedUser.id}`)}>💬 Message</button>
          </div>
        </div>
      )}
    </div>
  )
}
