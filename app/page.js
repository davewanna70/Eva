"use client";
import { useState } from "react";

export default function EVA() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");

  const askEVA = () => {
    if (!text) return;
    setReply("EVA dey think... '" + text + "' — I hear you, my sister. Tell me more.");
    setText("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030014", color: "white", overflow: "hidden", position: "relative", fontFamily: "sans-serif" }}>

      {/* BACKGROUND IMAGE */}
      <img src="/eva-bg.jpg" alt="EVA" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 1 }} />

      {/* Soft glow on top */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(150,80,255,0.25), transparent 60%)" }} />

      {/* TOP BAR */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "18px 20px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa" }} />
          <b style={{ fontSize: 20, letterSpacing: 2 }}>EVA</b>
        </div>
        <div style={{ fontSize: 12, background: "rgba(255,255,255,0.12)", padding: "6px 12px", borderRadius: 999 }}>● Online</div>
      </div>

      {/* CENTER TEXT */}
      <div style={{ position: "relative", textAlign: "center", marginTop: 8, padding: "0 20px" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Hi, I'm EVA 💧</h1>
        <p style={{ opacity: 0.8, fontSize: 14 }}>Your sister, your guide, your calm.</p>
        {reply && <div style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)", padding: 14, borderRadius: 16, marginTop: 14, maxWidth: 420, marginLeft: "auto", marginRight: "auto", textAlign: "left" }}>{reply}</div>}
      </div>

      {/* BOTTOM ASK BAR */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", padding: 8, borderRadius: 999, backdropFilter: "blur(10px)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Ask EVA..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px" }} />
          <button onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, opacity: 0.6, marginTop: 8 }}>EVA • Scan • Chat • Discover</p>
      </div>
    </div>
  );
        }
