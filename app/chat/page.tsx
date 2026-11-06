"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Chat = { id: string; name: string; avatar: string; video: string; live?: boolean }

const baseChats: Chat[] = [
  { id: "ada", name: "Ada", avatar: "A", video: "/ada.mp4", live: true },
  { id: "group", name: "EVA Group - Lagos", avatar: "G", video: "/group.mp4" },
  { id: "tunde", name: "Tunde", avatar: "T", video: "/tunde.mp4", live: true },
  { id: "1", name: "Test Chat 1", avatar: "", video: "/test1.mp4" },
  { id: "2", name: "Test Chat 2", avatar: "", video: "/test2.mp4" },
  { id: "3", name: "Test Chat 3", avatar: "", video: "/test3.mp4" },
]

export default function ChatList() {
  const router = useRouter()
  const [lastMsgs, setLastMsgs] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<Chat | null>(null)
  const [tab, setTab] = useState("chats")
  const [modal, setModal] = useState<string | null>(null)

  const load = () => {
    const m: Record<string, string> = {}
    baseChats.forEach((c) => {
      try {
        const arr = JSON.parse(localStorage.getItem("eva_msgs_" + c.id) || "[]")
        if (arr.length) m[c.id] = arr[arr.length - 1].live ? "Live Memo • 7s loop" : arr[arr.length - 1].text
      } catch {}
    })
    setLastMsgs(m)
  }

  useEffect(() => {
    load()
    const onStorage = (e: StorageEvent) => { if (e.key?.startsWith("eva_msgs_")) load() }
    window.addEventListener("storage", onStorage)
    const bc = new BroadcastChannel("eva_live")
    bc.onmessage = () => load()
    return () => { window.removeEventListener("storage", onStorage); bc.close() }
  }, [])

  return (
    <div className="eva-app">
      <div className="eva-top">
        <div className="eva-logo"><span className="eva-droplet mini" /> EVA <span className="eva-droplet mini" style={{ opacity: 0.7 }} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="eva-icon-btn" onClick={() => setModal("settings")}>⚙️</button>
          <button className="eva-icon-btn" onClick={() => setModal("menu")}>⋮</button>
        </div>
      </div>

      <div className="eva-search">Search or start new chat</div>

      <div className="eva-list">
        {baseChats.map((c) => (
          <div key={c.id} className="eva-row">
            {/* CLICK DROPLET = MINI PROFILE, BOTTLE SHAPE, VIDEO INSIDE, NO EVA, NO LETTER */}
            <div className="eva-drop-wrap" onClick={() => setProfile(c)}>
              <div className="eva-droplet small">
                <video src={c.video} autoPlay muted loop playsInline />
              </div>
              {c.live && <div className="eva-live-badge">Live</div>}
            </div>
            {/* CLICK NAME = OPEN CHAT */}
            <div className="eva-row-main" onClick={() => router.push("/chat/" + c.id)}>
              <div className="eva-row-top"><b>{c.name}</b></div>
              <div className="eva-last">{lastMsgs[c.id] || "Tap to start • Live Memo ready"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM - NO PURPOSE CHAT */}
      <div className="eva-bottom">
        <button className={tab === "chats" ? "active" : ""} onClick={() => setTab("chats")}>💬<span>Chats</span></button>
        <button className={tab === "check" ? "active" : ""} onClick={() => { setTab("check"); setModal("check") }}>✓<span>Check</span></button>
        <button className={tab === "calls" ? "active" : ""} onClick={() => { setTab("calls"); setModal("calls") }}>📞<span>Calls</span></button>
      </div>

      {/* MINI PROFILE PREVIEW - VIDEO INSIDE BOTTLE TOO */}
      {profile && (
        <div className="eva-modal" onClick={() => setProfile(null)}>
          <div className="eva-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="eva-droplet large">
                <video src={profile.video} autoPlay muted loop playsInline />
              </div>
            </div>
            <h3>{profile.name}</h3>
            <p>Glass droplet profile • No EVA inside • Live Memo ready</p>
            <button onClick={() => router.push("/chat/" + profile.id)}>Open Chat</button>
            <button className="ghost" onClick={() => setProfile(null)}>Close</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="eva-modal" onClick={() => setModal(null)}>
          <div className="eva-card" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === "settings" ? "Settings" : modal === "menu" ? "Menu" : modal === "check" ? "Check" : "Calls"}</h3>
            <p>{modal === "settings" ? "Profile • Privacy • Notifications • Storage — all open, no lock" : modal === "menu" ? "New Group • New Broadcast • Linked Devices • Settings" : modal === "check" ? "Check tab is open. No lock." : "Calls tab is open. No lock."}</p>
            <button className="ghost" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
