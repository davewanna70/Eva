"use client";
import { useState } from "react";

export default function EVA() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");

  const askEVA = () => {
    if (!text) return;
    setReply("EVA dey hear you: '" + text + "' — I'm here. Tell me more.");
    setText("");
  };

  const openDiscover = () => {
    setReply("✨ Discover: Try ask me - 'Give me a calm routine', 'Help me plan my day', or 'Scan my mood'");
  };

  return (
    <div style={{ height: "100dvh", background: "#030014", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "relative" }}>

      {/* BACKGROUND - CLEAN, NO ZOOM, ORIGINAL FRAMING */}
      <img src="/eva-bg.jpg" alt="EVA" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(150,80,255,0.12), transparent 60%)" }} />

      {/* TOP - ONLY LOGO + EVA, NO ONLINE, NO HI */}
      <div style={{ position: "relative", display: "flex", padding: "16px 18px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa" }} />
          <b style={{ fontSize: 20, letterSpacing: 2 }}>EVA</b>
        </div>
      </div>

      {/* MIDDLE - EMPTY, ONLY REPLY WHEN YOU ASK OR PRESS DISCOVER */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 20px" }}>
        {reply && <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, width: "100%", maxWidth: 420 }}>{reply}</div>}
      </div>

      {/* BOTTOM - ONLY ONE ASK BAR + REAL DISCOVER */}
      <div style={{ position: "relative", padding: "12px 16px 18px", background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.3)", padding: 8, borderRadius: 999 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Ask EVA..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px", fontSize: 15 }} />
          <button onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>

        {/* REAL DISCOVER BUTTON - BOTTOM LEFT LIKE ORIGINAL */}
        <div style={{ display: "flex", maxWidth: 520, margin: "10px auto 0" }}>
          <button onClick={openDiscover} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            ✨ Discover
          </button>
        </div>
      </div>

    </div>
  );
              }
