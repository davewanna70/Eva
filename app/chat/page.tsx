"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Chat = { id: string; name: string; avatar: string; video: string; image?: string; live?: boolean }

const baseChats: Chat[] = [
  { id: "ada", name: "Ada", avatar: "A", video: "/ada.mp4", image: "/ada.jpg", live: true },
  { id: "group", name: "EVA Group - Lagos", avatar: "G", video: "/group.mp4", image: "/group.jpg" },
  { id: "tunde", name: "Tunde", avatar: "T", video: "/tunde.mp4", image: "/tunde.jpg", live: true },
  { id: "1", name: "Test Chat 1", avatar: "", video: "/test1.mp4" },
  { id: "2", name: "Test Chat 2", avatar: "", video: "/test2.mp4" },
  { id: "3", name: "Test Chat 3", avatar: "", video: "/test3.mp4" },
]

// --- HARD DROPLET - ONE SINGLE GLASS, NO SQUARE, NO BLACK BACKGROUND ---
const DROPLET_CLIP = "path('M 31 0 C 48 28 62 52 62 66 C 62 78 48 86 31 86 C 14 86 0 78 0 66 C 0 52 14 28 31 0 Z')"

function Droplet({ chat, size = "small" }: { chat: Chat; size?: "small" | "large" }) {
  const isLarge = size === "large"
  const w = isLarge ? 150 : 62
  const h = isLarge ? 208 : 86
  const [videoFailed, setVideoFailed] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const hasVideo = !!chat.video && !videoFailed
  const hasImage = !!chat.image && !imgFailed && !hasVideo
  const showEmptyGlass = !hasVideo && !hasImage
  const firstLetter = (chat.avatar || chat.name.charAt(0) || "").toUpperCase()

  return (
    <div style={{ width: w, height: h, position: "relative", flexShrink: 0, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}>
      {/* GLASS BODY - transparent, light glass behind video so e no black */}
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          clipPath: DROPLET_CLIP,
          WebkitClipPath: DROPLET_CLIP,
          // LIGHT glass, not black - this na the fix for your screenshot
          background: "linear-gradient(160deg, rgba(255,255,255,0.65), rgba(200,230,255,0.35) 40%, rgba(255,255,255,0.25))",
          position: "relative",
        }}
      >
        {hasVideo ? (
          <video
            src={chat.video}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "transparent" }}
          />
        ) : null}

        {hasImage ? (
          <img
            src={chat.image}
            alt={chat.name}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}

        {/* EMPTY GLASS - first letter inside SAME droplet, for top tip */}
        {showEmptyGlass && (
          <div
            style={{
              position: "absolute",
              top: isLarge ? 22 : 9,
              left: 0,
              right: 0,
              textAlign: "center",
              color: "white",
              fontWeight: 800,
              fontSize: isLarge ? 34 : 16,
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              lineHeight: 1,
            }}
          >
            {firstLetter}
          </div>
        )}
      </div>

      {/* GLASS SHINE - SOFTER, no white block, still same droplet */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          clipPath: DROPLET_CLIP,
          WebkitClipPath: DROPLET_CLIP,
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 20%, transparent 40%, transparent 75%, rgba(255,255,255,0.18) 90%)",
        }}
      />
      {/* THIN GLASS RIM - light, no dark border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          clipPath: DROPLET_CLIP,
          WebkitClipPath: DROPLET_CLIP,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45)",
        }}
      />
    </div>
  )
}

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
        <div className="eva-logo">EVA</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="eva-icon-btn" onClick={() => setModal("settings")}>⚙️</button>
          <button className="eva-icon-btn" onClick={() => setModal("menu")}>⋮</button>
        </div>
      </div>

      <div className="eva-search">Search or start new chat</div>

      <div className="eva-list">
        {baseChats.map((c) => (
          <div key={c.id} className="eva-row">
            {/* CLICK DROPLET = MINI PROFILE, ONE DROPLET, VIDEO FULL INSIDE */}
            <div className="eva-drop-wrap" onClick={() => setProfile(c)} style={{ position: "relative" }}>
              <Droplet chat={c} size="small" />
              {c.live && <div className="eva-live-badge">Live</div>}
            </div>
            {/* CLICK NAME = OPEN CHAT - NAME LIKE WHATSAPP, BESIDE DROPLET */}
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

      {/* MINI PROFILE PREVIEW - VIDEO INSIDE DROPLET TOO */}
      {profile && (
        <div className="eva-modal" onClick={() => setProfile(null)}>
          <div className="eva-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Droplet chat={profile} size="large" />
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
