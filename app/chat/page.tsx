"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function ChatList() {
  const router = useRouter()
  const [lastMsgs, setLastMsgs] = useState({})
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")

  // Original EVA chats - keep your design
  const baseChats = [
    { id: "Ada", name: "Ada", avatar: "👩🏾", time: "2:15 PM", unread: 2, live: true },
    { id: "EVA Group - Lagos", name: "EVA Group - Lagos", avatar: "👥", time: "1:40 PM", unread: 5, live: false },
    { id: "Tunde", name: "Tunde", avatar: "👨🏾", time: "11:20 AM", unread: 0, live: true },
    { id: "1", name: "Test Chat 1", avatar: "💧", time: "", unread: 0, live: false },
    { id: "2", name: "Test Chat 2", avatar: "💧", time: "", unread: 0, live: false },
    { id: "3", name: "Test Chat 3", avatar: "💧", time: "", unread: 0, live: false },
  ]

  useEffect(() => {
    let n = localStorage.getItem("eva_name") || "Guest"
    setName(n)
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false })
      if (!data) return
      const map = {}
      data.forEach(m => { if (!map[m.chat_id]) map[m.chat_id] = m })
      setLastMsgs(map)
    }
    load()
    const ch = supabase.channel("chat-list").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
      setLastMsgs(prev => ({ ...prev, [p.new.chat_id]: p.new }))
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const filtered = baseChats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const getPreview = (chat) => {
    // If real message don come for that chat, show am. If not, show old demo text
    if (lastMsgs[chat.id]) return lastMsgs[chat.id].sender + ": " + lastMsgs[chat.id].text
    if (chat.id === "Ada") return "I don see your live sticker"
    if (chat.id === "EVA Group - Lagos") return "Tunde: Who dey come?"
    if (chat.id === "Tunde") return "Send me that 7s sticker"
    return "No message yet. Tap to start"
  }

  const getTime = (chat) => {
    if (lastMsgs[chat.id]) return new Date(lastMsgs[chat.id].created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return chat.time
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", background: "#0b0b12", minHeight: "100dvh", color: "#fff", display: "flex", flexDirection: "column", userSelect: "none", WebkitUserSelect: "none" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💧</div>
          <b style={{ fontSize: 20 }}>EVA 💧</b>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 20 }}>
          <span>⚙️</span><span>⋮</span>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ padding: "0 16px 12px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or start new chat" style={{ width: "100%", padding: 12, borderRadius: 20, border: "1px solid #333", background: "#1e1e2e", color: "#fff", outline: "none" }} />
      </div>

      {/* LIST */}
      <div style={{ flex: 1 }}>
        {filtered.map(chat => (
          <div key={chat.id} onClick={() => router.push("/chat/" + chat.id)} style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1e1e2e", cursor: "pointer", alignItems: "center" }}>
            <div style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: "#2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {chat.avatar}
              {chat.live && <span style={{ position: "absolute", bottom: 0, right: 0, background: "#ef4444", color: "#fff", fontSize: 9, padding: "2px 5px", borderRadius: 10 }}>Live</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{chat.name}</div>
              <div style={{ color: "#aaa", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getPreview(chat)}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: "#888" }}>{getTime(chat)}</div>
              {chat.unread > 0 && !lastMsgs[chat.id] && <div style={{ background: "#7c3aed", color: "#fff", fontSize: 12, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", marginTop: 4 }}>{chat.unread}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* NEW CHAT BUTTON */}
      <button onClick={() => router.push("/chat/3")} style={{ position: "fixed", bottom: 80, right: 20, width: 56, height: 56, borderRadius: "50%", background: "#7c3aed", color: "#fff", border: "none", fontSize: 22 }}>💬</button>

      {/* BOTTOM NAV */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 0", background: "#1a1a2e", borderTop: "1px solid #2a2a3a" }}>
        <div style={{ textAlign: "center", fontSize: 12 }}>💬<br/>Chats</div>
        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.6 }}>◎<br/>Check</div>
        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.6 }}>📞<br/>Calls</div>
      </div>
    </div>
  )
    }
