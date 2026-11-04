"use client";
import { useState } from "react";

export default function EVA() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const askEVA = () => {
    if (!text) return;
    setIsSpeaking(true);
    const q = text;
    setText("");
    setReply("EVA dey hear you: '" + q + "' — I'm here, Tim.");
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  return (
    <div style={{ height: "100dvh", width: "100%", background: "transparent", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "relative" }}>

      {/* TOP - 3 DOTS ONLY, VERY TRANSPARENT */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 18px" }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 38, height: 38, borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 20, backdropFilter: "blur(4px)" }}>⋮</button>
          {showMenu && (
            <div style={{ position: "absolute", top: 46, right: 0, width: 160, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(10px)", zIndex: 50 }}>
              <button onClick={() => { setShowMenu(false); setReply("🕒 History: Your past chats go show here."); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "12px 16px" }}>🕒 History</button>
              <button onClick={() => { setShowMenu(false); setReply("⚙️ Settings: Theme, voice, how EVA go talk."); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "12px 16px" }}>⚙️ Settings</button>
              <button onClick={() => { setShowMenu(false); setReply("⋯ More: About EVA, Help, Share."); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "12px 16px" }}>⋯ More</button>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE - THE LOCKED DROPLET - NO SQUARE, VERY TRANSPARENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

        {/* DROPLET */}
        <div style={{
          width: 210, height: 270,
          // DROPLET SHAPE - NO SQUARE
          borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
          // VERY VERY TRANSPARENT - SEE THROUGH WALLPAPER
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(2px)",
          // LITTLE BLUE LIGHT FOR SIDES ONLY - NOT TOO MUCH
          boxShadow: `
            inset 8px 0 18px rgba(80,180,255,0.18),
            inset -8px 0 18px rgba(80,180,255,0.18),
            0 0 12px rgba(80,180,255,0.12)
          `,
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          animation: "floatEVA 4s ease-in-out infinite",
          // POINT AT TOP LIKE REAL DROPLET
          clipPath: "none",
        }}>
          {/* TOP POINT */}
          <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", width: 34, height: 34, background: "rgba(255,255,255,0.04)", borderLeft: "1px solid rgba(255,255,255,0.18)", borderTop: "1px solid rgba(255,255,255,0.18)", borderRadius: "50% 0 0 0", rotate: "45deg", backdropFilter: "blur(2px)" }} />

          {/* CENTER LIGHT - SOFT, NOT TOO MUCH - LOCKED */}
          <b style={{
            fontSize: 42, letterSpacing: 3, color: "#bfe8ff",
            textShadow: isSpeaking ? "0 0 18px rgba(140,210,255,0.85), 0 0 6px rgba(255,255,255,0.6)" : "0 0 10px rgba(140,210,255,0.55), 0 0 3px rgba(255,255,255,0.4)",
            zIndex: 2
          }}>EVA</b>

          {/* SMALL SHINE INSIDE */}
          <div style={{ position: "absolute", top: 32, left: 34, width: 26, height: 52, background: "rgba(255,255,255,0.22)", borderRadius: 999, filter: "blur(4px)", rotate: "18deg" }} />
        </div>

        {/* REPLY - ALSO TRANSPARENT, NO SQUARE BLOCK */}
        {reply && <div style={{ marginTop: 18, padding: "10px 16px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, fontSize: 13, maxWidth: "85%", textAlign: "center", backdropFilter: "blur(6px)" }}>{reply}</div>}
      </div>

      {/* BOTTOM - ASK + DISCOVER - VERY TRANSPARENT TOO */}
      <div style={{ padding: "10px 16px 18px" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", padding: 7, borderRadius: 999, backdropFilter: "blur(6px)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Ask EVA..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px", fontSize: 15 }} />
          <button onClick={askEVA} style={{ background: "rgba(139,92,246,0.85)", border: "none", color: "white", padding: "9px 16px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>
        <div style={{ display: "flex", maxWidth: 520, margin: "10px auto 0" }}>
          <button onClick={() => setReply("✨ Discover: Try 'Give me calm routine', 'Plan my day'")} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", color: "white", padding: "8px 15px", borderRadius: 999, fontSize: 13, backdropFilter: "blur(6px)" }}>✨ Discover</button>
        </div>
      </div>

      <style>{`@keyframes floatEVA { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-8px);} }`}</style>
    </div>
  );
}
