"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Msg = { text: string; from: string; seen: boolean; live?: boolean; video?: string; time: number }

const names: Record<string, string> = { ada: "Ada", group: "EVA Group - Lagos", tunde: "Tunde", "1": "Test Chat 1", "2": "Test Chat 2", "3": "Test Chat 3" }
const avatars: Record<string, string> = { ada: "A", group: "G", tunde: "T", "1": "", "2": "", "3": "" }

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const [messages, setMessages] = useState<Msg[]>([])
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const myName = typeof window !== "undefined" ? localStorage.getItem("eva_name") || "You" : "You"

  const loadMsgs = () => {
    try { setMessages(JSON.parse(localStorage.getItem("eva_msgs_" + chatId) || "[]")) } catch { setMessages([]) }
  }

  // MARK SEEN -> TICK TURNS ✓✓
  const markSeen = () => {
    try {
      const arr: Msg[] = JSON.parse(localStorage.getItem("eva_msgs_" + chatId) || "[]")
      let changed = false
      arr.forEach((m) => { if (m.from !== myName && !m.seen) { m.seen = true; changed = true } })
      if (changed) {
        localStorage.setItem("eva_msgs_" + chatId, JSON.stringify(arr))
        setMessages(arr)
        const bc = new BroadcastChannel("eva_live")
        bc.postMessage({ type: "seen", chatId })
        bc.close()
      }
    } catch {}
  }

  useEffect(() => {
    setName(names[chatId] || "Chat")
    loadMsgs()
    markSeen()
    const onStorage = (e: StorageEvent) => { if (e.key === "eva_msgs_" + chatId) { loadMsgs(); markSeen() } }
    window.addEventListener("storage", onStorage)
    const bc = new BroadcastChannel("eva_live")
    bc.onmessage = (e) => { if (e.data.chatId === chatId) { loadMsgs(); markSeen() } }
    return () => { window.removeEventListener("storage", onStorage); bc.close() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "auto" }) }, [messages])

  const save = (msg: Msg) => {
    const arr = [...messages, msg]
    localStorage.setItem("eva_msgs_" + chatId, JSON.stringify(arr))
    setMessages(arr)
    const bc = new BroadcastChannel("eva_live")
    bc.postMessage({ type: "msg", chatId, msg })
    bc.close()
  }

  const sendMsg = () => {
    if (!text.trim()) return
    save({ text, from: myName, seen: false, time: Date.now() })
    setText("")
  }

  const sendLive = () => {
    save({ text: "Live Memo", from: myName, seen: false, live: true, video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", time: Date.now() })
  }

  return (
    <div className="eva-app">
      <div className="eva-chat-head">
        <button className="eva-icon-btn" onClick={() => router.push("/chat")}>←</button>
        <div className="eva-droplet small"><span className="eva-initial">{avatars[chatId] || ""}</span></div>
        <div style={{ flex: 1 }}><b>{name}</b><div style={{ fontSize: 12, color: "#4ade80" }}>Online • Live</div></div>
        <button className="eva-icon-btn">⋮</button>
      </div>

      <div className="eva-msgs">
        {messages.map((m, i) => (
          <div key={i} className={`eva-bubble ${m.from === myName ? "me" : "other"}`}>
            {m.live ? (<><video src={m.video} autoPlay muted loop playsInline style={{ width: "100%", borderRadius: 12 }} /><div>Live Memo • 7s loop 🔁</div></>) : (m.text)}
            {m.from === myName && <span className="eva-tick">{m.seen ? "✓✓" : "✓"}</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="eva-input-row">
        <button className="eva-live-btn" onClick={sendLive}>● Live 7s</button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
        <button className="eva-send" onClick={sendMsg}>➤</button>
      </div>
    </div>
  )
    }
