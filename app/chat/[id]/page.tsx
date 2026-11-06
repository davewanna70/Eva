"use client"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    let n = localStorage.getItem("eva_name")
    if (!n) {
      n = prompt("Wetin be your name?") || "Guest"
      localStorage.setItem("eva_name", n)
    }
    setName(n)
  }, [])

  useEffect(() => {
    if (!chatId) return
    setLoading(true)
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel("chat-" + chatId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prev) => {
          // no duplicate if optimistic message already dey
          if (prev.some(m => m.id === payload.new.id)) return prev
          // replace temp message with real one
          const idx = prev.findIndex(m => m.tempId && m.text === payload.new.text && m.sender === payload.new.sender)
          if (idx !== -1) {
            const copy = [...prev]
            copy[idx] = { ...payload.new, status: "delivered" }
            return copy
          }
          return [...prev, { ...payload.new, status: "delivered" }]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const msgText = text
    setText("")
    const tempId = "temp-" + Date.now()
    // 1. SHOW INSTANTLY - no wait Supabase
    setMessages((prev) => [...prev, { id: tempId, tempId, chat_id: chatId, sender: name || "Guest", text: msgText, created_at: new Date().toISOString(), status: "sending" }])

    const { data, error } = await supabase.from("messages").insert([
      { chat_id: chatId, sender: name || "Guest", text: msgText }
    ]).select().single()

    if (error) {
      // if e fail, mark am
      setMessages((prev) => prev.map(m => m.tempId === tempId ? { ...m, status: "failed" } : m))
    } else if (data) {
      setMessages((prev) => prev.map(m => m.tempId === tempId ? { ...data, status: "sent" } : m))
    }
  }

  const tick = (m) => {
    if (m.status === "sending") return "🕐"
    if (m.status === "failed") return "❌ Tap to retry"
    if (m.status === "delivered") return "✓✓"
    return "✓"
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", height: "100dvh", background: "#0b0b12", color: "#fff", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
      {/* 2026 HEADER - no more Back button box */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", background: "#1a1a2e", borderBottom: "1px solid #2a2a3a" }}>
        <button onClick={() => router.push("/chat")} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💧</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>EVA Chat • {chatId}</div>
          <div style={{ fontSize: 12, color: "#4ade80" }}>● Online</div>
        </div>
        <span style={{ fontSize: 12, color: "#aaa" }}>{name}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
        {loading ? null : messages.length === 0 ? <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No message yet. Start the conversation 👇</p> : null}
        {messages.map((m) => {
          const mine = m.sender === name
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", background: mine ? "#7c3aed" : "#1e1e2e", color: "#fff", padding: "8px 12px", borderRadius: 16, maxWidth: "80%" }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{m.sender}</div>
              <div>{m.text}</div>
              <div style={{ fontSize: 11, textAlign: "right", opacity: 0.8, color: m.status === "delivered" ? "#60a5fa" : "#ccc" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {mine ? tick(m) : ""}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, background: "#1a1a2e" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." autoComplete="off" style={{ flex: 1, padding: 12, borderRadius: 20, border: "1px solid #333", background: "#0b0b12", color: "#fff", outline: "none" }} />
        <button type="submit" style={{ padding: "12px 20px", borderRadius: 20, background: "#7c3aed", color: "#fff", border: "none" }}>Send</button>
      </form>
    </div>
  )
}
