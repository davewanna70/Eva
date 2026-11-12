"use client";
import { useEffect, useState, useRef } from "react";

// POOL - boxes rotate, never permanent. New one comes when you trash one
const POOL = [
  { kind:"crypto", headline:"Crypto Live Market" },
  { kind:"news", headline:"World Live News" },
  { kind:"tiktok", headline:"Viral Live Now" },
  { kind:"sport", headline:"Football Live Score" },
  { kind:"hacker", headline:"Hacker Live Code" },
  { kind:"music", headline:"Music Trending Live" },
  { kind:"market", headline:"Dollar / Naira Live" },
  { kind:"space", headline:"Earth / Space Live" },
  { kind:"gaming", headline:"Gaming Live Stream" },
  { kind:"naija", headline:"Naija Live Now" },
];

const NEWS_ROTATE = [
  "BREAKING: Market moving fast right now",
  "JUST IN: New viral video blowing up",
  "LIVE: Fans reacting in comments",
  "UPDATE: Price changed again in last minute",
  "TRENDING: Everyone talking about this",
  "NEW: Another message just dropped",
  "LIVE: Crowd growing, views climbing",
  "FLASH: Something just happened",
];
const HACKER_LINES = [
  "> initializing eva_hud.exe ... OK",
  "> connecting to orbit ... 128ms",
  "> fetching live feed ...",
  "const price = await getLive('BTC');",
  "if (price > 79100) signal = 'DOWN';",
  "> syncing 342 nodes ...",
  "function stream() { return live; }",
  "> decrypting packet 0x8F2A ...",
  "npm run eva -- --live --hud",
  "> 1,204 viewers joined",
  "while(true) { update(); }",
  "> $ eva --orbit --sync",
  ">>> LIVE DATA STREAMING...",
];

function CryptoChart({ big=false }) {
  const [price, setPrice] = useState(79194.06);
  const [pts, setPts] = useState([40,38,44,36,42,48,35,46,38,52,44,50,42,56,48]);
  useEffect(()=>{
    const t=setInterval(()=>{
      setPrice(p=> Math.max(78500, Math.min(79800, p + (Math.random()-0.52)*28)));
      setPts(prev=> [...prev.slice(-14), 30 + Math.random()*35]);
    }, 800);
    return ()=>clearInterval(t);
  },[]);
  const down = price < 79200;
  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize: big?22:16, fontWeight:900, color: down ? "#ef4444" : "#22c55e" }}>${price.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        <span style={{ fontSize:10, fontWeight:900, background: down ? "#ef4444" : "#22c55e", color:"#fff", padding:"3px 7px", borderRadius:6 }}>{down ? "▼ DOWN" : "▲ UP"}</span>
      </div>
      <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>BTC / USDT • 15 min • Live</div>
      <svg viewBox="0 0 100 60" style={{ width:"100%", height: big?140:70, marginTop:6 }}>
        <polyline points={pts.map((y,i)=> `${i*7},${60-y}`).join(" ")} fill="none" stroke={down ? "#ef4444" : "#22c55e"} strokeWidth="2" />
        {pts.map((y,i)=> <circle key={i} cx={i*7} cy={60-y} r="1.8" fill={down ? "#ef4444" : "#22c55e"} />)}
      </svg>
      <div style={{ display:"flex", gap:4, marginTop:4 }}>
        {["1m","5m","15m","1H"].map((t,i)=> <span key={t} style={{ fontSize:9, padding:"3px 7px", borderRadius:999, background: i===2 ? "#22d3ee" : "rgba(255,255,255,.08)", color: i===2 ? "#000" : "#cbd5e1", fontWeight: i===2 ? 800 : 400 }}>{t}</span>)}
      </div>
      {big && <div style={{ fontSize:11, color:"#cbd5e1", marginTop:8, lineHeight:1.5 }}>Target: $79,100 • Support: $78,900<br/>Live trend: DOWN • Traders watching. Chart keeps moving, new candle every second.</div>}
    </div>
  );
}

function HackerBox({ big=false }) {
  const [lines, setLines] = useState(HACKER_LINES.slice(0,4));
  useEffect(()=>{
    let idx=4;
    const t=setInterval(()=>{
      setLines(prev=> [...prev.slice(-(big?10:4)), HACKER_LINES[idx % HACKER_LINES.length]]);
      idx++;
    }, 900);
    return ()=>clearInterval(t);
  },[big]);
  return (
    <div style={{ fontFamily:"monospace", fontSize: big?12:10, lineHeight:1.5, color:"#4ade80", width:"100%", minHeight: big?140:70, overflow:"hidden" }}>
      {lines.map((l,i)=> <div key={i} style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l}</div>)}
      <div style={{ color:"#22ff88" }}>▋</div>
      {big && <div style={{ color:"#94a3b8", marginTop:6 }}>EVA terminal • Live code running • Auto-syncing</div>}
    </div>
  );
}

function RotatingText({ kind }) {
  const [idx, setIdx] = useState(0);
  useEffect(()=>{
    const t=setInterval(()=> setIdx(v=> (v+1)%NEWS_ROTATE.length), 3000);
    return ()=>clearInterval(t);
  },[]);
  return <div style={{ fontSize:11, color:"#e2e8f0", lineHeight:1.4, minHeight:32 }}>{NEWS_ROTATE[(idx + kind.length) % NEWS_ROTATE.length]}</div>;
}

export default function EvaPhase1() {
  const [boxes, setBoxes] = useState(()=> POOL.slice(0,5).map((p,i)=> ({ ...p, uid: Date.now()+i })));
  const [pinned, setPinned] = useState(null);
  const [search, setSearch] = useState("");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState("");
  const longPressRef = useRef(null);
  const startYRef = useRef(0);
  const activeUidRef = useRef(null);

  const showToast = (t)=> { setToast(t); setTimeout(()=> setToast(""), 1800); };

  // Spawn a new different box when one is trashed
  const spawnNew = (removeUid) => {
    const usedKinds = boxes.filter(b=> b.uid!==removeUid).map(b=> b.kind);
    const candidates = POOL.filter(p=> !usedKinds.includes(p.kind));
    const pick = candidates[Math.floor(Math.random()*candidates.length)] || POOL[0];
    setBoxes(prev=> [...prev.filter(b=> b.uid!==removeUid), { ...pick, uid: Date.now()+Math.random() }]);
    showToast(`🗑️ Trashed • New box: ${pick.headline} arrived`);
  };

  const handleTrash = (uid) => { spawnNew(uid); if(pinned?.uid===uid) setPinned(null); };

  // LONG PRESS + THROW logic
  const onTouchStart = (e, box, isPinned) => {
    const y = e.touches[0].clientY;
    startYRef.current = y; activeUidRef.current = box.uid; setDragY(0);
    longPressRef.current = setTimeout(()=> { setDragging(true); if(!isPinned) setShowTrash(true); }, 350);
  };
  const onTouchMove = (e, box, isPinned) => {
    if(!dragging) { if(longPressRef.current) clearTimeout(longPressRef.current); return; }
    const y = e.touches[0].clientY;
    setDragY(y - startYRef.current);
  };
  const onTouchEnd = (e, box, isPinned) => {
    if(longPressRef.current) clearTimeout(longPressRef.current);
    if(!dragging) { // normal tap = open
      if(!isPinned) setPinned(box);
      return;
    }
    // dragging ended
    if(isPinned) {
      if(dragY < -100) { setPinned(null); showToast("↩️ Thrown up • Back to syncing"); }
    } else {
      if(dragY > 100) { handleTrash(box.uid); }
    }
    setDragging(false); setDragY(0); setShowTrash(false);
  };

  const renderContent = (box, big=false) => {
    if(box.kind==="crypto" || box.kind==="market") return <CryptoChart big={big} />;
    if(box.kind==="hacker") return <HackerBox big={big} />;
    return <RotatingText kind={box.kind} />;
  };

  const filtered = boxes.filter(b=> b.headline.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position:"fixed", inset:0, background:"radial-gradient(circle at 50% 50%, #04121f, #000 78%)", overflow:"hidden", fontFamily:"sans-serif", color:"#fff", touchAction:"pan-y" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      {/* SEARCH - very light */}
      <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", zIndex:40, display:"flex", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(34,211,238,.3)", borderRadius:999, padding:"6px 6px 6px 14px", backdropFilter:"blur(6px)", width:"min(420px, 92%)" }}>
        <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="🔍 Search orbit..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:13, minWidth:0 }} />
        <button onClick={()=> setSearch("")} style={{ background:"rgba(34,211,238,.15)", border:"none", borderRadius:999, padding:"8px 14px", fontWeight:800, cursor:"pointer", color:"#fff", flexShrink:0 }}>CLEAR</button>
      </div>

      {/* EARTH */}
      <div style={{ position:"absolute", left:"50%", top:"54%", transform:"translate(-50%,-50%)", width:230, height:230, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #1e3a8a, #020617 65%)", border:"1px solid rgba(34,211,238,.5)", boxShadow:"0 0 60px rgba(34,211,238,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:120, zIndex:5 }}>
        🌍
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"1px dashed rgba(34,211,238,.4)", animation:"spin 10s linear infinite" }} />
      </div>

      {/* HINT */}
      <div style={{ position:"absolute", top:58, left:"50%", transform:"translateX(-50%)", zIndex:30, fontSize:10, color:"rgba(255,255,255,.45)", letterSpacing:1, whiteSpace:"nowrap", background:"rgba(0,0,0,.25)", padding:"4px 10px", borderRadius:999 }}>
        LONG-PRESS + THROW UP TO GO BACK • THROW DOWN TO TRASH
      </div>

      {/* BOXES - VERY TRANSPARENT */}
      {filtered.map((box,i)=>{
        if(pinned?.uid===box.uid) return null;
        const pos = [{l:"3%",t:"16%"},{l:"62%",t:"15%"},{l:"3%",t:"68%"},{l:"62%",t:"68%"},{l:"32%",t:"84%"}][i%5];
        const isActiveDrag = dragging && activeUidRef.current===box.uid;
        return (
          <div key={box.uid}
            onTouchStart={e=> onTouchStart(e,box,false)}
            onTouchMove={e=> onTouchMove(e,box,false)}
            onTouchEnd={e=> onTouchEnd(e,box,false)}
            onClick={()=> { if(!dragging) setPinned(box); }}
            style={{ position:"absolute", left:pos.l, top:pos.t, width:162, padding:10, borderRadius:16,
              background: isActiveDrag ? "rgba(34,211,238,.15)" : "rgba(255,255,255,0.04)",
              backdropFilter:"blur(2px)", border:"1px solid rgba(255,255,255,0.12)",
              cursor:"grab", animation: isActiveDrag ? "none" : "floaty 4s infinite", animationDelay:`${i*.5}s`, zIndex: isActiveDrag?50:10,
              transform: isActiveDrag ? `translateY(${dragY}px) scale(1.05)` : "none", transition: isActiveDrag ? "none" : "transform .2s", opacity: isActiveDrag && dragY>80 ? 0.5 : 1
            }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:.3, lineHeight:1.2 }}>{box.headline}</div>
            <div style={{ marginTop:7 }}>{renderContent(box,false)}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", marginTop:6 }}>TAP TO OPEN • HOLD TO THROW</div>
          </div>
        );
      })}

      {/* TRASH ZONE - appears when you long-press a box */}
      {showTrash && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:110, zIndex:60, background: dragY>80 ? "rgba(239,68,68,.35)" : "rgba(239,68,68,.15)", borderTop:"2px dashed #ef4444", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
          <div style={{ fontSize:32 }}>🗑️</div>
          <div style={{ fontSize:12, fontWeight:800 }}>DRAG HERE TO TRASH • NEW BOX WILL COME</div>
        </div>
      )}

      {/* PINNED - BIG BOX */}
      {pinned && (
        <div
          onTouchStart={e=> onTouchStart(e,pinned,true)}
          onTouchMove={e=> onTouchMove(e,pinned,true)}
          onTouchEnd={e=> onTouchEnd(e,pinned,true)}
          style={{ position:"absolute", left:"50%", top:"50%", transform:`translate(-50%,-50%) translateY(${dragging?dragY:0}px)`, width:"min(360px, 92%)", background:"rgba(2,12,24,.72)", border:"1px solid rgba(34,211,238,.35)", borderRadius:20, padding:16, zIndex:40, backdropFilter:"blur(8px)", boxShadow:"0 0 40px rgba(34,211,238,.2)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, fontWeight:900 }}>{pinned.headline} • LIVE</span>
            <span style={{ fontSize:10, color:"#67e8f9", background:"rgba(34,211,238,.12)", padding:"4px 8px", borderRadius:999 }}>● LIVE</span>
          </div>
          <div style={{ marginTop:12 }}>{renderContent(pinned,true)}</div>
          <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,.55)", textAlign:"center", borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:10 }}>
            {dragging ? (dragY < -60 ? "↗ Release to throw back to syncing!" : "Hold + Throw UP to go back") : "👆 Long-press this box + throw it UP to go back to syncing"}
          </div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <button style={{ flex:1, background:"#22d3ee", border:"none", padding:"11px", borderRadius:999, fontWeight:900, cursor:"pointer" }}>▶ PLAY</button>
            <button onClick={()=> handleTrash(pinned.uid)} style={{ flex:1, background:"rgba(239,68,68,.15)", border:"1px solid #ef4444", color:"#fff", padding:"11px", borderRadius:999, cursor:"pointer" }}>🗑️ TRASH + NEW</button>
          </div>
        </div>
      )}

      {toast && <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:80, background:"rgba(0,0,0,.85)", border:"1px solid rgba(34,211,238,.4)", padding:"9px 16px", borderRadius:999, fontSize:12, whiteSpace:"nowrap" }}>{toast}</div>}
      <div style={{ position:"absolute", bottom:8, width:"100%", textAlign:"center", color:"rgba(103,232,249,.6)", fontSize:9, letterSpacing:3 }}>EVA • PHASE 2 • HOLO ORBIT • ROTATING LIVE</div>
    </div>
  );
  }
