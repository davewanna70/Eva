"use client";

export default function EVA() {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", padding: 16, overflow: "hidden" }}>
      
      {/* TOP */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between" }}>
        <span>🟣 EVA</span>
        <span style={{ background: "rgba(124,58,237,0.3)", padding: "4px 12px", borderRadius: 20, fontSize: 12, border: "1px solid rgba(255,255,255,0.2)" }}>Discover</span>
      </div>

      {/* 3 DROPLETS - ALL VERY VERY TRANSPARENT */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginTop: 20, width: "100%", maxWidth: 420 }}>

        {/* LEFT SMALL DROPLET - TRANSPARENT */}
        <div style={{
          width: 70, height: 110,
          clipPath: "path('M35 0 C 50 30, 65 55, 65 75 C 65 95, 50 110, 35 110 C 20 110, 5 95, 5 75 C 5 55, 20 30, 35 0 Z')",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(56,189,248,0.25)",
          boxShadow: "0 0 15px rgba(56,189,248,0.1) inset",
          backdropFilter: "blur(1px)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: 0.7
        }}>
          💬
        </div>

        {/* CENTER BIG DROPLET - TRANSPARENT AS FUCK */}
        <div style={{ position: "relative", width: 230, height: 330 }}>
          <div style={{
            position: "absolute", inset: 0,
            clipPath: "path('M115 0 C 145 70, 200 150, 200 220 C 200 285, 165 330, 115 330 C 65 330, 30 285, 30 220 C 30 150, 85 70, 115 0 Z')",
            background: "rgba(255,255,255,0.02)", // see through well well
            border: "1px solid rgba(56,189,248,0.35)",
            boxShadow: "0 0 20px rgba(56,189,248,0.08) inset",
            backdropFilter: "blur(1px)",
            overflow: "hidden",
          }}>
            {/* 3D GRID - VERY FAINT */}
            <div style={{ position: "absolute", bottom: 0, width: "100%", height: "45%", backgroundImage: "linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)", backgroundSize: "20px 20px", transform: "perspective(200px) rotateX(60deg)", opacity: 0.5 }} />
            
            {/* SCANNING LINE - SOFT */}
            <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "rgba(56,189,248,0.6)", boxShadow: "0 0 8px rgba(56,189,248,0.4)", animation: "scan 2.5s infinite" }} />

            {/* SYMBOLS INSIDE - SMALL, SPREAD */}
            <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: 22, opacity: 0.8 }}>🔍</div>
              <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: 2, marginTop: 4 }}>EVA</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12, fontSize: 13, opacity: 0.7 }}>
                <span>💬</span><span>🎙️</span><span>🌍</span><span>❤️</span>
              </div>
              {/* SMALL FAINT BLUE GLOW - NO SOLID BALL */}
              <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "14px auto", background: "radial-gradient(circle, rgba(14,165,233,0.5) 0%, rgba(14,165,233,0) 70%)", filter: "blur(1px)" }} />
            </div>
          </div>
        </div>

        {/* RIGHT SMALL DROPLET - TRANSPARENT */}
        <div style={{
          width: 70, height: 110,
          clipPath: "path('M35 0 C 50 30, 65 55, 65 75 C 65 95, 50 110, 35 110 C 20 110, 5 95, 5 75 C 5 55, 20 30, 35 0 Z')",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(56,189,248,0.25)",
          boxShadow: "0 0 15px rgba(56,189,248,0.1) inset",
          backdropFilter: "blur(1px)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: 0.7
        }}>
          🎙️
        </div>
      </div>

      {/* ASK EVA BAR - TRANSPARENT TOO */}
      <div style={{ width: "100%", maxWidth: 420, marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: 12, borderRadius: 30, textAlign: "center", color: "#94a3b8" }}>
        Ask EVA...
      </div>

      <style>{`@keyframes scan { 0%{top:10%} 50%{top:80%} 100%{top:10%} }`}</style>
    </div>
  );
}
