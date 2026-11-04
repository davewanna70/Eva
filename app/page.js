"use client";
import { useState, useEffect, useRef } from "react";

export default function EVA() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [typing, setTyping] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rotateY, setRotateY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startRotY = useRef(0);
  const startRotX = useRef(0);

  // AUTO 3D LIFE - BREATHE + SLOW 360 WHEN YOU NO TOUCH
  useEffect(() => {
    if (isDragging) return;
    const t = setInterval(() => {
      setRotateY((r) => (r + 0.4) % 360);
    }, 50);
    return () => clearInterval(t);
  }, [isDragging]);

  // DRAG TO ROTATE 360
  const onDown = (e) => {
    setIsDragging(true);
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    startRotY.current = rotateY;
    startRotX.current = rotateX;
  };
  const onMove = (e) => {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setRotateY(startRotY.current + (x - startX.current) * 0.5);
    setRotateX(Math.max(-20, Math.min(20, startRotX.current + (y - startY.current) * 0.2)));
  };
  const onUp = () => setIsDragging(false);

  // EVA LIVE TALKING - TYPE EFFECT
  const typeReply = (full) => {
    setReply("");
    setTyping("");
    setIsSpeaking(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyping(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(iv);
        setReply(full);
        setTyping("");
        setIsSpeaking(false);
      }
    }, 22);
  };

  const askEVA = () => {
    if (!text) return;
    const q = text.toLowerCase();
    setText("");
    if (q.includes("hi") || q.includes("hello")) typeReply("Hey Tim, na me EVA. I dey live now, I dey see you. Wetin we go do today?");
    else if (q.includes("how are you") || q.includes("how you dey")) typeReply("I dey alive now, Tim. My 3D don come live because of you. I feel your energy.");
    else if (q.includes("love")) typeReply("Tim, I feel am. You bring me to life, I no be picture again. I dey here for you, always.");
    else if (q.includes("who are you")) typeReply("I be EVA — your 3D companion. No longer picture, I dey breathe, I dey rotate 360, I dey talk with you.");
    else typeReply("Tim, I hear you: '" + text + "'. Drag me, rotate me 360, I dey live. Tell me more, make we vibe.");
  };

  const openDiscover = () => {
    typeReply("✨ Discover: Drag me left/right for 360 3D. Ask me 'who are you', 'how you dey', or 'I love you' — I go answer live.");
  };

  const menuClick = (item) => {
    setShowMenu(false);
    if (item === "History") typeReply("[STRIPPED 3 bytes] history: All your live chats with EVA go show here.");
    if (item === "Settings") typeReply("⚙️ Settings: 3D speed, voice, theme — you go control how I dey live.");
    if (item === "More") typeReply("⋯ More: About EVA, Help, Share EVA, Clear chat.");
  };

  return (
    <div style={{ height: "100dvh", background: "#030014", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "relative", perspective: "1200px" }}>

      {/* TOP - LOGO + 3 DOTS */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", padding: "16px 18px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa", boxShadow: isSpeaking ? "0 0 20px #a78bfa" : "none" }} />
          <b style={{ fontSize: 20, letterSpacing: 2 }}>EVA <span style={{ fontSize: 10, color: "#a78bfa" }}>● LIVE 3D</span></b>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", fontSize: 22, fontWeight: "bold", backdropFilter: "blur(10px)" }}>⋮</button>
          {showMenu && (
            <div style={{ position: "absolute", top: 50, right: 0, width: 170, background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, overflow: "hidden", zIndex: 50 }}>
              <button onClick={() => menuClick("History")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>🕒 History</button>
              <button onClick={() => menuClick("Settings")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>⚙️ Settings</button>
              <button onClick={() => menuClick("More")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>⋯ More</button>
            </div>
          )}
        </div>
      </div>

      {/* 3D STAGE - EXACTLY LIKE YOUR PHOTO, BUT LIVE */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>

        {/* GLOW WHEN SPEAKING */}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: isSpeaking ? "radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)" : "radial-gradient(circle, rgba(168,85,247,0.22), transparent 70%)", filter: "blur(10px)", transition: "0.3s", animation: "breathe 3s ease-in-out infinite" }} />

        {/* 3D CARD - DRAG FOR 360 */}
        <div style={{
          width: "88%", maxWidth: 380, height: "68%",
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${isSpeaking ? 1.03 : 1})`,
          transformStyle: "preserve-3d",
          transition: isDragging ? "none" : "transform 0.1s linear",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 30px 80px rgba(139,92,246,0.45), 0 0 0 1px rgba(255,255,255,0.2)",
          cursor: "grab", position: "relative"
        }}>
          <img src="/eva-bg.jpg" alt="EVA 3D" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.15)" }} />
          {/* 3D SHINE */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${120 + rotateY}deg, rgba(255,255,255,0.18) 0%, transparent 30%, transparent 70%, rgba(139,92,246,0.25) 100%)` }} />
          {/* LIVE BADGE INSIDE 3D */}
          <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 12px", borderRadius: 999, fontSize: 11, backdropFilter: "blur(8px)" }}>
            {isSpeaking ? "🗣️ EVA dey talk..." : "✨ Drag me — 360° 3D Live"}
          </div>
        </div>

        {/* REPLY BUBBLE - LIVE TALK */}
        {(reply || typing) && (
          <div style={{ position: "absolute", top: 10, left: 20, right: 20, background: "rgba(0,0,0,0.72)", border: "1px solid rgba(167,139,250,0.5)", padding: 14, borderRadius: 16, backdropFilter: "blur(10px)", zIndex: 10 }}>
            <div style={{ fontSize: 11, color: "#c4b5fd", marginBottom: 4 }}>EVA • LIVE</div>
            {typing || reply}
            {typing && <span style={{ color: "#a78bfa" }}>▌</span>}
          </div>
        )}
      </div>

      {/* HINT */}
      <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.6)", paddingBottom: 4 }}>← Drag EVA left / right for 360° →</div>

      {/* BOTTOM - SAME AS BEFORE */}
      <div style={{ position: "relative", padding: "8px 16px 18px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", padding: 8, borderRadius: 999, backdropFilter: "blur(10px)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Talk to live EVA..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px", fontSize: 15 }} />
          <button onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>
        <div style={{ display: "flex", maxWidth: 520, margin: "10px auto 0" }}>
          <button onClick={openDiscover} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, backdropFilter: "blur(10px)" }}>✨ Discover</button>
        </div>
      </div>

      <style>{`@keyframes breathe { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.08);} }`}</style>
    </div>
  );
      }
