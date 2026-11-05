"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EVA() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const askEVA = () => {
    if (!text) return;
    setReply("EVA dey hear you: '" + text + "' — I'm here. Tell me more.");
    setText("");
  };

  const openDiscover = () => {
    setReply("✨ Discover: Try ask me - 'Give me a calm routine', 'Help me plan my day', or 'Scan my mood'");
  };

  const openChat = () => {
    router.push("/chat");
  };

  const menuClick = (item) => {
    setShowMenu(false);
    if (item === "History") setReply("[STRIPPED 3 bytes] history: Your past chats go show here. For now, your last question na the one you just ask.");
    if (item === "Settings") setReply("⚙️ Settings: Here you go fit change theme, voice, and how EVA go talk to you.");
    if (item === "More") setReply("⋯ More: About EVA, Help, Share EVA, and Clear chat go dey here.");
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

      {/* MIDDLE - ONLY REPLY */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 20px" }} onClick={() => setShowMenu(false)}>
        {reply && <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, width: "100%", maxWidth: 420 }}>{reply}</div>}
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
