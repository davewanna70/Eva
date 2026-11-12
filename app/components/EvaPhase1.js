"use client";
import { useEffect, useState } from "react";

const FEED = [
  { id: 1, type: "🎥 TikTok", title: "Viral TikTok - Tech Hologram", body: "Watch • Scroll • Check page", color: "#22d3ee" },
  { id: 2, type: "📰 LIVE NEWS", title: "Dollar High - Market Update", body: "Live - Dollar rising now", color: "#facc15" },
  { id: 3, type: "🗳️ ELECTION", title: "USA Mid-Election Live", body: "Results coming in live", color: "#a78bfa" },
  { id: 4, type: "🎥 VIDEO", title: "Space / Earth Live Feed", body: "Live video syncing", color: "#34d399" },
  { id: 5, type: "📈 MARKET", title: "Bitcoin / Stocks Crash?", body: "Live market movement", color: "#fb7185" },
];

export default function EvaPhase1() {
  const [search, setSearch] = useState("");
  const [pinned, setPinned] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 2000);
    return () => clearInterval(t);
  }, []);
  const filtered = FEED.filter(f => f.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position:"fixed", inset:0, background:"radial-gradient(circle at 50% 50%, #04121f, #000 75%)", overflow:"hidden", fontFamily:"sans-serif", color:"#fff" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes glow{0%,100%{box-shadow:0 0 15px rgba(34,211,238,.4)}50%{box-shadow:0 0 40px rgba(34,211,238,.9)}}`}</style>
      <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:20, display:"flex", gap:6, background:"rgba(8,47,73,.6)", border:"1px solid #22d3ee", borderRadius:999, padding:"6px 6px 6px 14px", backdropFilter:"blur(10px)", width:"min(420px, 90%)" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search inside Earth Orbit..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:13 }} />
        <button style={{ background:"#22d3ee", border:"none", borderRadius:999, padding:"8px 14px", fontWeight:800, cursor:"pointer" }}>SEARCH</button>
      </div>
      <div style={{ position:"absolute", left:"50%", top:"54%", transform:"translate(-50%,-50%)", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #1e3a8a, #020617 65%)", border:"2px solid #22d3ee", boxShadow:"0 0 70px #22d3ee", display:"flex", alignItems:"center", justifyContent:"center", fontSize:130, zIndex:5 }}>
        🌍
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"1px dashed #22d3ee", animation:"spin 8s linear infinite" }} />
        <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:"1px solid #22d3ee", borderTopColor:"transparent", animation:"spin 5s linear infinite reverse" }} />
      </div>
      {filtered.map((f, i) => {
        const isPinned = pinned?.id === f.id;
        if (isPinned) return null;
        const positions = [{l:"4%",t:"18%"},{l:"78%",t:"16%"},{l:"5%",t:"68%"},{l:"78%",t:"68%"},{l:"42%",t:"82%"}];
        const p = positions[i % positions.length];
        return (
          <div key={f.id} onClick={() => setPinned(f)} style={{ position:"absolute", left:p.l, top:p.t, width:165, padding:10, borderRadius:14, background:"rgba(8,47,73,.4)", backdropFilter:"blur(8px)", border:`1px solid ${f.color}`, cursor:"pointer", animation:`float 3s infinite, glow 2s infinite`, animationDelay:`${i * .4}s`, zIndex:10 }}>
            <div style={{ fontSize:10, letterSpacing:1, color:f.color }}>{f.type} • SYNCING {tick % 3 === 0 ? "●●●" : "●●"}</div>
            <div style={{ fontSize:13, marginTop:5, fontWeight:700 }}>{f.title}</div>
            <div style={{ fontSize:11, color:"#cbd5e1", marginTop:4 }}>{f.body}</div>
            <div style={{ fontSize:10, marginTop:8, color:"#67e8f9" }}>TAP TO OPEN →</div>
          </div>
        );
      })}
      {pinned && (
        <div style={{ position:"absolute", right:12, top:70, bottom:60, width:"min(340px, 92%)", background:"rgba(2,12,24,.92)", border:"1px solid #22d3ee", borderRadius:18, padding:14, zIndex:30, boxShadow:"0 0 50px #22d3ee", display:"flex", flexDirection:"column", overflow:"hidden", transform:`scale(${zoom})`, transformOrigin:"top right", transition:"transform .3s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, letterSpacing:2, color:"#67e8f9" }}>{pinned.type} • PAUSED</span>
            <button onClick={() => { setPinned(null); setZoom(1); }} style={{ background:"#ef4444", border:"none", color:"#fff", borderRadius:999, padding:"6px 10px", cursor:"pointer", fontSize:11 }}>✕ THROW AWAY</button>
          </div>
          <div style={{ fontSize:20, fontWeight:800, marginTop:10 }}>{pinned.title}</div>
          <div style={{ marginTop:10, background:"#0f172a", borderRadius:12, height:170, display:"flex", alignItems:"center", justifyContent:"center", fontSize:50, border:"1px solid #164e63" }}>▶️</div>
          <div style={{ marginTop:10, fontSize:13, color:"#cbd5e1", lineHeight:1.5, overflowY:"auto", flex:1 }}>{pinned.body}<br/><br/>This is live view. Scroll inside, check page. Others still syncing behind you.</div>
          <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
            <button style={{ flex:1, background:"#22d3ee", border:"none", padding:"10px", borderRadius:999, fontWeight:800, cursor:"pointer" }}>▶ PLAY</button>
            <button onClick={() => setZoom(zoom === 1 ? 1.25 : 1)} style={{ flex:1, background:"rgba(34,211,238,.2)", border:"1px solid #22d3ee", color:"#fff", padding:"10px", borderRadius:999, cursor:"pointer" }}>🔍 {zoom === 1 ? "ZOOM" : "ZOOM OUT"}</button>
            <button style={{ flex:1, background:"rgba(34,211,238,.2)", border:"1px solid #22d3ee", color:"#fff", padding:"10px", borderRadius:999, cursor:"pointer" }}>↗ OPEN PAGE</button>
          </div>
          <button onClick={() => setPinned(null)} style={{ marginTop:8, background:"transparent", border:"1px solid #475569", color:"#cbd5e1", padding:"9px", borderRadius:999, cursor:"pointer" }}>← BACK TO SYNCING</button>
        </div>
      )}
      <div style={{ position:"absolute", bottom:12, width:"100%", textAlign:"center", color:"#67e8f9", fontSize:10, letterSpacing:4 }}>EVA • PHASE 1 • HOLO ORBIT • LIVE SYNC</div>
    </div>
  );
                  }
