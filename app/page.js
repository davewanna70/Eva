"use client";

export default function EVA() {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
      
      {/* TOP */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between" }}>
        <span>🟣 EVA</span>
        <span style={{ background: "#7c3aed", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>Discover</span>
      </div>

      {/* DROPLET - VERY VERY TRANSPARENT */}
      <div style={{ position: "relative", width: 280, height: 380, marginTop: 20 }}>
        <div style={{
          position: "absolute", inset: 0,
          clipPath: "path('M140 0 C 180 90, 250 180, 250 260 C 250 330, 200 380, 140 380 C 80 380, 30 330, 30 260 C 30 180, 100 90, 140 0 Z')",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(56,189,248,0.4)",
          boxShadow: "0 0 40px rgba(56,189,248,0.25) inset",
          overflow: "hidden",
        }}>
          {/* 3D GRID INSIDE */}
          <div style={{ position: "absolute", bottom: 0, width: "100%", height: "50%", backgroundImage: "linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.2) 1px, transparent 1px)", backgroundSize: "20px 20px", transform: "perspective(200px) rotateX(60deg)" }} />
          
          {/* SCANNING LINE */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#38bdf8", boxShadow: "0 0 10px #38bdf8", animation: "scan 2.5s infinite" }} />

          {/* SCANNING + CHAT SYMBOLS INSIDE */}
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 10, color: "#7dd3fc" }}>EVA</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, fontSize: 16 }}>
              <span>💬</span><span>🎙️</span><span>🌍</span><span>❤️</span>
            </div>
            <div style={{ width: 40, height: 40, background: "#0ea5e9", borderRadius: "50%", margin: "12px auto", boxShadow: "0 0 30px #0ea5e9" }} />
          </div>
        </div>
      </div>

      {/* ASK EVA BAR - LOOK ONLY FOR NOW */}
      <div style={{ width: "100%", maxWidth: 420, marginTop: 16, background: "#0f172a", padding: 12, borderRadius: 30, textAlign: "center", color: "#94a3b8" }}>
        Ask EVA...
      </div>

      <style>{`@keyframes scan { 0%{top:10%} 50%{top:80%} 100%{top:10%} }`}</style>
    </div>
  );
      }
