"use client";
import { useState } from "react";

export default function EVA() {
  const [speaking, setSpeaking] = useState(false);
  const [mood, setMood] = useState("normal"); // normal | happy | surprised

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#05001a", display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>

      {/* 1. YOUR FINE IMAGE - WATER + FACE + COLORS */}
      <img src="/eva-bg.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      {/* 2. MOTION DIMENSIONAL LINES - DEY MOVE */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.22) 1px, transparent 1px)", backgroundSize: "40px 40px", transform: "perspective(500px) rotateX(60deg) scale(1.8)", transformOrigin: "bottom", animation: "moveGrid 2s linear infinite", opacity: 0.45, pointerEvents: "none" }} />

      {/* 3. FLOATING GLOW DOTS */}
      <div style={{ position: "absolute", top: "20%", left: "20%", width: 6, height: 6, background: "#38bdf8", borderRadius: "50%", boxShadow: "0 0 15px #38bdf8", animation: "float 3s infinite" }} />
      <div style={{ position: "absolute", top: "60%", right: "15%", width: 5, height: 5, background: "#a78bfa", borderRadius: "50%", boxShadow: "0 0 15px #a78bfa", animation: "float 4s infinite" }} />

      {/* 4. FACE LEVEL 1 - BREATHE + BLINK OVERLAY ON TOP OF FACE AREA */}
      {/* This na the face zone - e dey breathe, e go blink */}
      <div style={{ position: "absolute", top: "31%", left: "50%", transform: "translateX(-50%)", width: "62%", height: "32%", zIndex: 2, pointerEvents: "none", animation: "breathe 4s ease-in-out infinite" }}>
        {/* Blink - black bar wey go flash like eyelid */}
        <div style={{ position: "absolute", top: "22%", left: "15%", right: "15%", height: 2, background: "rgba(0,0,0,0.0)", animation: "blink 4.5s infinite" }} />
        {/* Mouth move when EVA dey talk */}
        {speaking && <div style={{ position: "absolute", bottom: "18%", left: "50%", transform: "translateX(-50%)", width: 28, height: 6, background: "rgba(255,150,150,0.6)", borderRadius: "50%", animation: "mouth 0.3s infinite" }} />}
      </div>

      {/* TOP */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", position: "relative", zIndex: 3, color: "white" }}>
        <span>🟣 EVA</span>
        <span style={{ background: "rgba(124,58,237,0.4)", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>Discover</span>
      </div>

      {/* CLICKABLE ZONES - INVISIBLE BUT WORKING */}
      {/* LEFT - SCAN */}
      <button onClick={() => alert("Scan open!")} style={{ position: "absolute", top: "34%", left: "9%", width: 75, height: 110, zIndex: 4, background: "transparent", border: "none", cursor: "pointer" }} />
      {/* RIGHT - CHAT */}
      <button onClick={() => alert("Chat open!")} style={{ position: "absolute", top: "50%", right: "9%", width: 75, height: 110, zIndex: 4, background: "transparent", border: "none", cursor: "pointer" }} />
      {/* CENTER - EVA FACE - TAP TO TALK */}
      <button onClick={() => { setSpeaking(!speaking); setMood("happy"); }} style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", width: 250, height: 340, zIndex: 3, background: "transparent", border: "none", cursor: "pointer" }} />

      <div style={{ flex: 1 }} />

      {/* ASK EVA BAR */}
      <div style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "12px 16px", borderRadius: 30, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 5, color: "white" }}>
        <span>Ask EVA...</span>
        <span onClick={() => setSpeaking(!speaking)} style={{ cursor: "pointer" }}>🎙️ ➕</span>
      </div>

      <style>{`
        @keyframes moveGrid { 0%{background-position: 0 0} 100%{background-position: 0 40px} }
        @keyframes float { 0%,100%{transform: translateY(0)} 50%{transform: translateY(-15px)} }
        @keyframes breathe { 0%,100%{transform: translateX(-50%) scale(1)} 50%{transform: translateX(-50%) scale(1.015)} }
        @keyframes blink { 0%,92%,100%{opacity:0} 94%{opacity:1} 96%{opacity:0} }
        @keyframes mouth { 0%,100%{transform: translateX(-50%) scaleY(1)} 50%{transform: translateX(-50%) scaleY(1.8)} }
      `}</style>
    </div>
  );
                                                         }
