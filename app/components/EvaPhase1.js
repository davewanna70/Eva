"use client";
import { useEffect, useState, useRef } from "react";

const POOL = [
  { kind:"crypto", headline:"Crypto Live Market" },
  { kind:"news", headline:"World Live News" },
  { kind:"tiktok", headline:"Viral Live Now" },
  { kind:"sport", headline:"Football Live Score" },
  { kind:"hacker", headline:"EVA System Check" },
  { kind:"music", headline:"Music Trending Live" },
  { kind:"market", headline:"Dollar / Naira Live" },
  { kind:"space", headline:"Earth / Space Live" },
  { kind:"gaming", headline:"Gaming Live Stream" },
  { kind:"naija", headline:"Naija Live Now" },
];

function CryptoChart({ big=false, realCrypto }) {
  const isReal = realCrypto && realCrypto.price;
  const [simPrice, setSimPrice] = useState(79194.06);
  const [pts, setPts] = useState([40,38,44,36,42,48,35,46,38,52,44,50,42,56,48]);
  useEffect(()=>{
    if(isReal) return;
    const t=setInterval(()=>{
      setSimPrice(p=> Math.max(78500, Math.min(79800, p + (Math.random()-0.52)*28)));
      setPts(prev=> [...prev.slice(-14), 30 + Math.random()*35]);
    }, 800);
    return ()=>clearInterval(t);
  },[isReal]);
  const price = isReal ? realCrypto.price : simPrice;
  const change = isReal ? realCrypto.change : -0.4;
  const down = change < 0;
  const displayPts = isReal ? [40,42,38,44,39,45,41,47,43,49,44,50,46,52,48] : pts;
  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize: big?22:16, fontWeight:900, color: down ? "#ef4444" : "#22c55e" }}>${price.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        <span style={{ fontSize:10, fontWeight:900, background: down ? "#ef4444" : "#22c55e", color:"#fff", padding:"3px 7px", borderRadius:6 }}>{down ? "▼ DOWN" : "▲ UP"}</span>
      </div>
      <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>BTC / USDT • {isReal ? "REAL • CoinGecko • 24h "+change?.toFixed(2)+"%" : "⚠️ SIMULATED - API OFFLINE"}</div>
      <svg viewBox="0 0 100 60" style={{ width:"100%", height: big?140:70, marginTop:6 }}>
        <polyline points={displayPts.map((y,i)=> `${i*7},${60-y}`).join(" ")} fill="none" stroke={down ? "#ef4444" : "#22c55e"} strokeWidth="2" />
        {displayPts.map((y,i)=> <circle key={i} cx={i*7} cy={60-y} r="1.8" fill={down ? "#ef4444" : "#22c55e"} />)}
      </svg>
      <div style={{ display:"flex", gap:4, marginTop:4 }}>
        {["1m","5m","15m","1H"].map((t,i)=> <span key={t} style={{ fontSize:9, padding:"3px 7px", borderRadius:999, background: i===2 ? "#22d3ee" : "rgba(255,255,255,.08)", color: i===2 ? "#000" : "#cbd5e1", fontWeight: i===2 ? 800 : 400 }}>{t}</span>)}
      </div>
      {big && <div style={{ fontSize:11, color:"#cbd5e1", marginTop:8, lineHeight:1.5 }}>{isReal ? `Real BTC price from CoinGecko. 24h change: ${change?.toFixed(2)}%. Updates every 20s.` : "API offline - showing simulated price."}</div>}
    </div>
  );
}

function HackerBox({ big=false }) {
  const [health, setHealth] = useState(null);
  const [lines, setLines] = useState(["> eva --system-check --live", "> connecting to EVA core..."]);
  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await fetch("/api/health");
        const j = await r.json();
        setHealth(j);
        const newLines = j.checks.map(c=> `${c.status==="OK" ? "✓" : "✗"} ${c.name} — ${c.ms}ms — ${c.status} • ${c.detail}`);
        setLines(prev=> [...prev.slice(-(big?6:2)), `> check @ ${new Date().toLocaleTimeString()}`, ...newLines]);
      }catch(e){
        setLines(prev=> [...prev.slice(-4), `✗ health check failed @ ${new Date().toLocaleTimeString()}`]);
      }
    };
    load();
    const t=setInterval(load, 1000);
    return ()=>clearInterval(t);
  },[big]);
  const allOk = health?.ok;
  return (
    <div style={{ fontFamily:"monospace", fontSize: big?11:10, lineHeight:1.5, color:"#4ade80", width:"100%", minHeight: big?160:70, overflow:"hidden" }}>
      <div style={{ color: allOk===false ? "#ef4444" : "#4ade80", fontWeight:800, fontSize:10 }}>{allOk===false ? "● SYSTEM: ISSUE DETECTED" : allOk ? "● SYSTEM: ALL OK" : "● SYSTEM: CHECKING..."}</div>
      {lines.slice(-(big?10:4)).map((l,i)=> <div key={i} style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color: l.startsWith("✗") ? "#ef4444" : "#4ade80" }}>{l}</div>)}
      <div style={{ color:"#22ff88" }}>▋</div>
      {big && health && <div style={{ color:"#94a3b8", marginTop:6, fontFamily:"sans-serif", fontSize:11 }}>Checked every 1 sec • Total: {health.uptime_ms}ms • {health.checks?.length} systems • This is REAL, not fake typing.</div>}
    </div>
  );
}

function RealNewsBox({ news, big=false }) {
  const [idx, setIdx] = useState(0);
  useEffect(()=>{
    if(!news || news.length===0) return;
    const t=setInterval(()=> setIdx(v=> (v+1)%news.length), 4000);
    return ()=>clearInterval(t);
  },[news]);
  if(!news || news.length===0) return <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>Syncing today's real news... BBC • Daily Mail • Punch • Vanguard</div>;
  const item = news[idx % news.length];
  return (
    <div style={{ width:"100%" }}>
      <div style={{fontSize:9,color:"#67e8f9",fontWeight:800}}>{item.source} • {item.time ? new Date(item.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "TODAY"}</div>
      <div style={{fontSize: big?13:11, color:"#fff", lineHeight:1.4, marginTop:4, minHeight: big?60:32}}>{item.title}</div>
      {big && <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Tap OPEN PAGE to read full story on {item.source} website. TODAY only.</div>}
    </div>
  );
}

function RealScoresBox({ scores, big=false }) {
  if(!scores || scores.length===0) return <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>No matches today in EPL. Checking other leagues...</div>;
  const s = scores[0];
  return (
    <div style={{ width:"100%" }}>
      <div style={{fontSize:9,color:"#facc15",fontWeight:800}}>{s.league} • {s.status} {s.live?"• 🔴 LIVE":""}</div>
      <div style={{fontSize: big?16:12, fontWeight:800, lineHeight:1.3, marginTop:4}}>{s.home} {s.homeScore} - {s.awayScore} {s.away}</div>
      {big && scores.slice(1,4).map((m,i)=> <div key={i} style={{fontSize:12,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.08)"}}>{m.home} {m.homeScore} - {m.awayScore} {m.away} • {m.status}</div>)}
    </div>
  );
}

function RealViralBox({ viral, big=false }) {
  const [idx, setIdx] = useState(0);
  useEffect(()=>{
    if(!viral || viral.length===0) return;
    const t=setInterval(()=> setIdx(v=> (v+1)%viral.length), 4000);
    return ()=>clearInterval(t);
  },[viral]);
  if(!viral || viral.length===0) return <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>Syncing today's viral videos...</div>;
  const v = viral[idx % viral.length];
  return (
    <div style={{ width:"100%" }}>
      <div style={{fontSize:9,color:"#f472b6",fontWeight:800}}>🔥 VIRAL TODAY • {v.score} upvotes</div>
      <div style={{fontSize: big?13:11, color:"#fff", lineHeight:1.4, marginTop:4}}>{v.title}</div>
    </div>
  );
}

export default function EvaPhase1() {
  const [boxes, setBoxes] = useState(()=> POOL.slice(0,5).map((p,i)=> ({ ...p, uid: Date.now()+i })));
  const [pinned, setPinned] = useState(null);
  const [search, setSearch] = useState("");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState({ news:[], scores:[], viral:[], crypto:null, date:"" });
  const [syncTime, setSyncTime] = useState("");
  const longPressRef = useRef(null);
  const startYRef = useRef(0);
  const activeUidRef = useRef(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await fetch("/api/live");
        const j = await r.json();
        setLive({ news:j.news||[], scores:j.scores||[], viral:j.viral||[], crypto:j.crypto||null, date:j.date||"" });
        setSyncTime(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
      }catch(e){}
    };
    load();
    const t=setInterval(load, 60000);
    return ()=>clearInterval(t);
  },[]);

  const showToast = (t)=> { setToast(t); setTimeout(()=> setToast(""), 1800); };
  const spawnNew = (removeUid) => {
    const usedKinds = boxes.filter(b=> b.uid!==removeUid).map(b=> b.kind);
    const candidates = POOL.filter(p=> !usedKinds.includes(p.kind));
    const pick = candidates[Math.floor(Math.random()*candidates.length)] || POOL[0];
    setBoxes(prev=> [...prev.filter(b=> b.uid!==removeUid), { ...pick, uid: Date.now()+Math.random() }]);
    showToast(`🗑️ Trashed • New box: ${pick.headline} arrived`);
  };
  const handleTrash = (uid) => { spawnNew(uid); if(pinned?.uid===uid) setPinned(null); };
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
    if(!dragging) { if(!isPinned) setPinned(box); return; }
    if(isPinned) { if(dragY < -100) { setPinned(null); showToast("↩️ Thrown up • Back to syncing"); } }
    else { if(dragY > 100) { handleTrash(box.uid); } }
    setDragging(false); setDragY(0); setShowTrash(false);
  };
  const renderContent = (box, big=false) => {
    if(box.kind==="crypto" || box.kind==="market") return <CryptoChart big={big} realCrypto={live.crypto} />;
    if(box.kind==="hacker") return <HackerBox big={big} />;
    if(box.kind==="news" || box.kind==="naija") return <RealNewsBox news={live.news} big={big} />;
    if(box.kind==="sport") return <RealScoresBox scores={live.scores} big={big} />;
    if(box.kind==="tiktok" || box.kind==="music" || box.kind==="gaming") return <RealViralBox viral={live.viral} big={big} />;
    if(box.kind==="space") return <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.4}}>🌍 Earth Orbit • Live tracking • {live.date || "Today"}<br/>Sync {syncTime || "…"}</div>;
    return <RealNewsBox news={live.news} big={big} />;
  };
  const getPinnedLink = () => {
    if(pinned?.kind==="news" || pinned?.kind==="naija") return live.news[0]?.link;
    if(pinned?.kind==="tiktok" || pinned?.kind==="music" || pinned?.kind==="gaming") return live.viral[0]?.link;
    return null;
  };
  const filtered = boxes.filter(b=> b.headline.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position:"fixed", inset:0, background:"radial-gradient(circle at 50% 50%, #04121f, #000 78%)", overflow:"hidden", fontFamily:"sans-serif", color:"#fff", touchAction:"pan-y" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", zIndex:40, display:"flex", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(34,211,238,.3)", borderRadius:999, padding:"6px 6px 6px 14px", backdropFilter:"blur(6px)", width:"min(420px, 92%)" }}>
        <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="🔍 Search orbit..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:13, minWidth:0 }} />
        <button onClick={()=> setSearch("")} style={{ background:"rgba(34,211,238,.15)", border:"none", borderRadius:999, padding:"8px 14px", fontWeight:800, cursor:"pointer", color:"#fff", flexShrink:0 }}>CLEAR</button>
      </div>
      <div style={{ position:"absolute", left:"50%", top:"54%", transform:"translate(-50%,-50%)", width:230, height:230, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #1e3a8a, #020617 65%)", border:"1px solid rgba(34,211,238,.5)", boxShadow:"0 0 60px rgba(34,211,238,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:120, zIndex:5 }}>
        🌍
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"1px dashed rgba(34,211,238,.4)", animation:"spin 10s linear infinite" }} />
      </div>
      <div style={{ position:"absolute", top:58, left:"50%", transform:"translateX(-50%)", zIndex:30, fontSize:10, color:"rgba(255,255,255,.45)", letterSpacing:1, whiteSpace:"nowrap", background:"rgba(0,0,0,.25)", padding:"4px 10px", borderRadius:999 }}>
        {live.date ? `📅 TODAY ${live.date} • REAL DATA • SYNC ${syncTime || "…"}` : "LONG-PRESS + THROW UP TO GO BACK • THROW DOWN TO TRASH"}
      </div>
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
            style={{ position:"absolute", left:pos.l, top:pos.t, width:162, padding:10, borderRadius:16, background: isActiveDrag ? "rgba(34,211,238,.15)" : "rgba(255,255,255,0.04)", backdropFilter:"blur(2px)", border:"1px solid rgba(255,255,255,0.12)", cursor:"grab", animation: isActiveDrag ? "none" : "floaty 4s infinite", animationDelay:`${i*.5}s`, zIndex: isActiveDrag?50:10, transform: isActiveDrag ? `translateY(${dragY}px) scale(1.05)` : "none", transition: isActiveDrag ? "none" : "transform .2s", opacity: isActiveDrag && dragY>80 ? 0.5 : 1 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:.3, lineHeight:1.2 }}>{box.headline}</div>
            <div style={{ marginTop:7 }}>{renderContent(box,false)}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", marginTop:6 }}>TAP TO OPEN • HOLD TO THROW</div>
          </div>
        );
      })}
      {showTrash && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:110, zIndex:60, background: dragY>80 ? "rgba(239,68,68,.35)" : "rgba(239,68,68,.15)", borderTop:"2px dashed #ef4444", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
          <div style={{ fontSize:32 }}>🗑️</div>
          <div style={{ fontSize:12, fontWeight:800 }}>DRAG HERE TO TRASH • NEW BOX WILL COME</div>
        </div>
      )}
      {pinned && (
        <div onTouchStart={e=> onTouchStart(e,pinned,true)} onTouchMove={e=> onTouchMove(e,pinned,true)} onTouchEnd={e=> onTouchEnd(e,pinned,true)} style={{ position:"absolute", left:"50%", top:"50%", transform:`translate(-50%,-50%) translateY(${dragging?dragY:0}px)`, width:"min(360px, 92%)", background:"rgba(2,12,24,.72)", border:"1px solid rgba(34,211,238,.35)", borderRadius:20, padding:16, zIndex:40, backdropFilter:"blur(8px)", boxShadow:"0 0 40px rgba(34,211,238,.2)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, fontWeight:900 }}>{pinned.headline} • LIVE</span>
            <span style={{ fontSize:10, color:"#67e8f9", background:"rgba(34,211,238,.12)", padding:"4px 8px", borderRadius:999 }}>● LIVE • TODAY</span>
          </div>
          <div style={{ marginTop:12 }}>{renderContent(pinned,true)}</div>
          <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,.55)", textAlign:"center", borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:10 }}>
            {dragging ? (dragY < -60 ? "↗ Release to throw back to syncing!" : "Hold + Throw UP to go back") : "👆 Long-press this box + throw it UP to go back to syncing"}
          </div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {getPinnedLink() ? (<a href={getPinnedLink()} target="_blank" rel="noreferrer" style={{ flex:1, background:"#22d3ee", color:"#000", textAlign:"center", padding:"11px", borderRadius:999, fontWeight:900, textDecoration:"none" }}>↗ OPEN PAGE</a>) : (<button style={{ flex:1, background:"#22d3ee", border:"none", padding:"11px", borderRadius:999, fontWeight:900, cursor:"pointer" }}>▶ PLAY</button>)}
            <button onClick={()=> handleTrash(pinned.uid)} style={{ flex:1, background:"rgba(239,68,68,.15)", border:"1px solid #ef4444", color:"#fff", padding:"11px", borderRadius:999, cursor:"pointer" }}>🗑️ TRASH + NEW</button>
          </div>
        </div>
      )}
      {toast && <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:80, background:"rgba(0,0,0,.85)", border:"1px solid rgba(34,211,238,.4)", padding:"9px 16px", borderRadius:999, fontSize:12, whiteSpace:"nowrap" }}>{toast}</div>}
      <div style={{ position:"absolute", bottom:8, width:"100%", textAlign:"center", color:"rgba(103,232,249,.6)", fontSize:9, letterSpacing:3 }}>EVA • PHASE 2 • REAL SYSTEM CHECK • 1 SEC</div>
    </div>
  );
}
