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
  const bottomRef = useRef(null)

  // Ask name once
  useEffect(() => {
    let n = localStorage.getItem("eva_name")
    if (!n) {
      n = prompt("Wetin be your name?") || "Guest"
      localStorage.setItem("eva_name", n)
    }
    setName(n)
  }, [])

  // Load old messages
  useEffect(() => {
    if (!chatId) return
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
    }
    load()

    // Live updates
    const channel = supabase
      .channel("chat-" + chatId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
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
    await supabase.from("messages").insert([
      { chat_id: chatId, sender: name || "Guest", text: msgText }
    ])
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => router.push("/chat")}>← Back</button>
        <b>EVA Chat • {chatId}</b>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>{name}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No message yet. Start the conversation 👇</p>}
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.sender === name ? "flex-end" : "flex-start", background: m.sender === name ? "#000" : "#eee", color: m.sender === name ? "#fff" : "#000", padding: "8px 12px", borderRadius: 16, maxWidth: "80%" }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{m.sender}</div>
            <div>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." style={{ flex: 1, padding: 12, borderRadius: 20, border: "1px solid #ccc" }} />
        <button type="submit" style={{ padding: "12px 20px", borderRadius: 20, background: "#000", color: "#fff", border: "none" }}>Send</button>
      </form>
    </div>
  )
            }
