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

      {/* TOP BAR */}
      <div className="top-bar">
        <h1>EVA <span className="transparent-sign">💧</span></h1>
        <div className="top-icons">
          <button onClick={() => setShowNotifications(true)}>🔔</button>
          <button onClick={() => setShowSettings(true)}>⚙️</button>
          <button onClick={() => setShowMenu(!showMenu)}>⋮</button>
        </div>
        {showMenu && (
          <div className="three-dot-menu">
            <button
