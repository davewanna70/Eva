"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const getEVAReply = (userText) => {
    const lower = userText.toLowerCase();

    // Check if user started Pidgin first
    const pidginWords = ["dey", "wey", "na", "abi", "abeg", "wahala", "how far", "na you"];
    const userUsedPidgin = pidginWords.some((w) => lower.includes(w));

    if (userUsedPidgin) {
      if (lower.includes("hello") || lower.includes("how are you") || lower.includes("how far")) {
        return "Hello my person! I dey fine o. How your side? Wetin you want make we do today?";
      }
      if (lower.includes("who are you")) {
        return "I be EVA, your assistant for this app. I fit help you chat, plan, and find things. Wetin you need?";
      }
      if (lower.includes("thank")) {
        return "You welcome o! Anytime you need me, I dey here.";
      }
      if (lower.includes("calm routine") || lower.includes("routine")) {
        return "For a calm routine: 1. Drink water. 2. Take 5 slow breaths. 3. Write 3 things you want to do today. 4. Do the easiest one first. Do you want me to make one for your morning or evening?";
      }
      if (lower.includes("plan my day") || lower.includes("plan")) {
        return "Okay, let us plan your day. Tell me: What are the 3 most important things you need to do today? I will arrange them for you.";
      }
      if (lower.includes("mood") || lower.includes("scan")) {
        return "How you dey feel now? Tell me if you dey tired, stressed, happy, or sad, and I go suggest wetin fit help you.";
      }
      return "I hear you. Tell me small more make I fit help you well. You want make I explain am, plan am, or find am for you?";
    }

    // Default: Pure English for EVA
    if (lower.includes("hello") || lower.includes("how are you")) {
      return "Hello! I am doing well, thank you for asking. How are you doing today? What would you like us to work on?";
    }
    if (lower.includes("who are you")) {
      return "I am EVA, your personal assistant in this app. I can help you chat, plan, and find things. What do you need?";
    }
    if (lower.includes("thank")) {
      return "You are welcome. I am always here whenever you need me.";
    }
    if (lower.includes("calm routine") || lower.includes("routine")) {
      return "Here is a calm routine for you: 1. Drink water. 2. Take 5 slow breaths. 3. Write down 3 things you want to do today. 4. Start with the easiest one. Would you like one for morning or evening?";
    }
    if (lower.includes("plan my day") || lower.includes("plan")) {
      return "Let us plan your day. What are the 3 most important things you need to do today? Tell me and I will arrange them for you.";
    }
    if (lower.includes("mood") || lower.includes("scan")) {
      return "How are you feeling right now? Tell me if you feel tired, stressed, happy, or sad, and I will suggest what can help you.";
    }
    return "I understand. Could you tell me a little more so I can help you properly? Would you like me to explain it, plan it, or find it for you?";
  };

  const askEVA = () => {
    if (!text.trim()) return;
    const userText = text.trim();
    const reply = getEVAReply(userText);
    setMessages((prev) => [
      ...prev,
      { from: "you", text: userText },
      { from: "eva", text: reply },
    ]);
    setText("");
  };

  const addEVAMessage = (msg) => {
    setMessages((prev) => [...prev, { from: "eva", text: msg }]);
  };

  const openDiscover = () => {
    addEVAMessage("✨ Discover: Try ask me - 'Give me a calm routine', 'Help me plan my day', or 'Scan my mood'");
  };

  const openChat = () => {
    router.push("/chat");
  };

  const menuClick = (item) => {
    setShowMenu(false);
    if (item === "History") addEVAMessage("🕒 History: Your past chats will show here. For now, this is your current conversation.");
    if (item === "Settings") addEVAMessage("⚙️ Settings: Here you can change theme, voice, and how EVA talks to you.");
    if (item === "More") addEVAMessage("⋯ More: About EVA, Help, Share EVA, and Clear chat will be here.");
  };

  return (
    <div style={{ height: "100dvh", background: "#030014", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "relative" }}>

      {/* BACKGROUND - CLEAN, NO ZOOM */}
      <img src="/eva-bg.jpg" alt="EVA" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      {/* TOP - LOGO LEFT, 3 DOTS RIGHT */}
      <div style={{ position: "relative", display: "flex", padding: "16px 18px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa" }} />
          <b style={{ fontSize: 20, letterSpacing: 2 }}>EVA</b>
        </div>

        {/* 3 DOTS - VISIBLE LIKE DISCOVER */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", fontSize: 22, fontWeight: "bold", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>⋮</button>

          {showMenu && (
            <div style={{ position: "absolute", top: 50, right: 0, width: 170, background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(10px)", zIndex: 50 }}>
              <button onClick={() => menuClick("History")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>🕒 History</button>
              <button onClick={() => menuClick("Settings")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>⚙️ Settings</button>
              <button onClick={() => menuClick("More")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>⋯ More</button>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE - ALL MESSAGES, NOT ONLY ONE REPLY */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", padding: "0 20px 10px" }} onClick={() => setShowMenu(false)}>
        {messages.length === 0 && (
          <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, width: "100%", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            Hello, I am EVA. Ask me anything.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", background: m.from === "you" ? "#8b5cf6" : "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: "10px 14px", borderRadius: 16, maxWidth: "85%", fontSize: 14, lineHeight: 1.5 }}>
            {m.text}
          </div>
        ))}
      </div>

      {/* BOTTOM - AS E BE BEFORE, GREY GLASS + PURPLE BUTTON */}
      <div style={{ position: "relative", padding: "12px 16px 18px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
        
        {/* ASK BAR - BEFORE VERSION */}
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", padding: 8, borderRadius: 999, backdropFilter: "blur(10px)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Ask EVA..." autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px", fontSize: 15 }} />
          <button onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>

        {/* DISCOVER + CHAT - DISCOVER LEFT, CHAT RIGHT */}
        <div style={{ display: "flex", maxWidth: 520, margin: "10px auto 0", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={openDiscover} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)" }}>
            ✨ Discover
          </button>
          <button onClick={openChat} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)" }}>
            💬 Chat
          </button>
        </div>

      </div>

    </div>
  );
                        }
